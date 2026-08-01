import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../_lib/db.js'

/**
 * Scheduled retention pass over the derived telemetry tables.
 *
 * `page_views` grows one row per document load — faster than anything else in
 * this schema — and the admin visitor list aggregates `count(*)` / `max(created_at)`
 * across the whole of it on every poll. Left alone that scan degrades, and Neon
 * bills the compute. The delete was written down in db/schema.sql as a chore to
 * run by hand, which is a chore nobody runs.
 *
 * Both tables are derived telemetry: deleting from them never touches a visitor
 * row, a chat transcript, or a contact submission, and nothing reads this far
 * back — the admin detail view caps at 500 page views and the activity chart
 * looks back 30 days. Keep it that way; if something ever *does* read older
 * data, this window is the thing to change, not the reader.
 */
const RETENTION_MONTHS = 6

/**
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when the variable is
 * set. Without it this is a public URL that deletes data on request, so an
 * unset secret is a hard 503 rather than an open door — the opposite of how the
 * 2FA path fails, because here failing open costs data rather than access.
 *
 * Compared with `timingSafeEqual` for the same reason the session cookie is:
 * a byte-at-a-time `===` on a shared secret is measurable over enough requests.
 */
function authorized(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers.authorization
  if (typeof header !== 'string') return false
  const expected = `Bearer ${secret}`
  if (header.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < header.length; i++) diff |= header.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!process.env.CRON_SECRET) {
    console.error('CRON_SECRET is not set — refusing to run the retention pass')
    res.status(503).json({ error: 'Not configured' })
    return
  }
  if (!authorized(req)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const db = sql()

    // `make_interval` rather than a JS-computed cutoff, so "6 months" means what
    // it means in db/schema.sql — calendar months, not 180 days.
    //
    // The delete is wrapped in a CTE because a bare `delete` over the HTTP
    // driver resolves to an empty array: there is no row count to log unless you
    // ask for one. `returning 1` counted in the same statement gets it in one
    // round trip, where `returning id` would haul every deleted key back over
    // the wire to be thrown away.
    const [views] = await db`
      with deleted as (
        delete from page_views
        where created_at < now() - make_interval(months => ${RETENTION_MONTHS})
        returning 1
      )
      select count(*)::int as n from deleted
    ` as { n: number }[]

    // Sequential, not one transaction: these are independent, and if the second
    // fails there is nothing about the first worth rolling back. Both are
    // idempotent, so the next run picks up whatever this one missed.
    //
    // `page_views.session_id` cascades from here, so this also sweeps any view
    // rows the first delete left behind — it cannot fail on a foreign key.
    const [sessions] = await db`
      with deleted as (
        delete from visitor_sessions
        where last_beat_at < now() - make_interval(months => ${RETENTION_MONTHS})
        returning 1
      )
      select count(*)::int as n from deleted
    ` as { n: number }[]

    // Logged rather than shown anywhere — this endpoint is only ever called by
    // the scheduler, so the Vercel log is the only reader.
    console.log(
      `Retention pass (${RETENTION_MONTHS} months): page_views ${views?.n ?? 0}, ` +
      `visitor_sessions ${sessions?.n ?? 0}`,
    )
    res.status(200).json({ ok: true, pageViews: views?.n ?? 0, sessions: sessions?.n ?? 0 })
  } catch (err) {
    console.error('Retention pass failed:', err)
    res.status(500).json({ error: 'Retention pass failed' })
  }
}
