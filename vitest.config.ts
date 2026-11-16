import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

/**
 * Its own config rather than vite.config.ts, on purpose. Evaluating
 * vite.config.ts writes every notes/*.html document and the sitemap to disk
 * (see notesEntries there), which a test run has no business doing, and none of
 * its plugins matter to code that runs in Node.
 *
 * Tests live in tests/, never under api/: Vercel turns every file under api/
 * into a serverless function, and the project sits one below the Hobby plan's
 * 12-function cap. A test file there would fail the next production deploy.
 */
export default defineConfig({
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
