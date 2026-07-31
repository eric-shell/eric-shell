import type { VisitorDetailPayload, VisitorSummary } from '@/../api/_lib/types'

/**
 * In-memory cache of visitor detail payloads, for the life of one page view.
 *
 * Reopening a row you looked at a minute ago used to refetch it: a serverless
 * invocation and a Neon round trip for a payload we already had, plus a
 * skeleton flash on every revisit. Comparing two rows side by side — the
 * obvious thing to do in this table — paid that cost on every switch back.
 *
 * Deliberately *not* persisted (no `sessionStorage`): visitor transcripts and
 * contact details are the most sensitive thing this app holds, and there is no
 * reason for them to outlive the tab or to sit in a store that survives sign
 * out. A reload starts empty, which is also the escape hatch if anything here
 * ever looks stale.
 */

/**
 * Payloads held at once. Each carries a full chat transcript, so this is capped
 * rather than unbounded — 20 covers any realistic session of clicking around a
 * 500-row table, and evicting the least recently opened costs nothing but the
 * refetch that used to happen every time.
 */
const MAX_ENTRIES = 20

interface Entry {
  stamp: string
  payload: VisitorDetailPayload
}

/** Insertion order doubles as LRU recency — reads re-insert, see `readDetail`. */
const cache = new Map<string, Entry>()

/**
 * Freshness key for a visitor, derived from the row the list already has.
 *
 * `last_activity_at` is a `greatest()` across the visitor's last seen, last
 * chat, last contact, last page view, and last heartbeat (see
 * `api/admin/visitors.ts`), so it moves whenever anything the detail view
 * renders could have changed. The counts ride along to catch the degenerate
 * case of two writes landing on the same timestamp.
 *
 * The upshot: staleness is decided by data the dashboard is already polling
 * for. Serving a cached payload costs no request, and a visitor who does
 * something new invalidates their own entry within one poll.
 */
export function detailStamp(v: VisitorSummary): string {
  return [
    v.last_activity_at,
    v.chat_message_count,
    v.contact_count,
    v.page_view_count,
    v.session_count,
  ].join('|')
}

/** The cached payload for `id`, or `null` if absent or superseded. */
export function readDetail(id: string, stamp: string): VisitorDetailPayload | null {
  const hit = cache.get(id)
  if (!hit) return null
  if (hit.stamp !== stamp) {
    // Superseded: drop it now rather than let a stale payload occupy a slot
    // until it ages out.
    cache.delete(id)
    return null
  }
  cache.delete(id)
  cache.set(id, hit)
  return hit.payload
}

export function writeDetail(id: string, stamp: string, payload: VisitorDetailPayload): void {
  cache.delete(id)
  cache.set(id, { stamp, payload })
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest === undefined) break
    cache.delete(oldest)
  }
}

/** Forget a visitor — after a delete, there is nothing left to serve. */
export function dropDetail(id: string): void {
  cache.delete(id)
}
