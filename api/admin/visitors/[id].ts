import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../../_lib/auth.js'
import { sql } from '../../_lib/db.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!requireAdmin(req, res)) return
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const raw = req.query.id
  const id = Array.isArray(raw) ? raw[0] : raw
  if (typeof id !== 'string' || !UUID_RE.test(id)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }

  try {
    const db = sql()
    const visitorRows = (await db`
      select id, first_seen_at, last_seen_at, user_agent
      from visitors
      where id = ${id}
    `) as Record<string, unknown>[]
    if (visitorRows.length === 0) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    const messages = (await db`
      select id, role, content, created_at
      from chat_messages
      where visitor_id = ${id}
      order by created_at asc, id asc
    `) as Record<string, unknown>[]
    const submissions = (await db`
      select id, name, email, message, created_at
      from contact_submissions
      where visitor_id = ${id}
      order by created_at desc
    `) as Record<string, unknown>[]
    res.status(200).json({
      visitor: visitorRows[0],
      messages,
      submissions,
    })
  } catch (err) {
    console.error('Admin visitor detail error:', err)
    res.status(500).json({ error: 'Failed to load visitor' })
  }
}
