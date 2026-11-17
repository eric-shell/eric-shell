import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import ts from 'typescript'
import { allowlist } from './ui-vocabulary.allowlist'

/**
 * The UI vocabulary, enforced.
 *
 * The site has one palette and one set of radii and shadows, all declared in
 * the `@theme` block of src/index.css. This test reads the class strings in
 * the source and fails on anything outside that set, so a value that is not a
 * token cannot arrive unnoticed.
 *
 * It parses each file with the TypeScript compiler and looks only at string
 * literals and template chunks. Comments and JSX prose are therefore never
 * scanned, which is what keeps a rule like "no `backdrop-`" from tripping on a
 * sentence explaining why there is none.
 *
 * Sizes are deliberately out of scope: `text-[clamp(…)]`, `w-[7.75rem]`,
 * `calc()` and opacity brackets like `bg-white/[0.055]` are all legal.
 */

const ROOT = resolve(import.meta.dirname, '..')
const SCAN_DIRS = ['src/components', 'src/lib', 'src/admin', 'src/hooks']
const SCAN_FILES = ['src/App.tsx', 'src/main.tsx', 'src/entry-server.tsx']
/** Generated data and prose, not UI. */
const EXCLUDED = [/^src\/lib\/displayKerning\.ts$/]

const BASELINE_PATH = join(ROOT, 'tests/ui-vocabulary.baseline.json')

type Rule = 'palette' | 'literal' | 'blur' | 'removed' | 'radius' | 'shadow' | 'colour'

interface Violation {
  file: string
  line: number
  token: string
  rule: Rule
  fix: string
}

// ── Tokens, read from the stylesheet so the test cannot drift from it ──────────

const css = readFileSync(join(ROOT, 'src/index.css'), 'utf8')
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
const themeBody = /@theme\s*\{([^}]*)\}/.exec(cssNoComments)?.[1] ?? ''

function themeTokens(namespace: string): Map<string, string> {
  const found = new Map<string, string>()
  const re = new RegExp(`--${namespace}-([a-z0-9-]+)\\s*:\\s*([^;]+);`, 'g')
  for (const m of themeBody.matchAll(re)) found.set(m[1], m[2].trim())
  return found
}

/**
 * The pre-Luminous ramps. They are still declared while the migration runs, so
 * they are named here to be refused anyway; once the declarations are deleted
 * this filter matches nothing.
 */
const LEGACY_COLOUR = /^(?:(?:blue|red|green|amber)-\d|accent(?:-deep)?$|warning(?:-hover)?$)/

const colourTokens = new Map([...themeTokens('color')].filter(([name]) => !LEGACY_COLOUR.test(name)))
const radiusTokens = themeTokens('radius')

// ── Rules ──────────────────────────────────────────────────────────────────────

/** Every utility prefix that takes a colour. */
const P =
  '(?:text|bg|border(?:-[xytrblse])?|ring(?:-offset)?|inset-ring|outline|from|via|to|fill|stroke|decoration|divide|placeholder|caret|accent|shadow|inset-shadow|text-shadow|drop-shadow)'

