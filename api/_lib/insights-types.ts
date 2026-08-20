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

import type { StatDay } from './types.js'

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

/**
 * A tag visitors narrowed one of the filterable indexes to.
 *
 * One row per (section, tag): the work grid and the notes list share a tag
 * vocabulary, and "react on the work grid" is a different question from "react
 * in the notes", so they are never summed together.
 *
 * Counted from settled selections rather than individual toggles, so `uses` is
 * decisions and not clicks — see `useFilterTelemetry`. A selection that only
 * changed the sort order contributes no row here, since it names no tag.
 */
export interface FilterRow {
  /** `work` or `notes`. `?` if an event somehow arrived without one. */
  section: string
  tag: string
  /** Settled selections this tag appeared in. */
  uses: number
  /** Distinct visitors behind them — one person refining a filter is not several. */
  visitors: number
}

/**
 * What visitors DID, against everyone who showed up.
 *
 * The three numerators are the only things on this site that constitute acting
 * on the work rather than looking at it: following a link off-site to a
 * project, a repo, or the mail client; asking the chat something; or writing in
 * through the contact form. Scroll depth and dwell say a visit happened, and
 * the two charts beside this one already say it better; this says the visit
 * went somewhere.
 *
 * `total` counts visitors with ANY recorded activity in the window, across all
 * five tables that can carry it — the same union the numerators come from, so
 * `acted` can never exceed it and the gauge can never draw past its own track.
 *
 * `clicked` / `chatted` / `contacted` are **not a partition of `acted`**. One
 * person can do all three and is counted in each, which is why they are
 * reported as a breakdown beside the ratio rather than as a stacked bar.
 */
export interface ActionMix {
  /** Visitors with any recorded activity in the window — the denominator. */
  total: number
  /** Of those, how many did at least one of the three below. */
  acted: number
  /** Clicked a link that left the site. */
  clicked: number
  /** Sent at least one message to the chat. */
  chatted: number
  /** Submitted the contact form. */
  contacted: number
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
  visitors: ActionMix

  sources: SourceRow[]
  clicks: ClickRow[]
  filters: FilterRow[]
  paths: PathRow[]
  /** Always 24 rows, 0–23, zero-filled. */
  hourly: HourRow[]
  /**
   * New visitors per day for the visitors chart, zero-filled across the window.
   *
   * This used to be its own endpoint (`/api/admin/stats`). It rides here because
   * the dashboard has only ever fetched the two together in one `Promise.all`,
   * so a second function bought a second invocation and a second Neon round trip
   * for data that is never read separately — and on the Hobby plan a function is
   * a scarce resource (12 per deployment, and we were at the cap).
   */
  days: StatDay[]
}
