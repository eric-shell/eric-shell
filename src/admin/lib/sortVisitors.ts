import type { VisitorSummary } from '@/../api/_lib/types'
import { classifyVisitor, type BurstMap } from './classify'

export type SortKey =
  | 'visitor' | 'flags' | 'lastSeen' | 'location' | 'contact' | 'engagement' | 'chat' | 'sent'
export type SortDir = 'asc' | 'desc'

export interface SortState {
  key: SortKey
  dir: SortDir
}

/** Matches the order the API already returns, so the first paint doesn't jump. */
export const DEFAULT_SORT: SortState = { key: 'lastSeen', dir: 'desc' }

/**
 * Direction a column starts in when you first click it.
 *
 * Text sorts A→Z because that's what "sort by name" means; counts and dates
 * start at the largest and newest, because nobody opens a CRM looking for the
 * visitor with the fewest page views.
 */
export const INITIAL_DIR: Record<SortKey, SortDir> = {
  visitor: 'asc',
  flags: 'desc',
  lastSeen: 'desc',
  location: 'asc',
  contact: 'asc',
  engagement: 'desc',
  chat: 'desc',
  sent: 'desc',
}

/**
 * Display label for a sort key — the column name, capitalised, short enough to
 * sit in a select. Columns needing more explanation (Engagement sorts by views
 * then engaged time) carry a fuller `title` at the header call site.
 */
export const SORT_LABEL: Record<SortKey, string> = {
  visitor: 'Visitor ID',
  flags: 'Flags',
  lastSeen: 'Last seen',
  location: 'Location',
  contact: 'Contact',
  engagement: 'Engagement',
  chat: 'Chat',
  sent: 'Sent',
}

type Cell = { s: string | null } | { n: number | null }

/**
 * Columns whose strings are machine values (a UUID, an ISO-8601 timestamp) and
 * must compare byte-wise.
 *
 * Locale collation is wrong for these. With `numeric: true` it reads digit runs
 * inside a UUID as numbers, so `5eed000f` sorted *before* `5eed0001` — the ids
 * came out visibly jumbled. Locale rules exist for human-readable text; these
 * are not that.
 */
const RAW_KEYS = new Set<SortKey>(['visitor', 'lastSeen'])

/**
 * Resolve a row to its sortable value. `locationLabel` is injected rather than
 * derived here so the sort matches exactly what the cell renders — including any
 * unsaved location override the list is holding locally.
 */
function cellFor(v: VisitorSummary, key: SortKey, locationLabel: string | null, bursts?: BurstMap): Cell {
  switch (key) {
    case 'visitor':    return { s: v.id }
    // Rank by how much the row wants attention: a possible spam submission
    // outranks a crawler, which outranks a bounce. Unflagged rows are null, so
    // they sink under the blanks-last rule rather than crowding the top.
    case 'flags':      return { n: flagRank(v, bursts) || null }
    case 'lastSeen':   return { s: v.last_activity_at }   // ISO-8601 sorts lexicographically
    case 'location':   return { s: locationLabel }
    case 'contact':    return { s: v.contact_name ?? v.contact_email ?? null }
    // Zero is `null`, not 0, for the count columns. Those cells render an
    // em-dash at zero, so treating it as a real low value made an ascending
    // sort open with a screen of dashes — the exact thing the nulls-last rule
    // exists to prevent. What the cell shows and how it sorts must agree.
    case 'engagement':
      return { n: v.page_view_count === 0 && v.total_engaged_ms === 0 ? null : v.page_view_count }
    case 'chat':       return { n: v.chat_message_count || null }
    case 'sent':       return { n: v.contact_count || null }
  }
}

// Ranked by how much a row wants attention, so a descending sort surfaces
// problems first. Positive flags sit lowest of the flagged — they are good
// news, not something to action — but still above unflagged rows.
// `neutral` is 0 rather than a low positive on purpose: `flagRank`'s `|| null`
// turns 0 into a blank, so the ordinary rows — every row carries a tag now —
// sink under the blanks-last rule instead of crowding a sort meant to surface
// the exceptional ones.
// `reject` slots between danger and muted rather than joining danger, so the
// comment above stays true: a possible spam submission — the one tag that wants
// you to go and read something — still outranks a crawler. Merging them would
// float fifteen machines to the top of a sort whose whole purpose is surfacing
// the one row that needs a human.
const TONE_RANK = { danger: 5, reject: 4, muted: 3, warn: 2, good: 1, neutral: 0 } as const

function flagRank(v: VisitorSummary, bursts?: BurstMap): number {
  return classifyVisitor(v, bursts).reduce((max, t) => Math.max(max, TONE_RANK[t.tone] ?? 0), 0)
}

/** Empty is "no data", not "lowest value" — see the nulls-last rule below. */
const isBlank = (c: Cell) =>
  'n' in c ? c.n === null || c.n === undefined : c.s === null || c.s === undefined || c.s === ''

export function sortVisitors(
  rows: VisitorSummary[],
  { key, dir }: SortState,
  locationLabelFor: (v: VisitorSummary) => string | null,
  /** Cross-row clusters, so the Flags column sorts by what the cell renders. */
  bursts?: BurstMap,
): VisitorSummary[] {
  const sign = dir === 'asc' ? 1 : -1

  return [...rows].sort((a, b) => {
    const ca = cellFor(a, key, locationLabelFor(a), bursts)
    const cb = cellFor(b, key, locationLabelFor(b), bursts)

    // Blanks always sink, in BOTH directions. Flipping them to the top on a
    // descending sort just fills the screen with em-dashes, which is never what
    // anyone wanted from clicking a header.
    const ba = isBlank(ca), bb = isBlank(cb)
    if (ba !== bb) return ba ? 1 : -1

    let d = 0
    if (!ba) {
      if ('n' in ca && 'n' in cb) {
        d = (ca.n as number) - (cb.n as number)
        // Engaged time breaks ties on view count, so two visitors with the same
        // number of views still order by who actually read.
        if (d === 0 && key === 'engagement') d = a.total_engaged_ms - b.total_engaged_ms
      } else if ('s' in ca && 's' in cb) {
        const x = ca.s as string, y = cb.s as string
        d = RAW_KEYS.has(key)
          ? (x < y ? -1 : x > y ? 1 : 0)
          // Human-readable text: case- and accent-insensitive, so "austin"
          // files next to "Austin" and "Zurich" next to "Zürich".
          : x.localeCompare(y, undefined, { sensitivity: 'base' })
      }
    }
    if (d !== 0) return d * sign

    // Deterministic tiebreak so equal rows never shuffle between renders:
    // newest first, then id. Not multiplied by `sign` — it is a stabiliser, not
    // part of the requested ordering.
    return b.last_activity_at.localeCompare(a.last_activity_at) || a.id.localeCompare(b.id)
  })
}

/** Clicking the active column flips it; a new column starts at its natural direction. */
export function nextSort(current: SortState, key: SortKey): SortState {
  if (current.key !== key) return { key, dir: INITIAL_DIR[key] }
  return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
}
