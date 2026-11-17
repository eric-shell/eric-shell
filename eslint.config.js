import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const INLINE_STYLE_LITERAL = {
  selector: "JSXAttribute[name.name='style'] Property[key.name=/^(color|background|backgroundColor|backgroundImage|borderColor|boxShadow|textShadow|borderRadius|fill|stroke|outlineColor)$/] > Literal.value",
  message: 'No colour, shadow or radius literals in inline styles. Use a token class, or var(--color-…) if the value must be computed.',
}

const RAW_ELEMENTS = [
  {
    selector: "JSXOpeningElement[name.name='section']",
    message: 'Use <Section tone=… rhythm=…> (or <Sheet>) from components/ui instead of a raw <section>.',
  },
  {
    selector: "JSXOpeningElement[name.name='main']",
    message: 'Use <Page> from components/ui instead of a raw <main>.',
  },
  {
    selector: "JSXOpeningElement[name.name=/^(h2|h3)$/]",
    message: 'Use the primitive: <SectionTitle>, <H3>, or <Card titleAs=…>. Headings set their own face, size and tracking.',
  },
]

export default defineConfig([
  globalIgnores(['dist', 'dist-ssr']),
  {
    // Build, image and CRM tooling. Plain Node ESM, so the recommended rules
    // and Node's globals, nothing React. These were not linted at all before,
    // which is how `crm-ui-check.mjs` came to read a `HOLD_MS` it never
    // imported: a ReferenceError the first time anyone ran it.
    files: ['scripts/**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      // Several scripts hand callbacks to Playwright's page.evaluate(), which
      // run in the browser, hence both sets.
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    // Tests run in Node: the ts block below gives every .ts file browser
    // globals, which would leave `process` and friends undeclared here.
    files: ['tests/**/*.ts', 'vitest.config.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // Two restrictions on what `src/` may import, in one rule because ESLint
    // keeps only the last config of a rule that matches a file.
    //
    // notes.ts holds every note body in one array, so a value import from
    // client code puts all of them in that chunk. The browser reads
    // notes-index.ts instead; see the comment at the top of it. Type imports
    // are erased at build time and stay allowed.
    //
    // tailwind-merge only resolves conflicts between class names it knows.
    // `cn` is tailwind-merge taught the site's own radius, shadow and easing
    // tokens; the stock `twMerge` would keep both `rounded-lg` and
    // `rounded-card` and let stylesheet order decide.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/data/notes.ts', 'src/components/ui/cn.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', {
        paths: [{
          name: 'tailwind-merge',
          message: 'Use `cn` from @/components/ui/cn: it knows the site\'s own token names, which tailwind-merge does not.',
        }],
        patterns: [{
          regex: '(^|/)data/notes(\\.ts)?$',
          allowTypeImports: true,
          message: 'Import from @/data/notes-index instead: notes.ts carries every note body and must stay out of client bundles.',
        }],
      }],
    },
  },
  {
    // The same two, plus the surface maps, for everything outside
    // `components/ui`. A surface is named through `Button`, `Panel` or
    // `surface()`, never read out of the maps, so a call site cannot assemble
    // one by hand.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/data/notes.ts', 'src/components/ui/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', {
        paths: [{
          name: 'tailwind-merge',
          message: 'Use `cn` from @/components/ui/cn: it knows the site\'s own token names, which tailwind-merge does not.',
        }],
        patterns: [
          {
            regex: '(^|/)data/notes(\\.ts)?$',
            allowTypeImports: true,
            message: 'Import from @/data/notes-index instead: notes.ts carries every note body and must stay out of client bundles.',
          },
          {
            regex: '(^|/)ui/variants(\\.ts)?$',
            allowTypeImports: true,
            message: 'Use <Button> / <Panel>, or `surface()` from the ui barrel. The surface maps are private to components/ui.',
          },
        ],
      }],
    },
  },
  {
    // Colour, shadow and radius come from classes built on the tokens. An
    // inline style with one of these written out is the same hand-rolled value
    // the class rules refuse, in a place those rules do not look.
    files: ['src/components/**/*.tsx', 'src/App.tsx'],
    rules: { 'no-restricted-syntax': ['error', INLINE_STYLE_LITERAL] },
  },
  {
    // Every <section> and <main> is a `Section` or `Page`, which own the field
    // colour, the vertical rhythm and the focus-ring colour that reads on that
    // field. A raw element here is how seven different paddings came to exist.
    // (Restates the inline-style rule above: for a file both blocks match,
    // ESLint keeps only the later block's options.)
    files: ['src/components/sections/**/*.tsx', 'src/components/layout/**/*.tsx', 'src/App.tsx'],
    ignores: ['**/*.stories.tsx'],
    rules: { 'no-restricted-syntax': ['error', INLINE_STYLE_LITERAL, ...RAW_ELEMENTS] },
  },
])
