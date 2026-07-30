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

// Vercel percent-encodes non-ASCII city names (e.g. `Z%C3%BCrich`). A malformed
// sequence makes decodeURIComponent throw, which used to reject the whole upsert
// and take the caller's entire persistence path down with it — in chat.ts that
// meant losing the transcript, not just the city. Degrade to the raw value.
function readGeoHeader(req: VercelRequest, name: string): string | null {
  const raw = req.headers[name]
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string' || value === '') return null
  try {
    return decodeURIComponent(value).slice(0, 120)
  } catch {
    return value.slice(0, 120)
  }
}

export async function upsertVisitor(req: VercelRequest): Promise<string | null> {
  const id = readVisitorId(req)
  if (!id) return null

  const ua = req.headers['user-agent']
  const userAgent = typeof ua === 'string' ? ua.slice(0, 500) : null

  // All four are absent outside Vercel's edge network, so local `vercel dev`
  // and any non-edge invocation legitimately writes nulls here.
  const country  = readGeoHeader(req, 'x-vercel-ip-country')
  const city     = readGeoHeader(req, 'x-vercel-ip-city')
  const region   = readGeoHeader(req, 'x-vercel-ip-country-region')
  const timezone = readGeoHeader(req, 'x-vercel-ip-timezone')

  const rawReferrer = req.headers['x-referrer']
  const referrer = typeof rawReferrer === 'string' ? rawReferrer.slice(0, 500) || null : null

  // coalesce(existing, new) keeps the first non-null sighting and backfills
  // columns that are still null — so a row created without geo (an events-only
  // visitor, or a local dev write) gets filled in by any later edge request.
  const db = sql()
  await db`
    insert into visitors (id, user_agent, country, city, region, timezone, referrer)
    values (${id}, ${userAgent}, ${country}, ${city}, ${region}, ${timezone}, ${referrer})
    on conflict (id) do update
      set last_seen_at = now(),
          user_agent = coalesce(visitors.user_agent, excluded.user_agent),
          country    = coalesce(visitors.country,    excluded.country),
          city       = coalesce(visitors.city,       excluded.city),
          region     = coalesce(visitors.region,     excluded.region),
          timezone   = coalesce(visitors.timezone,   excluded.timezone),
          referrer   = coalesce(visitors.referrer,   excluded.referrer)
  `
  return id
}
