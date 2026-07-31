import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_lib/db.js'
import { checkRateLimit } from './_lib/ratelimit.js'
import { readVisitorId, upsertVisitor } from './_lib/visitor.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VALID_TYPES = ['ada_toggle', 'chat_cleared', 'speech_input']

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const rate = await checkRateLimit(req, 'events', [
    { name: 'burst',  windowMs: 60_000,    max: 10 },
    { name: 'hourly', windowMs: 3_600_000, max: 200 },
  ])
  if (rate.limited) {
    return res.status(204).end()
  }

  const { visitorId, type, metadata } = req.body ?? {}
  const id = typeof visitorId === 'string' ? visitorId.toLowerCase() : null

  if (!id || !UUID_RE.test(id) || !VALID_TYPES.includes(type)) {
    return res.status(204).end()
  }

  try {
    const db = sql()
    // Prefer the shared upsert: it captures user-agent, IP-derived geo, and
    // referrer from this request. Falling back to a bare insert would create a
    // metadata-less row, and an events-only visitor (toggled high-contrast but
    // never sent a message) would never reach chat.ts/contact.ts to be filled in.
    // upsertVisitor keys off the X-Visitor-Id header, so only use it when that
    // agrees with the body id — otherwise we'd enrich one row and FK-insert the
    // event against another that may not exist.
    const upserted = readVisitorId(req) === id ? await upsertVisitor(req) : null
    if (!upserted) {
      await db`
        insert into visitors (id) values (${id})
        on conflict (id) do update set last_seen_at = now()
      `
    }
    await db`
      insert into visitor_events (visitor_id, type, metadata)
      values (${id}, ${type}, ${metadata ? JSON.stringify(metadata) : null})
    `
  } catch {
    // best-effort
  }

  res.status(204).end()
}
