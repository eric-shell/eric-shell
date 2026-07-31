/**
 * Shapes returned by `GET /api/admin/insights`.
 *
 * Kept in its own module rather than added to `types.ts` so the insights
 * aggregate can evolve without touching the visitor-list contract.
 *
 * Everything here is a **server-side aggregate over a fixed window**. It is not
 * filtered by the dashboard's client-side bot/engagement toggles (those classify
 * individual rows from a user agent, which SQL here deliberately does not
 * duplicate), so the UI has to say so — see `InsightsPanel`.
 */

/** Sessions bucketed by the deepest scroll they reached, as "at least N%". */
export interface ScrollReach {
  /** Sessions that scrolled at least 25% of the page. */
  pct25: number
  pct50: number
  pct75: number
  pct90: number
}

/**
 * Scroll depth, plus the honesty envelope around it.
 *
 * `max_scroll_pct` was pinned at 100 for every session written before the
 * telemetry fix (the client seeded its maximum at 100 while React had not yet
 * committed, so the column could only ever be 100). Those rows are not
 * back-fillable — the column is `not null` and there is no true value to
 * recover — so they are *excluded* rather than charted, which is what keeps the
 * funnel from quietly drawing a flat 100% at every stage. The chart no longer
 * annotates the exclusion; `measured` is the denominator the UI reports, and
 * `excluded` / `since` remain on the payload for diagnostics.
 *
 * The cutoff is derived, not hardcoded: the first session that ever recorded a
 * value strictly between 0 and 100 cannot have come from the broken client
 * (100 was its only output, and 0 is the column default on a session that never
 * sent a heartbeat), so it is the earliest point the column can be trusted from.
 */
export interface ScrollDepth {
  reach: ScrollReach
  /** Sessions in the window on the trusted side of the cutoff — the denominator. */
  measured: number
  /** Sessions in the window dropped as pre-fix. */
  excluded: number
  /** ISO timestamp of the first trustworthy session, or null if there is none yet. */
  since: string | null
}

/**
 * Session counts by viewport width. Ordered buckets, not device identities:
 * a narrow desktop window lands in `phone`. The label the UI uses says
 * "viewport", never "device", for exactly that reason.
 */
export interface ViewportMix {
  /** Sessions that reported a viewport at all — the denominator. */
  known: number
  /** < 640px */
  phone: number
  /** 640–1023px */
  tablet: number
  /** >= 1024px */
  desktop: number
}

export interface SourceRow {
  /**
   * Where the visit came from: the session's `utm_source` when it carries one,
   * otherwise the referrer host (lowercased, `www.` stripped). Empty string
   * means neither — a genuinely direct arrival.
   */
  host: string
  /** True when this bar came from a campaign tag rather than a referrer header. */
  tagged: boolean
  sessions: number
}

/**
 * A destination visitors clicked through to, off-site.
 *
 * Grouped by host, not by link, so one row answers "how many people opened the
 * GitHub repo" regardless of which page the link sat on. Internal navigation is
 * never counted here — that is what `paths` is for.
 */
export interface ClickRow {
  /** Destination host, `www.` stripped, or `mailto` / `tel`. `?` if unknown. */
  host: string
  /** Friendliest link text seen for this destination, or null for icon links. */
  label: string | null
  clicks: number
  /** Distinct visitors behind those clicks — three clicks from one person is not three people. */
  visitors: number
}

export interface PathRow {
  path: string
  views: number
  visitors: number
}

export interface HourRow {
  /** Hour of day in **UTC**, 0–23. The client shifts it for display. */
  hour: number
  views: number
}

export interface InsightsPayload {
  /** Size of the aggregate window, in days. */
  windowDays: number
  sessions: {
    total: number
    scroll: ScrollDepth
    viewport: ViewportMix
  }
  visitors: {
    /** Visitors with at least one session in the window. */
    total: number
    /** Of those, how many had sessions on two or more separate UTC days. */
    returning: number
  }
  sources: SourceRow[]
  clicks: ClickRow[]
  paths: PathRow[]
  /** Always 24 rows, 0–23, zero-filled. */
  hourly: HourRow[]
}
