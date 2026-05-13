import type { VercelRequest } from '@vercel/node'
import { sql } from './db.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// X-Visitor-Id is set by the browser and is NOT an identity. It is pseudonymous
// only — any client can send any UUID. Never use it for authorization, access
// control, or any decision that requires trust. Use `requireAdmin` for that.
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

  const rawCountry = req.headers['x-vercel-ip-country']
  const country = typeof rawCountry === 'string' ? rawCountry : null

  const rawCity = req.headers['x-vercel-ip-city']
  const city = typeof rawCity === 'string' ? decodeURIComponent(rawCity) : null

  const rawReferrer = req.headers['x-referrer']
  const referrer = typeof rawReferrer === 'string' ? rawReferrer.slice(0, 500) || null : null

  const db = sql()
  await db`
    insert into visitors (id, user_agent, country, city, referrer)
    values (${id}, ${userAgent}, ${country}, ${city}, ${referrer})
    on conflict (id) do update
      set last_seen_at = now(),
          user_agent = coalesce(visitors.user_agent, excluded.user_agent),
          country    = coalesce(visitors.country,    excluded.country),
          city       = coalesce(visitors.city,       excluded.city),
          referrer   = coalesce(visitors.referrer,   excluded.referrer)
  `
  return id
}
