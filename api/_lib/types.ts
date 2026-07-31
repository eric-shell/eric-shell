/**
 * Campaign tag every visit created by `scripts/synth-traffic.mjs` carries.
 *
 * That script drives the live site with Playwright to exercise the real
 * pipeline, and it deliberately spoofs an ordinary browser user-agent so the
 * rows aren't hidden by the bot rules — which left our own load tests sitting in
 * the CRM indistinguishable from strangers. This tag is the honest marker, and
 * it is what the `Test` classification keys off.
 *
 * The script hardcodes the same string (it's plain .mjs and can't import this).
 * Change one, change both.
 */
export const SYNTHETIC_CAMPAIGN = 'synthetic-test'

export interface Visitor {
  id: string
  first_seen_at: string
  last_seen_at: string
  user_agent: string | null
  /** IP-derived and approximate. Prefer `location_override` for display. */
  country: string | null
  city: string | null
  region: string | null
  timezone: string | null
  /** Human-entered correction. Always wins over the IP-derived fields. */
  location_override: string | null
  /** Browser-reported, so more reliable than the IP-derived fields above. */
  client_timezone: string | null
  language: string | null
  referrer: string | null
  notes: string | null
}

export interface VisitorSession {
  id: string
  started_at: string
  last_beat_at: string
  engaged_ms: number
  max_scroll_pct: number
  entry_path: string | null
  referrer: string | null
  viewport_w: number | null
  viewport_h: number | null
  screen_w: number | null
  screen_h: number | null
  /**
   * Campaign tags off the link this visit arrived by, or null when it carried
   * none. Self-reported by whoever built the link — i.e. by the site owner —
   * so unlike `referrer` they describe the share, not the visitor.
   */
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  page_view_count: number
}

export interface PageView {
  id: number
  session_id: string | null
  path: string
  referrer: string | null
  created_at: string
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ContactSubmission {
  id: number
  name: string
  email: string
  message: string
  created_at: string
}

export interface VisitorDetailPayload {
  visitor: Visitor
  messages: ChatMessage[]
  submissions: ContactSubmission[]
  events: Record<string, number>
  clearEvents: { created_at: string }[]
  sessions: VisitorSession[]
  pageViews: PageView[]
}

export interface VisitorSummary {
  id: string
  first_seen_at: string
  last_seen_at: string
  user_agent: string | null
  country: string | null
  city: string | null
  region: string | null
  timezone: string | null
  location_override: string | null
  client_timezone: string | null
  language: string | null
  referrer: string | null
  chat_message_count: number
  contact_count: number
  page_view_count: number
  session_count: number
  /** Distinct calendar days with at least one session. */
  active_days: number
  /** Deepest scroll reached in any session, 0-100. */
  max_scroll_pct: number
  /** Summed engaged time across every session, in milliseconds. */
  total_engaged_ms: number
  /** Any session tagged `SYNTHETIC_CAMPAIGN` — traffic our own tooling made. */
  synthetic: boolean
  last_activity_at: string
  contact_name: string | null
  contact_email: string | null
}

export interface StatDay {
  date: string
  visitors: number
}

export interface StatsPayload {
  days: StatDay[]
}

export interface VisitorListPayload {
  visitors: VisitorSummary[]
}
