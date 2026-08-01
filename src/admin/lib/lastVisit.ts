import { useEffect, useState } from 'react'
import type { VisitorSummary } from '@/../api/_lib/types'

/**
 * "New since you last looked" — the watermark, and the predicate that reads it.
 *
 * The dashboard polls, so rows appear under you without ceremony. Nothing marked
 * which ones, which meant the only way to answer the question you actually open
 * this page to ask — *what changed?* — was to remember the top row from last
 * time. This is that memory, written down.
 *
 * It is deliberately not an unread count in the mail sense: nothing is ever
 * marked read individually, and opening a row doesn't clear its dot. The
 * watermark moves once, when you leave.
 */
const LAST_VISIT_KEY = 'eric.sh:crm:last-visit'

/** Whether this row picked up activity after the watermark. */
export function isNewSince(v: VisitorSummary, since: number | null): boolean {
  if (since === null) return false
  // Parsed, not compared as text, matching `withinTimeframe`: the driver hands
  // back whatever Postgres renders a timestamptz as, and that is not guaranteed
  // to sort lexicographically against an ISO string.
  return new Date(v.last_activity_at).getTime() > since
}

/**
 * Epoch ms of the previous visit, or null if there isn't one.
 *
 * **Read once and frozen for the session.** A watermark that advanced while you
 * were reading would un-mark rows under the cursor — the dot would vanish from
 * whatever you were about to click. It advances on the way out instead: on
 * unmount (sign-out, route change), on `pagehide`, and when the tab is hidden.
 * All three, because a dashboard is usually closed by closing the tab, and
 * mobile Safari frequently never fires `pagehide` — the same reason the public
 * telemetry flushes on both events.
 *
 * A first-ever visit returns null, which marks nothing. There is no "last time"
 * for the rows to be new since, and dotting all 500 of them would say nothing.
 */
export function useLastVisit(): number | null {
  const [since] = useState<number | null>(() => {
    try {
      const raw = window.localStorage.getItem(LAST_VISIT_KEY)
      const ms = raw ? Date.parse(raw) : Number.NaN
      return Number.isNaN(ms) ? null : ms
    } catch {
      // Private mode / storage disabled. No watermark, so no dots — the honest
      // degradation, and the same one `visitorId` takes on the public side.
      return null
    }
  })

  useEffect(() => {
    const stamp = () => {
      try { window.localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString()) } catch { /* private mode */ }
    }
    const onHide = () => { if (document.visibilityState === 'hidden') stamp() }

    window.addEventListener('pagehide', stamp)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', stamp)
      document.removeEventListener('visibilitychange', onHide)
      stamp()
    }
  }, [])

  return since
}
