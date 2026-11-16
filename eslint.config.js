import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

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
    // notes.ts holds every note body in one array, so a value import from
    // client code puts all of them in that chunk. The browser reads
    // notes-index.ts instead; see the comment at the top of it. Type imports
    // are erased at build time and stay allowed.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/data/notes.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', {
        patterns: [{
          regex: '(^|/)data/notes(\\.ts)?$',
          allowTypeImports: true,
          message: 'Import from @/data/notes-index instead: notes.ts carries every note body and must stay out of client bundles.',
        }],
      }],
    },
  },
])
