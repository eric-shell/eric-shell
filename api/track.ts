import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_lib/db.js'
import { checkRateLimit } from './_lib/ratelimit.js'
import { readVisitorGeo, readVisitorId } from './_lib/visitor.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Clamp to a sane integer or null. Guards against junk and absurd values. */
function int(v: unknown, max: number): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null
  const n = Math.round(v)
  if (n < 0) return null
  return Math.min(n, max)
}

function text(v: unknown, max: number): string | null {
  return typeof v === 'string' && v !== '' ? v.slice(0, max) : null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // A single window, not the burst+hourly pair the other endpoints use: each
  // limiter is its own Upstash round trip, and this is the highest-volume
  // endpoint on the site, so the second one doubled the command bill to guard
  // traffic the first window already caps. The client backs off to a 5-minute
  // beat, so a well-behaved tab sends well under this ceiling.
  const rate = await checkRateLimit(req, 'track', [
    { name: 'sustained', windowMs: 600_000, max: 60 },
  ])
  // Always 204 — telemetry must never surface an error to the visitor, and a
  // 429 body would just be noise the client discards anyway.
  if (rate.limited) return res.status(204).end()

  const body = (req.body ?? {}) as Record<string, unknown>
  const visitorId = typeof body.visitorId === 'string' ? body.visitorId.toLowerCase() : null
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.toLowerCase() : null
  const type = body.type

  if (!visitorId || !UUID_RE.test(visitorId)) return res.status(204).end()
  if (!sessionId || !UUID_RE.test(sessionId)) return res.status(204).end()
  if (type !== 'pageview' && type !== 'heartbeat') return res.status(204).end()

  try {
    const db = sql()

    if (type === 'pageview') {
      // The pageview is a normal fetch, so it carries X-Visitor-Id and the
      // Vercel edge geo headers — this is the only place enrichment happens.
      // Heartbeats go out via sendBeacon, which cannot set headers.
      const geo = readVisitorId(req) === visitorId ? readVisitorGeo(req) : null
      const clientTimezone = text(body.clientTimezone, 60)
      const language = text(body.language, 20)
      const path = text(body.path, 300) ?? '/'
      const referrer = text(body.referrer, 500)

      // One HTTP round trip instead of four. The Neon driver bills and delays
      // per request, so a pageview that fanned out into four sequential
      // round trips cost 4x the compute time and stacked 4x the latency.
      await db.transaction([
        db`
          insert into visitors (id, user_agent, country, city, region, timezone,
                                referrer, client_timezone, language)
          values (${visitorId}, ${geo?.userAgent ?? null}, ${geo?.country ?? null},
                  ${geo?.city ?? null}, ${geo?.region ?? null}, ${geo?.timezone ?? null},
                  ${geo?.referrer ?? null}, ${clientTimezone}, ${language})
          on conflict (id) do update
            set last_seen_at = now(),
                user_agent = coalesce(visitors.user_agent, excluded.user_agent),
                country    = coalesce(visitors.country,    excluded.country),
                city       = coalesce(visitors.city,       excluded.city),
                region     = coalesce(visitors.region,     excluded.region),
                timezone   = coalesce(visitors.timezone,   excluded.timezone),
                referrer   = coalesce(visitors.referrer,   excluded.referrer),
                -- Browser-reported, so a fresh value wins over a stale one
                -- rather than coalescing to the first sighting.
                client_timezone = coalesce(excluded.client_timezone, visitors.client_timezone),
                language        = coalesce(excluded.language,        visitors.language)
        `,
        db`
          insert into visitor_sessions
            (id, visitor_id, entry_path, referrer, viewport_w, viewport_h, screen_w, screen_h)
          values (
            ${sessionId}, ${visitorId}, ${path}, ${referrer},
            ${int(body.viewportW, 20000)}, ${int(body.viewportH, 20000)},
            ${int(body.screenW, 20000)},   ${int(body.screenH, 20000)}
          )
          on conflict (id) do update set last_beat_at = now()
        `,
        db`
          insert into page_views (visitor_id, session_id, path, referrer)
          values (${visitorId}, ${sessionId}, ${path}, ${referrer})
        `,
      ])
    } else {
      // Heartbeats deliberately do NOT touch `visitors`. Rewriting last_seen_at
      // every beat dirtied a row for no gain — the session's own last_beat_at
      // already records recency, and the row is refreshed on the next pageview.
      //
      // greatest() keeps these monotonic under out-of-order delivery. If the
      // session doesn't exist yet the insert branch runs, and the visitor FK
      // rejects it when no pageview ever landed — correct for best-effort
      // telemetry, since a beat with no session context carries nothing.
      await db`
        insert into visitor_sessions (id, visitor_id, engaged_ms, max_scroll_pct)
        values (${sessionId}, ${visitorId}, ${int(body.engagedMs, 86_400_000) ?? 0}, ${int(body.scrollPct, 100) ?? 0})
        on conflict (id) do update
          set last_beat_at   = now(),
              engaged_ms     = greatest(visitor_sessions.engaged_ms,     excluded.engaged_ms),
              max_scroll_pct = greatest(visitor_sessions.max_scroll_pct, excluded.max_scroll_pct)
      `
    }
  } catch (err) {
    // Best-effort, exactly like chat/contact persistence: a DB outage must never
    // be visible on the public site.
    console.error('Track error:', err)
  }

  res.status(204).end()
}
