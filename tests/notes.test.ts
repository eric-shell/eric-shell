/**
 * The house rules for /notes, as checks rather than as prose.
 *
 * Every rule here is already written down, in CLAUDE.md and at the top of
 * src/data/notes.ts, and every one of them is the kind that is easy to break
 * by hand and invisible in review: a single em dash in a 2,000-word body, a
 * renamed slug, a date typed as `2026-8-1`. A failing test is the only reminder
 * that reliably arrives before a broken URL does.
 */
import { describe, expect, it } from 'vitest'
import { notes } from '../src/data/notes'

describe('notes', () => {
  it('has entries', () => {
    expect(notes.length).toBeGreaterThan(0)
  })

  it('uses no em dashes in anything a reader sees', () => {
    // CLAUDE.md: "No em dashes in note content." Comments in the file are exempt,
    // which is why this reads the parsed entries rather than grepping the source.
    const offenders = notes.flatMap((n) =>
      (['title', 'summary', 'body'] as const)
        .filter((field) => n[field].includes('—'))
        .map((field) => `${n.slug}.${field}`),
    )
    expect(offenders).toEqual([])
  })

  it('has unique, URL-safe slugs', () => {
    // A slug is a live URL, and App.tsx only routes /notes/[a-z0-9-]+.
    const slugs = notes.map((n) => n.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('dates a revision after the entry, never in the future', () => {
    const latest = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
    for (const n of notes.filter(n => n.updated !== undefined)) {
      const updated = n.updated as string
      expect(updated, n.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(new Date(`${updated}T00:00:00Z`).toISOString().slice(0, 10), n.slug).toBe(updated)
      expect(updated > n.date, `${n.slug}: updated must be after date`).toBe(true)
      expect(updated <= latest, `${n.slug}: updated is in the future`).toBe(true)
    }
  })

  it('dates every entry as a real ISO calendar date', () => {
    for (const n of notes) {
      expect(n.date, n.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      // Round-trips only if the day exists: 2026-02-30 would not.
      expect(new Date(`${n.date}T00:00:00Z`).toISOString().slice(0, 10), n.slug).toBe(n.date)
    }
  })

  it('cites a commit SHA for every entry', () => {
    // "Every entry must be checkable." Whether the SHA exists is checked by eye
    // against the public repo; the shape is checked here.
    for (const n of notes) expect(n.commit, n.slug).toMatch(/^[0-9a-f]{7,40}$/)
  })

  it('keeps summaries short enough not to be cut off in search results', () => {
    // notes.ts asks for "under ~155". 160 is that with the tilde honoured.
    for (const n of notes) expect(n.summary.length, n.slug).toBeLessThanOrEqual(160)
  })

  it('carries at least one tag on every entry', () => {
    // The index filter and the tag list are derived from these.
    for (const n of notes) expect(n.tags.length, n.slug).toBeGreaterThan(0)
  })

  it('is sorted newest first, ties left in authored order', () => {
    for (let i = 1; i < notes.length; i++) {
      expect(notes[i - 1].date >= notes[i].date, `${notes[i - 1].slug} before ${notes[i].slug}`).toBe(true)
    }
  })
})
