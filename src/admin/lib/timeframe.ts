import type { VisitorSummary } from '@/../api/_lib/types'

/**
 * The global time window the dashboard is looking at.
 *
 * Lives beside `sortVisitors` rather than inside a component because two places
 * need it and must agree: the dashboard applies it (it defines the working set
 * the metric tiles read from), and the visitors toolbar renders the segments.
 *
 * A row is in-window by `last_activity_at` — when the visitor was last doing
 * something — not `first_seen_at`. "Who has been here this week" is the
 * question this control gets asked; a visitor who first arrived in March and
 * came back yesterday belongs in the last-24h view.
 */
export type Timeframe = '24h' | '7d' | '30d' | 'all'

/**
 * `label` is the abbreviation the desktop segmented control shows, where four
 * options share one row. `full` is for the phone `<select>`, which has a whole
 * line to itself and no neighbouring segments to imply what "7d" is relative to.
 */
export const TIMEFRAMES: { value: Timeframe; label: string; full: string; title: string }[] = [
  { value: '24h', label: '24h', full: 'Past 24 hours', title: 'Visitors last active in the past 24 hours' },
  { value: '7d', label: '7d', full: 'Past 7 days', title: 'Visitors last active in the past 7 days' },
  { value: '30d', label: '30d', full: 'Past 30 days', title: 'Visitors last active in the past 30 days — the same window the Insights panel above uses' },
  { value: 'all', label: 'All', full: 'All time', title: 'Every recorded visitor, with no time limit' },
]

export const DEFAULT_TIMEFRAME: Timeframe = 'all'

/** Guard for the persisted value, which is untrusted `localStorage` text. */
export function isTimeframe(v: unknown): v is Timeframe {
  return TIMEFRAMES.some(t => t.value === v)
}

const DAYS: Record<Exclude<Timeframe, 'all'>, number> = { '24h': 1, '7d': 7, '30d': 30 }

/**
 * Rolling window, not calendar days: "7d" means the last 168 hours, so the set
 * doesn't silently shrink at midnight while a tab is left open.
 */
export function withinTimeframe(rows: VisitorSummary[], tf: Timeframe): VisitorSummary[] {
  if (tf === 'all') return rows
  const cutoff = Date.now() - DAYS[tf] * 24 * 60 * 60 * 1000
  return rows.filter(v => new Date(v.last_activity_at).getTime() >= cutoff)
}

/**
 * The window immediately before `withinTimeframe`'s, same length — what the
 * metric tiles compare against.
 *
 * `null` for `all`, and the caller must render no delta rather than a zero:
 * all-time has nothing before it, and "0%" would be a claim about a period
 * that does not exist. That is also the default timeframe, so the tiles show
 * no trend until a window is chosen. Correct, and worth knowing before anyone
 * files it as a bug.
 *
 * A row lands here by the same `last_activity_at` rule, which means the two
 * windows are disjoint and a visitor is counted in exactly one of them. It also
 * means "previous" is a window of *last activity*, not of visits: a visitor who
 * came in both periods appears only in the current one. That is the same
 * definition the number above the delta uses, which is the property that makes
 * the comparison meaningful — both sides are counted identically.
 */
export function previousTimeframe(rows: VisitorSummary[], tf: Timeframe): VisitorSummary[] | null {
  if (tf === 'all') return null
  const span = DAYS[tf] * 24 * 60 * 60 * 1000
  const start = Date.now() - span * 2
  const end = Date.now() - span
  return rows.filter(v => {
    const t = new Date(v.last_activity_at).getTime()
    return t >= start && t < end
  })
}
