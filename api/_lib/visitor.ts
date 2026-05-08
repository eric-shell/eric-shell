import type { VercelRequest } from '@vercel/node'
import { sql } from './db.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function readVisitorId(req: VercelRequest): string | null {
  const raw = req.headers['x-visitor-id']
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string') return null
  return UUID_RE.test(value) ? value.toLowerCase() : null
}

export async function upsertVisitor(req: VercelRequest): Promise<string | null> {
  const id = readVisitorId(req)
  if (!id) return null

  const ua = req.headers['user-agent']
  const userAgent = typeof ua === 'string' ? ua.slice(0, 500) : null

  const db = sql()
  await db`
    insert into visitors (id, user_agent)
    values (${id}, ${userAgent})
    on conflict (id) do update
      set last_seen_at = now(),
          user_agent = coalesce(visitors.user_agent, excluded.user_agent)
  `
  return id
}
