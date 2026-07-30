import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_lib/db.js'
import { checkRateLimit } from './_lib/ratelimit.js'
import { readVisitorId, upsertVisitor } from './_lib/visitor.js'

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

  // Heartbeats arrive on a timer, so the ceiling has to accommodate a long
  // session: at HEARTBEAT_MS = 20s a continuously-open tab sends ~180/hour.
  const rate = await checkRateLimit(req, 'track', [
    { name: 'burst',  windowMs: 60_000,    max: 20 },
    { name: 'hourly', windowMs: 3_600_000, max: 400 },
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

    // The pageview is a normal fetch, so it carries X-Visitor-Id and the Vercel
    // edge geo headers — that is where enrichment happens. Heartbeats go out via
    // sendBeacon, which cannot set headers, so they only touch engagement.
    if (readVisitorId(req) === visitorId) {
      await upsertVisitor(req)
    } else {
      await db`
        insert into visitors (id) values (${visitorId})
        on conflict (id) do update set last_seen_at = now()
      `
    }

    if (type === 'pageview') {
      const clientTimezone = text(body.clientTimezone, 60)
      const language = text(body.language, 20)
      if (clientTimezone || language) {
        // Browser-reported, so let a fresh value win over a stale one rather
        // than coalescing to the first sighting like the IP-derived columns do.
        await db`
          update visitors
             set client_timezone = coalesce(${clientTimezone}, client_timezone),
                 language        = coalesce(${language},        language)
           where id = ${visitorId}
        `
      }

      const path = text(body.path, 300) ?? '/'
      const referrer = text(body.referrer, 500)

      await db`
        insert into visitor_sessions
          (id, visitor_id, entry_path, referrer, viewport_w, viewport_h, screen_w, screen_h)
        values (
          ${sessionId}, ${visitorId}, ${path}, ${referrer},
          ${int(body.viewportW, 20000)}, ${int(body.viewportH, 20000)},
          ${int(body.screenW, 20000)},   ${int(body.screenH, 20000)}
        )
        on conflict (id) do update set last_beat_at = now()
      `
      await db`
        insert into page_views (visitor_id, session_id, path, referrer)
        values (${visitorId}, ${sessionId}, ${path}, ${referrer})
      `
    } else {
      // greatest() keeps these monotonic under out-of-order delivery. The insert
      // branch covers a heartbeat that somehow outruns its own pageview.
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
