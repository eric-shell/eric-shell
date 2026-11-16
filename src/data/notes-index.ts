/**
 * The notes as the BROWSER sees them: everything except the bodies, plus a way
 * to fetch one body.
 *
 * `notes.ts` is the single authored file and stays that way, but it must never
 * be imported as a value from client code. It is one array holding every body,
 * so any chunk that imports it carries all of them: the index, which renders no
 * body at all, and every article, which renders one, were each downloading the
 * full set (92KB, 36KB gzipped, and growing with every entry written).
 *
 * The two `virtual:` modules below are generated from that same array by the
 * `notesData()` plugin in vite.config.ts. `virtual:notes-meta` is the entries
 * with `body` removed; `virtual:notes-bodies` maps each slug to a dynamic
 * import, so each body is its own chunk and an article fetches exactly one.
 * Adding an entry to `notes.ts` is still the whole workflow.
 *
 * Type-only imports from `notes.ts` are fine: they are erased at build time.
 * ESLint enforces the rest (`no-restricted-imports` in eslint.config.js).
 */
import type { Note } from './notes'
import { notes as meta } from 'virtual:notes-meta'
import { bodies } from 'virtual:notes-bodies'

/** A note without its body. What the index, the pager and the masthead read. */
export type NoteMeta = Omit<Note, 'body'>

/** Newest first, ties in authored order. Sorted once, in `notes.ts`. */
export const notes: NoteMeta[] = meta

/** Public source for this site. Every note's `commit` resolves against it. */
export const repoUrl = 'https://github.com/eric-shell/eric-shell'

export const commitUrl = (sha: string) => `${repoUrl}/commit/${sha}`

/** Lookup for the detail route. Returns undefined for an unknown slug. */
export function noteBySlug(slug: string): NoteMeta | undefined {
  return notes.find((n) => n.slug === slug)
}

/**
 * Adjacent entries for the prev/next pager, in the array's authored order.
 * `previous` is the older note and `next` the newer one, reading order rather
 * than array order, which is why they look inverted against the indices.
 */
export function noteNeighbours(slug: string): { previous?: NoteMeta; next?: NoteMeta } {
  const i = notes.findIndex((n) => n.slug === slug)
  if (i === -1) return {}
  return { previous: notes[i + 1], next: notes[i - 1] }
}

const pending = new Map<string, Promise<string>>()

/**
 * One note's markdown body, fetched as its own chunk.
 *
 * Returns the SAME promise for the same slug every time, which is what lets a
 * component hand it to React's `use()`: a fresh promise per render would
 * suspend forever. Rejects for a slug with no entry, though the route only
 * asks for slugs `noteBySlug` has already found.
 */
export function noteBody(slug: string): Promise<string> {
  let body = pending.get(slug)
  if (!body) {
    const load = bodies[slug]
    body = load ? load().then((m) => m.default) : Promise.reject(new Error(`No note body for "${slug}"`))
    pending.set(slug, body)
  }
  return body
}
