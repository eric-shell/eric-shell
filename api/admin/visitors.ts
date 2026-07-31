import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_lib/auth.js'
import { sql } from '../_lib/db.js'
import type { VisitorListPayload, VisitorSummary } from '../_lib/types.js'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!requireAdmin(req, res)) return
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const db = sql()
    const rows = await db`
      select
        v.id,
        v.first_seen_at,
        v.last_seen_at,
        v.user_agent,
        v.country,
        v.city,
        v.region,
        v.timezone,
        v.location_override,
        v.client_timezone,
        v.language,
        v.referrer,
        coalesce(c.chat_count, 0)::int      as chat_message_count,
        coalesce(s.contact_count, 0)::int   as contact_count,
        coalesce(p.view_count, 0)::int      as page_view_count,
        coalesce(ss.session_count, 0)::int  as session_count,
        -- Distinct days with a session, not just a session count: two visits
        -- twenty minutes apart is one sitting, not a return.
        coalesce(ss.active_days, 0)::int    as active_days,
        coalesce(ss.max_scroll_pct, 0)::int as max_scroll_pct,
        -- float8, not bigint: the Neon driver returns int8 as a string, which
        -- would silently violate the numeric type on VisitorSummary.
        coalesce(ss.engaged_ms, 0)::float8  as total_engaged_ms,
        greatest(
          v.last_seen_at,
          coalesce(c.last_chat_at, v.last_seen_at),
          coalesce(s.last_contact_at, v.last_seen_at),
          coalesce(p.last_view_at, v.last_seen_at),
          coalesce(ss.last_beat_at, v.last_seen_at)
        ) as last_activity_at,
        s.latest_name  as contact_name,
        s.latest_email as contact_email
      from visitors v
      left join (
        select visitor_id,
               count(*) as chat_count,
               max(created_at) as last_chat_at
        from chat_messages
        group by visitor_id
      ) c on c.visitor_id = v.id
      left join (
        select visitor_id,
               count(*) as contact_count,
               max(created_at) as last_contact_at,
               (array_agg(name order by created_at desc))[1] as latest_name,
               (array_agg(email order by created_at desc))[1] as latest_email
        from contact_submissions
        where visitor_id is not null
        group by visitor_id
      ) s on s.visitor_id = v.id
      left join (
        select visitor_id,
               count(*) as view_count,
               max(created_at) as last_view_at
        from page_views
        group by visitor_id
      ) p on p.visitor_id = v.id
      left join (
        select visitor_id,
               count(*) as session_count,
               count(distinct started_at::date) as active_days,
               max(max_scroll_pct) as max_scroll_pct,
               sum(engaged_ms) as engaged_ms,
               max(last_beat_at) as last_beat_at
        from visitor_sessions
        group by visitor_id
      ) ss on ss.visitor_id = v.id
      order by last_activity_at desc
      limit 500
    ` as VisitorSummary[]
    const payload: VisitorListPayload = { visitors: rows }
    res.status(200).json(payload)
  } catch (err) {
    console.error('Admin visitors list error:', err)
    res.status(500).json({ error: 'Failed to load visitors' })
  }
}
