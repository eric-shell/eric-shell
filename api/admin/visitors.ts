import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_lib/auth.js'
import { sql } from '../_lib/db.js'

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
        coalesce(c.chat_count, 0)::int     as chat_message_count,
        coalesce(s.contact_count, 0)::int  as contact_count,
        greatest(
          v.last_seen_at,
          coalesce(c.last_chat_at, v.last_seen_at),
          coalesce(s.last_contact_at, v.last_seen_at)
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
      order by last_activity_at desc
      limit 500
    `
    res.status(200).json({ visitors: rows })
  } catch (err) {
    console.error('Admin visitors list error:', err)
    res.status(500).json({ error: 'Failed to load visitors' })
  }
}
