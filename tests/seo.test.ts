import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { PAGES } from '../src/data/pages'

/**
 * The structured data on the hand-written HTML entries, and the dates it
 * carries. A typo in an inline JSON-LD block is invisible: the page renders,
 * nothing logs, and Google silently drops every node in that block.
 */

const ROOT = resolve(import.meta.dirname, '..')
const ISO = /^\d{4}-\d{2}-\d{2}$/
/** Tomorrow in UTC, so a date written today passes in every timezone. */
const LATEST = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)

const realDate = (iso: string) => ISO.test(iso) && new Date(`${iso}T00:00:00Z`).toISOString().slice(0, 10) === iso

type Node = Record<string, unknown>

function jsonLd(file: string): Node[] {
  const html = readFileSync(join(ROOT, file), 'utf8')
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(([, body]) => {
    const parsed = JSON.parse(body) as Node
    return (parsed['@graph'] as Node[] | undefined) ?? [parsed]
  })
}

describe('page dates', () => {
  for (const [key, page] of Object.entries(PAGES)) {
    it(`${key}: real, ordered, not in the future`, () => {
      expect(realDate(page.published), `${key}.published`).toBe(true)
      expect(realDate(page.updated), `${key}.updated`).toBe(true)
      expect(page.published <= page.updated, `${key}: published after updated`).toBe(true)
      expect(page.updated <= LATEST, `${key}.updated is in the future`).toBe(true)
    })
  }
})

describe('structured data', () => {
  for (const [key, page] of Object.entries(PAGES)) {
    it(`${page.file} parses, and its page node is dated from src/data/pages.ts`, () => {
      const nodes = jsonLd(page.file)
      expect(nodes.length, `${page.file} has no JSON-LD`).toBeGreaterThan(0)
      // The page's own node is the one whose @id names this URL's #page.
      const own = nodes.find(n => typeof n['@id'] === 'string' && (n['@id'] as string).endsWith('#page'))
      expect(own, `${page.file}: no node with an @id ending in #page`).toBeDefined()
      // Placeholders, filled at build time by pageDates() in vite.config.ts.
      // A literal date here would be a second source that drifts from PAGES.
      expect(own!.dateModified, `${key} dateModified`).toBe('__PAGE_UPDATED__')
      expect(own!.datePublished ?? own!.dateCreated, `${key} datePublished / dateCreated`).toBe('__PAGE_PUBLISHED__')
    })
  }
})
