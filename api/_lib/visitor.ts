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

/**
 * The visit this request belongs to, per the client.
 *
 * Same trust level as the visitor id — client-supplied, pseudonymous, never a
 * credential. It exists because it is the more durable of the two: a visitor id
 * that changes mid-visit (storage evicted, two documents minting at once) used
 * to fork one person into two CRM rows, and the session id is what stayed
 * constant through it. See `SESSION_OWNER`.
 */
export function readSessionId(req: VercelRequest): string | null {
  const raw = req.headers['x-session-id']
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string') return null
  return UUID_RE.test(value) ? value.toLowerCase() : null
}

/**
 * Identity resolution, shared by every endpoint that writes a visitor row.
 *
 * `select coalesce((select visitor_id from visitor_sessions where id = $sess),
 * $vid)` — the visitor the session already belongs to, falling back to the id
 * the client sent.
 *
 * The first page view of a visit establishes the owner, and `visitor_sessions`
 * never reassigns `visitor_id` on conflict, so that owner is stable for the life
 * of the session: every later request in the visit resolves to it no matter what
 * the browser now thinks its id is. A session id we've never seen, or none at
 * all, falls straight through to the client's id.
 *
 * It is written as a CTE inlined into each caller's existing statement rather
 * than as its own lookup — /api/track is the highest-volume endpoint on the site
 * and was deliberately built to cost one round trip per page view.
 *
 * Worth stating plainly: a caller who guesses another visitor's session UUID can
 * attach rows to them. That is the exposure X-Visitor-Id already carries — both
 * are pseudonymous analytics keys, nothing is authorized off either, and a v4
 * UUID is not guessable in practice.
 */

/**
 * A referrer worth storing as acquisition, or null.
 *
 * `document.referrer` is whatever document linked here — which on any internal
 * navigation is one of our own pages. `visitors.referrer` and
 * `visitor_sessions.referrer` are both written with `coalesce(existing, new)`,
 * i.e. "first non-null wins", so a visit that arrived untagged (direct, or from
 * an app that sends no referrer) and *then* clicked from `/` to `/resume` had
 * its acquisition backfilled as `https://eric.sh/resume` — the site recorded
 * itself as the source of its own traffic.
 *
 * Those two columns mean "where this visit came from", so a same-site value is
 * not a weaker answer than null, it is a wrong one. `page_views.referrer` is
 * deliberately NOT filtered: there it means "which page linked to this one",
 * and internal is the interesting case.
 */
export function externalReferrer(value: string | null, req: VercelRequest): string | null {
  if (!value) return null
  const rawHost = req.headers.host
  const host = (Array.isArray(rawHost) ? rawHost[0] : rawHost) ?? ''
  // Strip port and a leading `www.` on both sides: eric.sh and www.eric.sh are
  // the same site, and localhost:3000 must still match localhost under
  // `vercel dev` or every local page view records itself as a referrer.
  const bare = (h: string) => h.split(':')[0].replace(/^www\./, '').toLowerCase()
  try {
    return bare(new URL(value).hostname) === bare(host) ? null : value
  } catch {
    // Not a parseable URL. A referrer we can't attribute is not acquisition
    // data, and it is attacker-supplied text bound for the admin UI.
    return null
  }
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

export interface VisitorGeo {
  userAgent: string | null
  country: string | null
  city: string | null
  region: string | null
  timezone: string | null
  referrer: string | null
}

/**
 * Pull everything we record off the request headers, without writing.
 *
 * Split out from `upsertVisitor` so a caller that is already batching SQL
 * (see api/track.ts) can inline these values into its own statement instead of
 * paying for a second round trip.
 */
export function readVisitorGeo(req: VercelRequest): VisitorGeo {
  const ua = req.headers['user-agent']
  const rawReferrer = req.headers['x-referrer']
  return {
    userAgent: typeof ua === 'string' ? ua.slice(0, 500) : null,
    // All four geo values are absent outside Vercel's edge network, so local
    // `vercel dev` and any non-edge invocation legitimately reads nulls.
    country:  readGeoHeader(req, 'x-vercel-ip-country'),
    city:     readGeoHeader(req, 'x-vercel-ip-city'),
    region:   readGeoHeader(req, 'x-vercel-ip-country-region'),
    timezone: readGeoHeader(req, 'x-vercel-ip-timezone'),
    referrer: externalReferrer(
      typeof rawReferrer === 'string' ? rawReferrer.slice(0, 500) || null : null,
      req,
    ),
  }
}

/**
 * Upsert the visitor this request belongs to and return the id it resolved to.
 *
 * Callers must persist their own rows against the RETURNED id, not the one they
 * read off the header: when the session already has an owner they differ, and
 * that is the whole point.
 */
export async function upsertVisitor(req: VercelRequest): Promise<string | null> {
  const id = readVisitorId(req)
  if (!id) return null
  const sessionId = readSessionId(req)

  const { userAgent, country, city, region, timezone, referrer } = readVisitorGeo(req)

  // coalesce(existing, new) keeps the first non-null sighting and backfills
  // columns that are still null — so a row created without geo (an events-only
  // visitor, or a local dev write) gets filled in by any later edge request.
  const db = sql()
  const rows = (await db`
    with resolved as (
      select coalesce(
        (select visitor_id from visitor_sessions where id = ${sessionId}::uuid),
        ${id}::uuid
      ) as id
    )
    insert into visitors (id, user_agent, country, city, region, timezone, referrer)
    select resolved.id, ${userAgent}, ${country}, ${city}, ${region}, ${timezone}, ${referrer}
    from resolved
    on conflict (id) do update
      set last_seen_at = now(),
          user_agent = coalesce(visitors.user_agent, excluded.user_agent),
          country    = coalesce(visitors.country,    excluded.country),
          city       = coalesce(visitors.city,       excluded.city),
          region     = coalesce(visitors.region,     excluded.region),
          timezone   = coalesce(visitors.timezone,   excluded.timezone),
          referrer   = coalesce(visitors.referrer,   excluded.referrer)
    returning id
  `) as { id: string }[]
  // `returning` fires for both the insert and the update path, so a row always
  // comes back; the fallback is only for a driver returning nothing at all.
  return rows[0]?.id ?? id
}