const RAMP_CLASS = new RegExp(`^-?${P}-([a-z]+-(?:50|[1-9]00|950)(?:-[a-z]+)?)(?:/.+)?$`)
const NAMED_LEGACY_CLASS = new RegExp(`^-?${P}-(accent|accent-deep|warning|warning-hover)(?:/.+)?$`)
const HEX = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![0-9a-z])/i
const WHOLE_HEX = /^#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})$/i
/** A colour written out. `color-mix()` is not one: it is how tokens are combined. */
const COLOUR_FN = /\b(?:rgba?|hsla?|oklch|oklab)\(/
const BLUR_CLASS = /^(?:backdrop-|\[(?:-webkit-)?backdrop-filter:)/
const REMOVED_VARIANT = /^(?:glass-light|glass-dark|error-glass|success-glass)$/
const REMOVED_UTILITY =
  /^(?:glass-blur|bg-noise|noise-overlay|cascade-fade|skew-(?:section|footer|inner|hero)|unskew-(?:inner|hero)|animate-(?:glass-in|ambient-(?:a|b|c|hue|parallax)))$/
const ARBITRARY_RADIUS = /^rounded(?:-(?:[trblse]|[tb][lr]|[se][se]))?-\[/
const ARBITRARY_SHADOW = /^(?:(?:shadow|inset-shadow|drop-shadow|text-shadow)-\[|\[(?:box-shadow|text-shadow|filter):)/
/** Tailwind's own shadow scale. The theme clears it, so these would emit nothing. */
const DEFAULT_SHADOW = /^(?:shadow|inset-shadow)-(?:2xs|xs|sm|md|lg|xl|2xl)$/
/** Tailwind's own text-shadow sizes plus the theme's. */
const TEXT_SHADOWS = new Set(['none', '2xs', 'xs', 'sm', 'md', 'lg', ...themeTokens('text-shadow').keys()])
const ARBITRARY_COLOUR = new RegExp(
  `^(?:${P}-\\[(?!length:|size:|position:|url\\()(?:color:|#|(?:rgba?|hsla?|oklch|oklab|color-mix|--alpha)\\(|var\\(--color-|.*gradient\\()` +
    `|\\[(?:color|background(?:-color|-image)?|[a-z-]+-color|-webkit-text-stroke(?:-color)?):)`,
)

const LEGACY_HINT: Record<string, string> = {
  'blue-950': 'ink',
  'blue-900': 'ink-soft (body copy) or ink-mute (meta)',
  'blue-800': 'ink-soft',
  'blue-700': 'lum or lum-deep',
  'blue-600': 'lum',
  'blue-500': 'lum',
  'blue-400': 'glow (non-text) or lum',
  'blue-200': 'ink/10 (a hairline) or ice',
  'blue-100': 'ice',
  'blue-50': 'ice',
  'red-950': 'error-deep',
  'red-400': 'error-bright',
  'green-950': 'success-deep',
  'green-400': 'success-bright',
  'amber-400': 'warning-bright',
  accent: 'data',
  'accent-deep': 'data-deep',
}

const TAILWIND_RADII: [string, number][] = [
  ['sm', 4], ['md', 6], ['lg', 8], ['xl', 12], ['2xl', 16], ['3xl', 24], ['4xl', 32],
]

function nearestRadius(token: string): string {
  const px = /\[(\d+(?:\.\d+)?)px\]/.exec(token)
  if (!px) return 'a named radius'
  const want = Number(px[1])
  const all: [string, number][] = [
    ...TAILWIND_RADII,
    ...[...radiusTokens].map(([name, value]): [string, number] => [name, parseFloat(value)]),
  ]
  const [name, value] = all.reduce((a, b) => (Math.abs(b[1] - want) < Math.abs(a[1] - want) ? b : a))
  return `rounded-${name} (${value}px)`
}

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace('#', '')
  const full = h.length <= 4 ? [...h].map(c => c + c).join('') : h
  if (full.length < 6) return null
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16)) as [number, number, number]
}

function nearestColour(literal: string): string {
  const hex = HEX.exec(literal)?.[0]
  const want = hex && hexToRgb(hex)
  if (!want) return 'a colour token'
  let best = ''
  let bestDistance = Infinity
  for (const [name, value] of colourTokens) {
    const rgb = WHOLE_HEX.test(value) ? hexToRgb(value) : null
    if (!rgb) continue
    const d = rgb.reduce((sum, c, i) => sum + (c - want[i]) ** 2, 0)
    if (d < bestDistance) [best, bestDistance] = [name, d]
  }
  return best ? `${best} (nearest token to ${hex})` : 'a colour token'
}

const TAIL =
  'A new value goes in @theme in src/index.css (and src/components/ui/cn.ts), a bespoke effect in an @utility there, or in tests/ui-vocabulary.allowlist.ts with a reason.'

/** Strip variants (`md:`, `group-hover:`, `has-[a:focus]:`) and `!`, keeping the utility. */
function utilityOf(token: string): string {
  const parts = token.split(/:(?![^[]*\])/)
  return parts[parts.length - 1].replace(/^!|!$/g, '')
}

function checkLiteral(text: string): Omit<Violation, 'file' | 'line'>[] {
  const found: Omit<Violation, 'file' | 'line'>[] = []
  const add = (token: string, rule: Rule, fix: string) => found.push({ token, rule, fix })

  if (WHOLE_HEX.test(text.trim())) {
    add(text.trim(), 'literal', `Use var(--color-…): ${nearestColour(text)}.`)
    return found
  }
  if ((COLOUR_FN.test(text) || (text.includes('color-mix(') && HEX.test(text))) && !/\s/.test(text.trim().split('(')[0])) {
    // A CSS value held in a string (an inline style, a chart theme), not a class list.
    if (!/[a-z]-\[/.test(text)) {
      add(text.trim().slice(0, 80), 'literal', 'Build the value from tokens: var(--color-…) or var(--shadow-…).')
      return found
    }
  }

  for (const token of text.split(/\s+/).filter(Boolean)) {
    const utility = utilityOf(token)

    if (/(?:^|:)dark:/.test(token) || token.startsWith('dark:')) {
      add(token, 'removed', 'There is no dark mode and no dark: variants.')
      continue
    }
    if (REMOVED_VARIANT.test(token)) {
      add(token, 'removed', 'Variant removed. Use tint-white, tint-ink, notice-error or notice-success.')
      continue
    }
    if (REMOVED_UTILITY.test(utility)) {
      add(token, 'removed', 'Utility removed with the pre-Luminous UI.')
      continue
    }
    if (BLUR_CLASS.test(utility)) {
      add(token, 'blur', 'Nothing on the site uses backdrop-filter. Use a flat tint variant.')
      continue
    }

    const ramp = RAMP_CLASS.exec(utility) ?? NAMED_LEGACY_CLASS.exec(utility)
    if (ramp && !colourTokens.has(ramp[1])) {
      const hint = LEGACY_HINT[ramp[1]] ?? LEGACY_HINT[ramp[1].replace(/-vivid$/, '')]
      add(token, 'palette', hint ? `Not a token. Use ${hint}.` : `Not a token. The palette is: ${[...colourTokens.keys()].join(', ')}.`)
      continue
    }

    if (ARBITRARY_RADIUS.test(utility)) {
      add(token, 'radius', `Use ${nearestRadius(utility)}.`)
      continue
    }
    if (ARBITRARY_SHADOW.test(utility)) {
      add(token, 'shadow', 'Use a named shadow (shadow-card, shadow-float, inset-shadow-highlight, text-shadow-poster …).')
      continue
    }
    if (DEFAULT_SHADOW.test(utility)) {
      add(token, 'shadow', `Not in the theme. Use one of: ${[...themeTokens('shadow').keys()].map(n => `shadow-${n}`).join(', ')}.`)
      continue
    }
    // Tailwind's text-shadow scale stops at `lg`. A size past it compiles to
    // nothing and looks like it works: the hero carried `text-shadow-xl` for
    // months and never had a shadow.
    const textShadow = /^text-shadow-(?!\[)([a-z0-9-]+)$/.exec(utility)?.[1]
    if (textShadow && !TEXT_SHADOWS.has(textShadow) && !colourTokens.has(textShadow)) {
      add(token, 'shadow', `No such text shadow. Use one of: ${[...TEXT_SHADOWS].map(n => `text-shadow-${n}`).join(', ')}.`)
      continue
    }
    if (ARBITRARY_COLOUR.test(utility)) {
      add(token, 'colour', `Use ${nearestColour(utility)}, or move the effect into an @utility in src/index.css.`)
      continue
    }
    if (/\[[^\]]*\]/.test(utility) && (HEX.test(/\[([^\]]*)\]/.exec(utility)?.[1] ?? '') || COLOUR_FN.test(utility))) {
      add(token, 'literal', `Colour literal in a class. Use ${nearestColour(utility)}.`)
    }
  }
  return found
}

// ── Scan ───────────────────────────────────────────────────────────────────────

function sourceFiles(): string[] {
  const files: string[] = []
  for (const dir of SCAN_DIRS) {
    for (const entry of readdirSync(join(ROOT, dir), { recursive: true, encoding: 'utf8' })) {
      if (/\.tsx?$/.test(entry)) files.push(join(dir, entry))
    }
  }
  for (const file of SCAN_FILES) if (existsSync(join(ROOT, file))) files.push(file)
  return files
    .map(f => relative(ROOT, join(ROOT, f)))
    .filter(f => !EXCLUDED.some(re => re.test(f)))
    .sort()
}

function scan(): Violation[] {
  const violations: Violation[] = []
  for (const file of sourceFiles()) {
    const source = ts.createSourceFile(
      file,
      readFileSync(join(ROOT, file), 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    )
    const visit = (node: ts.Node) => {
      // Module specifiers are paths, not class strings.
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return
      let text: string | undefined
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) text = node.text
      else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) text = node.text
      if (text) {
        const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
        for (const v of checkLiteral(text)) violations.push({ file, line, ...v })
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }

  // The stylesheet itself: no blur outside a comment.
  cssNoComments.split('\n').forEach((text, i) => {
    if (/backdrop-filter\s*:/.test(text)) {
      violations.push({ file: 'src/index.css', line: i + 1, token: text.trim(), rule: 'blur', fix: 'Nothing on the site uses backdrop-filter.' })
    }
  })

  // Primitives that were deleted with the old UI must stay deleted.
  for (const dir of ['Backdrop', 'SectionHeader', 'Post', 'Colors']) {
    const path = `src/components/ui/${dir}`
    if (existsSync(join(ROOT, path))) {
      violations.push({ file: path, line: 0, token: dir, rule: 'removed', fix: 'Primitive removed with the pre-Luminous UI. See /ui for what replaced it.' })
    }
  }
  return violations
}

function applyAllowlist(violations: Violation[]): { kept: Violation[]; unused: typeof allowlist } {
  const used = new Set<number>()
  const kept = violations.filter(v => {
    const i = allowlist.findIndex(a => a.file === v.file && a.pattern === v.token && a.rule === v.rule)
    if (i === -1) return true
    used.add(i)
    return false
  })
  return { kept, unused: allowlist.filter((_, i) => !used.has(i)) }
}

type Baseline = Record<string, Partial<Record<Rule, number>>>

function tally(violations: Violation[]): Baseline {
  const counts: Baseline = {}
  for (const v of violations) {
    counts[v.file] ??= {}
    counts[v.file][v.rule] = (counts[v.file][v.rule] ?? 0) + 1
  }
  return counts
}

function report(violations: Violation[]): string {
  return [
    ...violations.map(v => `${v.file}:${v.line}  [${v.rule}]  ${v.token}\n    ${v.fix}`),
    '',
    TAIL,
  ].join('\n')
}

describe('ui vocabulary', () => {
  const { kept, unused } = applyAllowlist(scan())

  it('uses only tokens and primitives', () => {
    // Ratchet: while the migration to the token set runs, the baseline records
    // how many violations each file is still allowed. A file may only go down.
    // Regenerate with `UI_VOCAB_UPDATE=1 npm test` after removing some. With no
    // baseline file the rule is absolute: zero.
    if (process.env.UI_VOCAB_UPDATE) {
      writeFileSync(BASELINE_PATH, JSON.stringify(tally(kept), null, 2) + '\n')
    }
    const baseline: Baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) : {}
    const counts = tally(kept)
    const over = kept.filter(v => (counts[v.file]?.[v.rule] ?? 0) > (baseline[v.file]?.[v.rule] ?? 0))
    expect(over.length, `\n${report(over)}\n`).toBe(0)
  })

  it('has no stale or unexplained allowlist entries', () => {
    expect(unused.map(a => `${a.file}: ${a.pattern}`), 'allowlist entries that match nothing').toEqual([])
    expect(allowlist.filter(a => a.reason.trim().length < 20).map(a => a.pattern), 'allowlist reasons too short').toEqual([])
  })

  it('teaches cn() every custom token name', () => {
    // tailwind-merge only resolves conflicts between names it knows. A token
    // missing from cn.ts merges wrongly and silently: both classes survive.
    const cnSource = readFileSync(join(ROOT, 'src/components/ui/cn.ts'), 'utf8')
    for (const ns of ['radius', 'shadow', 'inset-shadow', 'text-shadow', 'tracking', 'ease']) {
      const listed = new RegExp(`['"]?${ns}['"]?\\s*:\\s*\\[([^\\]]*)\\]`).exec(cnSource)?.[1] ?? ''
      const names = [...listed.matchAll(/'([^']+)'/g)].map(m => m[1]).sort()
      expect(names, `cn.ts theme.${ns} vs --${ns}-* in src/index.css`).toEqual([...themeTokens(ns).keys()].sort())
    }
  })

  it('keeps the palette closed', () => {
    // Without these the whole default Tailwind palette and shadow scale compile
    // again, and "not a token" stops meaning "does nothing".
    for (const wildcard of ['--color-*', '--shadow-*', '--inset-shadow-*']) {
      expect(themeBody, `@theme must clear ${wildcard}`).toMatch(new RegExp(`${wildcard.replace(/\*/g, '\\*')}\\s*:\\s*initial`))
    }
    expect([...themeTokens('color').keys()].filter(name => LEGACY_COLOUR.test(name)), 'pre-Luminous colour tokens').toEqual([])
  })

  it('keeps the static pages and the theme colour on the tokens', () => {
    const ink = colourTokens.get('ink')!.toLowerCase()
    const read = (file: string) => readFileSync(join(ROOT, file), 'utf8')

    // 404 and 403 ship their own CSS (no Tailwind reaches them), duplicated on
    // purpose. The two blocks must be the same block.
    const style = (html: string) => /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? ''
    const notFound = style(read('public/404.html'))
    expect(notFound.length).toBeGreaterThan(0)
    expect(style(read('public/403.html')), '403.html <style> must equal 404.html <style>').toBe(notFound)
    for (const name of ['ink', 'lum', 'lum-deep']) {
      const declared = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(notFound)?.[1].toLowerCase()
      expect(declared, `--${name} in public/404.html`).toBe(colourTokens.get(name)!.toLowerCase())
    }

    // theme-color is ink everywhere it is stated.
    const themeColour = (text: string) => [...text.matchAll(/name="theme-color" content="(#[0-9a-fA-F]{6})"/g)].map(m => m[1].toLowerCase())
    for (const file of ['index.html', 'resume.html', 'privacy.html', 'notes.html', 'vite.config.ts', 'public/404.html', 'public/403.html']) {
      expect(themeColour(read(file)), `theme-color in ${file}`).toEqual([ink])
    }
    const manifest = JSON.parse(read('public/site.webmanifest'))
    expect([manifest.theme_color.toLowerCase(), manifest.background_color.toLowerCase()], 'site.webmanifest').toEqual([ink, ink])
  })

  it('documents every variant, and only real ones', () => {
    // /ui is what a contributor (or an agent) reads to pick a surface. A row
    // for a variant that no longer exists is how old names get typed again.
    const union = readFileSync(join(ROOT, 'src/components/ui/variants.ts'), 'utf8')
    const declared = [.../export type Variant =([\s\S]*?)\n\nexport/.exec(union)![1].matchAll(/^\s*\| '([a-z-]+)'/gm)].map(m => m[1]).sort()
    const doc = readFileSync(join(ROOT, '.claude/commands/ui.md'), 'utf8')
    const table = /<!-- variants:start -->([\s\S]*?)<!-- variants:end -->/.exec(doc)?.[1] ?? ''
    const documented = [...table.matchAll(/^\| `([a-z-]+)` \|/gm)].map(m => m[1]).sort()
    expect(declared.length).toBeGreaterThan(0)
    expect(documented, 'variant table in .claude/commands/ui.md vs the Variant union').toEqual(declared)
  })

  it('references only theme variables that exist', () => {
    const namespaces = ['color', 'radius', 'shadow', 'inset-shadow', 'text-shadow', 'tracking', 'ease', 'font']
    const defined = new Set<string>()
    for (const ns of namespaces) for (const name of themeTokens(ns).keys()) defined.add(`--${ns}-${name}`)
    const missing: string[] = []
    const check = (file: string, text: string) => {
      for (const m of text.matchAll(/var\(\s*(--(?:color|radius|shadow|inset-shadow|text-shadow|tracking|ease)-[a-z0-9-]+)/g)) {
        if (!defined.has(m[1])) missing.push(`${file}: ${m[1]}`)
      }
    }
    check('src/index.css', cssNoComments)
    for (const file of sourceFiles()) check(file, readFileSync(join(ROOT, file), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''))
    expect([...new Set(missing)], 'var() references to tokens that are not declared in @theme').toEqual([])
  })
})
