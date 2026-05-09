import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_lib/db.js'
import { checkRateLimit } from './_lib/ratelimit.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VALID_TYPES = ['ada_toggle', 'chat_cleared']

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const rate = await checkRateLimit(req, 'events', [
    { name: 'burst', windowMs: 60_000, max: 60 },
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
    await db`
      insert into visitors (id) values (${id})
      on conflict (id) do update set last_seen_at = now()
    `
    await db`
      insert into visitor_events (visitor_id, type, metadata)
      values (${id}, ${type}, ${metadata ? JSON.stringify(metadata) : null})
    `
  } catch {
    // best-effort
  }

  res.status(204).end()
}
