import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_lib/auth.js'
import { sql } from '../_lib/db.js'
import type { InsightsPayload } from '../_lib/insights-types.js'

/**
 * One aggregate payload for the dashboard's insight charts.
 *
 * Deliberately a SINGLE endpoint returning a SINGLE JSON body, fetched on the
 * dashboard's existing poll (see Dashboard.tsx) rather than on a loop of its
 * own. Every statement below rides in one `db.transaction([...])`, so the whole
 * thing costs **one** Neon HTTP round trip — the driver bills and delays per
 * request, so five sequential queries would cost 5x the compute and stack 5x
 * the latency for data that is always read together.
 */

/** Matches the visitors chart's look-back so the whole dashboard agrees. */
const WINDOW_DAYS = 30

/** Top-N caps. Long tails belong in a table, not a bar list. */
const SOURCE_LIMIT = 8
const PATH_LIMIT = 8

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

/**
 * The Neon driver hands back a `timestamptz` as a Date, but a `null` aggregate
 * and a string are both reachable depending on the column's inferred type —
 * normalise to ISO or null so the client never has to guess.
 */
function isoOrNull(v: unknown): string | null {
  const d = v instanceof Date ? v : typeof v === 'string' && v !== '' ? new Date(v) : null
  if (!d || Number.isNaN(d.valueOf())) return null
  return d.toISOString()
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!requireAdmin(req, res)) return
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const db = sql()

    const [sessionRows, returnRows, sourceRows, pathRows, hourRows] = (await db.transaction([
      // Sessions: totals, viewport mix, and scroll reach in one pass.
      //
      // SCROLL DEPTH IS GATED ON A DERIVED CUTOFF. Every session written before
      // the telemetry fix stored max_scroll_pct = 100: the client seeded its
      // running maximum from a document that React had not committed yet, so
      // the "nothing to scroll" branch pinned it at 100 and the listener only
      // ever raised values. Those rows cannot be back-filled (the column is
      // `not null` and no true value survives), and charting them would draw a
      // perfectly flat 100% funnel that looks like a finding.
      //
      // The first session that ever recorded a value strictly between 0 and 100
      // cannot have come from the broken client, so its start time is the
      // earliest the column can be trusted from — derived rather than a deploy
      // date hardcoded by someone who could not have known it. The bounds are
      // *exclusive on both ends* on purpose: 100 is the broken client's only
      // output, and 0 is the column default on a session that was inserted by a
      // pageview and never sent a heartbeat, so neither value proves a working
      // client. Sessions before the cutoff are counted as `sc_excluded` so the
      // UI can say how many it dropped rather than silently narrowing the
      // denominator.
      //
      // All four buckets are "at least", so the funnel is monotonic by
      // construction and can never render a stage wider than the one above it.
      db`
        with cutoff as (
          select min(started_at) as ts
          from visitor_sessions
          where max_scroll_pct > 0 and max_scroll_pct < 100
        )
        select
          count(*)::int                                                          as total,
          count(*) filter (where viewport_w is not null)::int                     as vp_known,
          count(*) filter (where viewport_w < 640)::int                           as vp_phone,
          count(*) filter (where viewport_w >= 640 and viewport_w < 1024)::int    as vp_tablet,
          count(*) filter (where viewport_w >= 1024)::int                         as vp_desktop,
          (select ts from cutoff)                                                 as sc_since,
          count(*) filter (
            where started_at >= (select ts from cutoff)
          )::int                                                                  as sc_measured,
          count(*) filter (
            where (select ts from cutoff) is null or started_at < (select ts from cutoff)
          )::int                                                                  as sc_excluded,
          count(*) filter (
            where started_at >= (select ts from cutoff) and max_scroll_pct >= 25
          )::int                                                                  as pct25,
          count(*) filter (
            where started_at >= (select ts from cutoff) and max_scroll_pct >= 50
          )::int                                                                  as pct50,
          count(*) filter (
            where started_at >= (select ts from cutoff) and max_scroll_pct >= 75
          )::int                                                                  as pct75,
          count(*) filter (
            where started_at >= (select ts from cutoff) and max_scroll_pct >= 90
          )::int                                                                  as pct90
        from visitor_sessions
        where started_at >= now() - make_interval(days => ${WINDOW_DAYS})
      `,
      // Returning = sessions on 2+ separate days, matching the `Returning` tag
      // in src/admin/lib/classify.ts. Two visits twenty minutes apart is one
      // sitting, not a return. Days are UTC — see the caveat in the UI copy.
      db`
        select
          count(*)::int                        as visitors,
          count(*) filter (where d >= 2)::int  as returning
        from (
          select visitor_id, count(distinct (started_at at time zone 'UTC')::date) as d
          from visitor_sessions
          where started_at >= now() - make_interval(days => ${WINDOW_DAYS})
          group by visitor_id
        ) per_visitor
      `,
      // Entry referrer per session, reduced to a bare host.
      //
      // split_part rather than regexp_replace on purpose: a backreference like
      // \1 inside a tagged template literal is an invalid escape, which leaves
      // the *cooked* string undefined for that chunk — the Neon driver reads
      // the cooked strings, so the query would silently arrive mangled.
      db`
        select
          case
            when referrer is null or referrer = '' then ''
            when lower(split_part(split_part(split_part(referrer, '://', 2), '/', 1), '?', 1)) like 'www.%'
              then substr(lower(split_part(split_part(split_part(referrer, '://', 2), '/', 1), '?', 1)), 5)
            else lower(split_part(split_part(split_part(referrer, '://', 2), '/', 1), '?', 1))
          end                as host,
          count(*)::int      as sessions
        from visitor_sessions
        where started_at >= now() - make_interval(days => ${WINDOW_DAYS})
        group by 1
        order by sessions desc, host
        limit ${SOURCE_LIMIT}
      `,
      db`
        select
          path,
          count(*)::int                    as views,
          count(distinct visitor_id)::int  as visitors
        from page_views
        where created_at >= now() - make_interval(days => ${WINDOW_DAYS})
        group by path
        order by views desc, path
        limit ${PATH_LIMIT}
      `,
      // UTC hour. Postgres has no idea what the reader's clock says, so the
      // shift to local time happens in the browser, which does.
      db`
        select
          extract(hour from created_at at time zone 'UTC')::int as hour,
          count(*)::int                                         as views
        from page_views
        where created_at >= now() - make_interval(days => ${WINDOW_DAYS})
        group by 1
        order by 1
      `,
    ])) as [
      Record<string, unknown>[],
      Record<string, unknown>[],
      Record<string, unknown>[],
      Record<string, unknown>[],
      Record<string, unknown>[],
    ]

    const s = sessionRows[0] ?? {}
    const r = returnRows[0] ?? {}

    // Zero-fill so the chart always has 24 columns — a sparse array would make
    // a quiet hour indistinguishable from a missing one.
    const byHour = new Map<number, number>()
    for (const row of hourRows) byHour.set(num(row.hour), num(row.views))

    const payload: InsightsPayload = {
      windowDays: WINDOW_DAYS,
      sessions: {
        total: num(s.total),
        scroll: {
          reach: {
            pct25: num(s.pct25),
            pct50: num(s.pct50),
            pct75: num(s.pct75),
            pct90: num(s.pct90),
          },
          measured: num(s.sc_measured),
          excluded: num(s.sc_excluded),
          since: isoOrNull(s.sc_since),
        },
        viewport: {
          known: num(s.vp_known),
          phone: num(s.vp_phone),
          tablet: num(s.vp_tablet),
          desktop: num(s.vp_desktop),
        },
      },
      visitors: {
        total: num(r.visitors),
        returning: num(r.returning),
      },
      sources: sourceRows.map(row => ({
        host: typeof row.host === 'string' ? row.host : '',
        sessions: num(row.sessions),
      })),
      paths: pathRows.map(row => ({
        path: typeof row.path === 'string' ? row.path : '/',
        views: num(row.views),
        visitors: num(row.visitors),
      })),
      hourly: Array.from({ length: 24 }, (_, hour) => ({ hour, views: byHour.get(hour) ?? 0 })),
    }

    res.status(200).json(payload)
  } catch (err) {
    console.error('Admin insights error:', err)
    res.status(500).json({ error: 'Failed to load insights' })
  }
}
