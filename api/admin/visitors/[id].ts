import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../../_lib/auth.js'
import { sql } from '../../_lib/db.js'
import type { ChatMessage, ContactSubmission, Visitor, VisitorDetailPayload } from '../../_lib/types.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!requireAdmin(req, res)) return

  const raw = req.query.id
  const id = Array.isArray(raw) ? raw[0] : raw
  if (typeof id !== 'string' || !UUID_RE.test(id)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }

  if (req.method === 'PATCH') {
    try {
      const { notes } = (req.body ?? {}) as { notes?: unknown }
      const notesVal = typeof notes === 'string' ? notes.trim() || null : null
      const db = sql()
      await db`update visitors set notes = ${notesVal} where id = ${id}`
      res.status(200).json({ ok: true })
    } catch (err) {
      console.error('Admin visitor notes error:', err)
      res.status(500).json({ error: 'Failed to save notes' })
    }
    return
  }

  if (req.method === 'DELETE') {
    try {
      const db = sql()
      // Contact submissions FK is `on delete set null`, so explicitly remove
      // them first to honor right-to-deletion. Chat messages and events
      // cascade-delete automatically.
      await db`delete from contact_submissions where visitor_id = ${id}`
      const result = await db`delete from visitors where id = ${id}`
      const rowCount = (result as unknown as { count?: number; rowCount?: number }).count
        ?? (result as unknown as { rowCount?: number }).rowCount
        ?? 0
      if (rowCount === 0) {
        res.status(404).json({ error: 'Not found' })
        return
      }
      res.status(200).json({ ok: true })
    } catch (err) {
      console.error('Admin visitor delete error:', err)
      res.status(500).json({ error: 'Failed to delete visitor' })
    }
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const db = sql()
    const visitorRows = (await db`
      select id, first_seen_at, last_seen_at, user_agent, country, city, referrer, notes
      from visitors
      where id = ${id}
    `) as Visitor[]
    if (visitorRows.length === 0) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    const messages = (await db`
      select id, role, content, created_at
      from chat_messages
      where visitor_id = ${id}
      order by created_at asc, id asc
    `) as ChatMessage[]
    const submissions = (await db`
      select id, name, email, message, created_at
      from contact_submissions
      where visitor_id = ${id}
      order by created_at desc
    `) as ContactSubmission[]
    const eventRows = (await db`
      select type, count(*)::int as count
      from visitor_events
      where visitor_id = ${id}
      group by type
    `) as { type: string; count: number }[]
    const events = Object.fromEntries(eventRows.map(r => [r.type, r.count]))
    const clearEvents = (await db`
      select created_at
      from visitor_events
      where visitor_id = ${id} and type = 'chat_cleared'
      order by created_at asc
    `) as { created_at: string }[]
    const payload: VisitorDetailPayload = {
      visitor: visitorRows[0],
      messages,
      submissions,
      events,
      clearEvents,
    }
    res.status(200).json(payload)
  } catch (err) {
    console.error('Admin visitor detail error:', err)
    res.status(500).json({ error: 'Failed to load visitor' })
  }
}
