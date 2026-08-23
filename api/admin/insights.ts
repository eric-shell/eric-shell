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
const CLICK_LIMIT = 8
const FILTER_LIMIT = 8

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

/**
 * A `date` column as the `YYYY-MM-DD` the visitors chart keys on.
 *
 * The driver hands a `date` back as a Date on some paths and a string on others,
 * so both are handled — and anything else falls back to the epoch rather than
 * throwing. A surprise type here should cost one bar on one chart, not 500 the
 * whole insights payload and blank every panel on the dashboard.
 */
function ymd(v: unknown): string {
  if (typeof v === 'string' && v.length >= 10) return v.slice(0, 10)
  const d = v instanceof Date ? v : new Date(String(v))
  return Number.isNaN(d.valueOf()) ? '1970-01-01' : d.toISOString().slice(0, 10)
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!requireAdmin(req, res)) return
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const db = sql()

    const [sessionRows, actionRows, sourceRows, clickRows, filterRows, pathRows, hourRows, dayRows] = (await db.transaction([
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
      // ACTION RATE: visitors who did something over visitors who showed up.
      //
      // The three numerators are the only acts on this site that mean a visit
      // went somewhere — a click that leaves for a project, a repo or the mail
      // client, a question put to the chat, or a contact submission. Everything
      // else the dashboard measures says a visit *happened*.
      //
      // `active` is the denominator and unions FIVE tables, one more than the
      // numerators need. That is what guarantees `acted <= visitors`: every
      // table a numerator reads from is in the union under the identical window
      // predicate, so the gauge can never draw an arc past its own track no
      // matter how the sources drift apart. It also matters for who gets
      // counted at all — telemetry is suppressed client-side for anyone sending
      // Do Not Track or Global Privacy Control, so a privacy-conscious visitor
      // can chat and submit the form while writing no session and no page view,
      // and `visitor_sessions` postdates the earliest visitors outright.
      //
      // `union`, not `union all`, in all four places: these are sets of
      // visitors, and a person with forty page views is one visitor.
      //
      // `role = 'user'` on the chat: api/chat.ts only ever inserts user and
      // assistant rows as a pair, so this is equivalent today — but it says the
      // thing that is actually meant, which is that a PERSON typed something.
      //
      // TWO READINGS OF THE SAME THREE ACTIONS, and the difference matters.
      //
      // `clicked` / `chatted` / `contacted` overlap: one visitor who clicked
      // out, then chatted, then wrote in is counted in all three and once in
      // `acted`, so they routinely sum past it. They are totals, never parts.
      //
      // `chatted_only` / `clicked_only` sort the same visitors into an
      // exclusive ladder by their strongest action, with `contacted` as the top
      // rung (nothing outranks it, so it needs no variant) and `total - acted`
      // as the remainder. Those four partition the denominator exactly, which
      // is what lets the UI draw them as one ring instead of a bare ratio.
      //
      // `not exists` rather than `not in`: the anti-join is NULL-safe, and a
      // single NULL on the right of `not in` makes the whole predicate return
      // no rows.
      db`
        with active as (
          select visitor_id from visitor_sessions
            where started_at >= now() - make_interval(days => ${WINDOW_DAYS})
          union
          select visitor_id from page_views
            where created_at >= now() - make_interval(days => ${WINDOW_DAYS})
          union
          select visitor_id from chat_messages
            where created_at >= now() - make_interval(days => ${WINDOW_DAYS})
          union
          select visitor_id from visitor_events
            where created_at >= now() - make_interval(days => ${WINDOW_DAYS})
          union
          select visitor_id from contact_submissions
            where visitor_id is not null
              and created_at >= now() - make_interval(days => ${WINDOW_DAYS})
        ),
        clicked as (
          select distinct visitor_id from visitor_events
            where type = 'outbound_click'
              and created_at >= now() - make_interval(days => ${WINDOW_DAYS})
        ),
        chatted as (
          select distinct visitor_id from chat_messages
            where role = 'user'
              and created_at >= now() - make_interval(days => ${WINDOW_DAYS})
        ),
        contacted as (
          select distinct visitor_id from contact_submissions
            where visitor_id is not null
              and created_at >= now() - make_interval(days => ${WINDOW_DAYS})
        )
        select
          (select count(*) from active)::int    as visitors,
          (select count(*) from (
            select visitor_id from clicked
            union
            select visitor_id from chatted
            union
            select visitor_id from contacted
          ) any_action)::int                    as acted,
          (select count(*) from clicked)::int   as clicked,
          (select count(*) from chatted)::int   as chatted,
          (select count(*) from contacted)::int as contacted,
          (select count(*) from chatted ch
             where not exists (
               select 1 from contacted c where c.visitor_id = ch.visitor_id
             ))::int                            as chatted_only,
          (select count(*) from clicked cl
             where not exists (
               select 1 from contacted c where c.visitor_id = cl.visitor_id
             )
             and not exists (
               select 1 from chatted ch where ch.visitor_id = cl.visitor_id
             ))::int                            as clicked_only
      `,
      // Entry referrer per session, reduced to a bare host.
      //
      // split_part rather than regexp_replace on purpose: a backreference like
      // \1 inside a tagged template literal is an invalid escape, which leaves
      // the *cooked* string undefined for that chunk — the Neon driver reads
      // the cooked strings, so the query would silently arrive mangled.
      //
      // utm_source WINS over the referrer host when present. The channels worth
      // telling apart on a portfolio — a DM, an emailed link, a PDF resume —
      // all arrive with no referrer at all, so grouping on the referrer alone
      // collapsed every one of them into a single "Direct / none" bar. A tag is
      // the only thing that can separate them, and when the owner has gone to
      // the trouble of setting one it is strictly better evidence than the
      // header. `tagged` lets the UI mark which bars came from which.
      db`
        select
          coalesce(
            nullif(utm_source, ''),
            case
              when referrer is null or referrer = '' then ''
              when lower(split_part(split_part(split_part(referrer, '://', 2), '/', 1), '?', 1)) like 'www.%'
                then substr(lower(split_part(split_part(split_part(referrer, '://', 2), '/', 1), '?', 1)), 5)
              else lower(split_part(split_part(split_part(referrer, '://', 2), '/', 1), '?', 1))
            end
          )                                          as host,
          bool_or(utm_source is not null and utm_source <> '') as tagged,
          count(*)::int                              as sessions
        from visitor_sessions
        where started_at >= now() - make_interval(days => ${WINDOW_DAYS})
        group by 1
        order by sessions desc, host
        limit ${SOURCE_LIMIT}
      `,
      // Outbound clicks, grouped by where they went rather than by the link
      // text. Several links can point at one destination (a project appears in
      // the work grid and again in the resume), and "how many people opened the
      // GitHub repo" is the question worth answering; the label is carried
      // along as the friendliest name seen for that destination.
      db`
        select
          coalesce(nullif(metadata->>'host', ''), '?')  as host,
          min(nullif(metadata->>'label', ''))           as label,
          count(*)::int                                 as clicks,
          count(distinct visitor_id)::int               as visitors
        from visitor_events
        where type = 'outbound_click'
          and created_at >= now() - make_interval(days => ${WINDOW_DAYS})
        group by 1
        order by clicks desc, host
        limit ${CLICK_LIMIT}
      `,
      // Tags visitors narrowed the work grid or the notes list to. One row per
      // (section, tag): the two indexes share a tag vocabulary, so summing them
      // would answer a question nobody asked and hide which index the interest
      // was in.
      //
      // The lateral unnest is guarded on jsonb_typeof because metadata is a
      // client-supplied blob on a public endpoint — anything that is not an
      // array contributes no rows rather than erroring the whole transaction and
      // blanking every panel on the dashboard. An event carrying an empty tag
      // list (a sort-only change) drops out here for the same reason, which is
      // correct: it names no tag to rank.
      db`
        select
          coalesce(nullif(metadata->>'section', ''), '?') as section,
          tag,
          count(*)::int                                   as uses,
          count(distinct visitor_id)::int                 as visitors
        from visitor_events
        cross join lateral jsonb_array_elements_text(
          case when jsonb_typeof(metadata->'tags') = 'array'
            then metadata->'tags'
            else '[]'::jsonb
          end
        ) as tag
        where type = 'filter_apply'
          and created_at >= now() - make_interval(days => ${WINDOW_DAYS})
        group by 1, 2
        order by uses desc, tag
        limit ${FILTER_LIMIT}
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
      // New visitors per day, for the chart in the metrics row. Formerly its own
      // endpoint; it joined this transaction because the dashboard has only ever
      // fetched the two together, so a separate function was a second invocation
      // and a second round trip for nothing.
      //
      // generate_series drives the join so every day in the window gets a row
      // even when nobody arrived — a sparse result would make a quiet Tuesday
      // indistinguishable from a missing one, and the chart draws a bar per day.
      db`
        select
          gs::date        as date,
          count(v.id)::int as visitors
        from generate_series(
          current_date - make_interval(days => ${WINDOW_DAYS - 1}),
          current_date,
          interval '1 day'
        ) as gs
        left join visitors v on v.first_seen_at::date = gs::date
        group by gs
        order by gs
      `,
    ])) as [
      Record<string, unknown>[],
      Record<string, unknown>[],
      Record<string, unknown>[],
      Record<string, unknown>[],
      Record<string, unknown>[],
      Record<string, unknown>[],
      Record<string, unknown>[],
      Record<string, unknown>[],
    ]

    const s = sessionRows[0] ?? {}
    const a = actionRows[0] ?? {}

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
        total: num(a.visitors),
        acted: num(a.acted),
        clicked: num(a.clicked),
        chatted: num(a.chatted),
        contacted: num(a.contacted),
        chattedOnly: num(a.chatted_only),
        clickedOnly: num(a.clicked_only),
      },
      sources: sourceRows.map(row => ({
        host: typeof row.host === 'string' ? row.host : '',
        tagged: row.tagged === true,
        sessions: num(row.sessions),
      })),
      clicks: clickRows.map(row => ({
        host: typeof row.host === 'string' ? row.host : '?',
        label: typeof row.label === 'string' && row.label !== '' ? row.label : null,
        clicks: num(row.clicks),
        visitors: num(row.visitors),
      })),
      filters: filterRows.map(row => ({
        section: typeof row.section === 'string' ? row.section : '?',
        tag: typeof row.tag === 'string' ? row.tag : '',
        uses: num(row.uses),
        visitors: num(row.visitors),
      })),
      paths: pathRows.map(row => ({
        path: typeof row.path === 'string' ? row.path : '/',
        views: num(row.views),
        visitors: num(row.visitors),
      })),
      hourly: Array.from({ length: 24 }, (_, hour) => ({ hour, views: byHour.get(hour) ?? 0 })),
      days: dayRows.map(row => ({ date: ymd(row.date), visitors: num(row.visitors) })),
    }

    res.status(200).json(payload)
  } catch (err) {
    console.error('Admin insights error:', err)
    res.status(500).json({ error: 'Failed to load insights' })
  }
}
