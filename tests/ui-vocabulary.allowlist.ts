/**
 * Exceptions to the UI vocabulary rules in ui-vocabulary.test.ts.
 *
 * An entry is one exact token in one exact file, with the reason it cannot be
 * a token or a primitive. The test fails on an entry nothing matches, so this
 * list cannot outlive the code it excuses, and on a reason too short to be one.
 *
 * Before adding here: a repeated value belongs in `@theme` in src/index.css
 * (and in src/components/ui/cn.ts), and a bespoke effect belongs in an
 * `@utility` there. This list is for values that are not Tailwind classes at
 * all, or that are computed at runtime.
 */
export interface AllowlistEntry {
  /** Path relative to the repo root. */
  file: string
  /** The offending token or string literal, exactly as the test reports it. */
  pattern: string
  rule: 'palette' | 'literal' | 'blur' | 'removed' | 'radius' | 'shadow' | 'colour'
  reason: string
}

export const allowlist: AllowlistEntry[] = [
  {
    file: 'src/components/sections/Hero/particleSprite.ts',
    pattern: 'rgba(',
    rule: 'literal',
    reason: 'A canvas gradient stop built at runtime from a palette passed in as numbers; canvas 2D takes no CSS variables.',
  },
]
