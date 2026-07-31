import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../../_lib/auth.js'
import { sql } from '../../_lib/db.js'
import type {
  ChatMessage, ContactSubmission, PageView, Visitor, VisitorDetailPayload, VisitorSession,
} from '../../_lib/types.js'

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
      const body = (req.body ?? {}) as { notes?: unknown; location_override?: unknown }

      // Only touch fields the caller actually sent. Reading an absent key as
      // `null` would let a location-only PATCH silently wipe the notes.
      const toText = (v: unknown, max: number) =>
        typeof v === 'string' ? v.trim().slice(0, max) || null : null
      const notes = 'notes' in body ? toText(body.notes, 5000) : undefined
      const location = 'location_override' in body ? toText(body.location_override, 120) : undefined

      if (notes === undefined && location === undefined) {
        res.status(400).json({ error: 'Nothing to update' })
        return
      }

      const db = sql()
      // Two narrow statements instead of dynamic SQL — keeps every value
      // parameterized through the tagged template.
      if (notes !== undefined) {
        await db`update visitors set notes = ${notes} where id = ${id}`
      }
      if (location !== undefined) {
        await db`update visitors set location_override = ${location} where id = ${id}`
      }
      res.status(200).json({ ok: true })
    } catch (err) {
      console.error('Admin visitor patch error:', err)
      res.status(500).json({ error: 'Failed to save changes' })
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
      const deleted = (await db`delete from visitors where id = ${id} returning id`) as { id: string }[]
      if (deleted.length === 0) {
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
      select id, first_seen_at, last_seen_at, user_agent, country, city,
             region, timezone, location_override, client_timezone, language,
             referrer, notes
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
    const sessions = (await db`
      select s.id, s.started_at, s.last_beat_at, s.engaged_ms, s.max_scroll_pct,
             s.entry_path, s.referrer, s.viewport_w, s.viewport_h, s.screen_w, s.screen_h,
             s.utm_source, s.utm_medium, s.utm_campaign,
             (select count(*) from page_views p where p.session_id = s.id)::int as page_view_count
      from visitor_sessions s
      where s.visitor_id = ${id}
      order by s.started_at desc
      limit 100
    `) as VisitorSession[]
    const pageViews = (await db`
      select id, session_id, path, referrer, created_at
      from page_views
      where visitor_id = ${id}
      order by created_at desc
      limit 500
    `) as PageView[]

    const payload: VisitorDetailPayload = {
      visitor: visitorRows[0],
      messages,
      submissions,
      events,
      clearEvents,
      sessions,
      pageViews,
    }
    res.status(200).json(payload)
  } catch (err) {
    console.error('Admin visitor detail error:', err)
    res.status(500).json({ error: 'Failed to load visitor' })
  }
}
