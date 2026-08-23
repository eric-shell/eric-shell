import { Eyebrow, Panel } from '../../components/ui'
import BarList from './BarList'
import { ChartFrame } from './ChartFrame'
import HourlyActivity from './HourlyActivity'
import VisitorActions from './VisitorActions'
import ScrollDepthFunnel from './ScrollDepthFunnel'
import ViewportMix from './ViewportMix'
import { InsightCardSkeleton, type InsightShape } from './Skeleton'
import { formatHour, labelSource, localHourOffset } from '../lib/chartTheme'
import type { InsightsPayload } from '@/../api/_lib/insights-types'

/**
 * The insight grid: eight single-series charts over one server-side aggregate.
 *
 * It is fed by props from the dashboard's existing poll — it deliberately owns
 * no fetch and no interval of its own. Neon bills compute-hours, so a second
 * polling loop for a second panel is the exact cost mistake the CRM already
 * corrected once.
 */

/**
 * The column spans, in DOM order, shared by the skeleton and the real grid so
 * the loaded panel lands exactly where the placeholder was. See GRID below.
 */
const SPANS = [
  'xl:col-span-2',
  'xl:col-span-2',
  'xl:col-span-2',
  'xl:col-span-2',
  'xl:col-span-2',
  'xl:col-span-2',
  'sm:col-span-2 xl:col-span-2',
  'sm:col-span-2 xl:col-span-4',
]

/**
 * What each card in `SPANS` order actually draws, so the skeleton reserves the
 * right shape rather than one generic block for all eight. Kept beside the
 * spans because the two are read together and must be reordered together —
 * a card moved in the grid without moving here gets the wrong placeholder, and
 * the panel jumps by whatever the two shapes differ by.
 *
 * Action rate, Scroll depth and Viewport are rings; the four rank lists are
 * bars; Views by hour is the strip.
 */
const SHAPES: InsightShape[] = [
  'ring', 'ring', 'ring',
  'bars', 'bars', 'bars', 'bars',
  'hours',
]

/**
 * Three ratio cards, then three rank lists, then a fourth rank list beside the
 * hour-of-day band. Six columns rather than three so the band can span cleanly;
 * the six cards above it are thirds either way, and six of them divides evenly
 * into the two-column layout with no hole to fill.
 *
 * The band gives up two of its six columns to the filter list rather than
 * dropping to a third of a row like the other rank lists: it is the one chart
 * here with a continuous axis, and 24 buckets across a third of a row gave each
 * column ~10px, below the width where an hour-of-day shape is legible. Two
 * thirds keeps it readable. Both cards take the full width at `sm`, where one
 * of them alongside a half-width neighbour would leave a hole in the grid.
 */
const GRID = 'grid gap-3 sm:grid-cols-2 xl:grid-cols-6'

function InsightsSkeleton() {
  return (
    <div className={GRID}>
      {SPANS.map((span, i) => (
        <Panel
          key={i}
          variant="raised-dark"
          // `min-w-0` for the same reason ChartFrame carries it — the
          // placeholder must sit on exactly the track the real card will.
          // `p-4` and the rounding are ChartFrame's too; the gap now lives on
          // the inner figure, matching the real one.
          className={`flex min-w-0 animate-pulse flex-col rounded-2xl p-4 ${span}`}
        >
          <InsightCardSkeleton shape={SHAPES[i]} />
        </Panel>
      ))}
    </div>
  )
}

export default function InsightsPanel({ data }: { data: InsightsPayload | null }) {
  const offset = localHourOffset()

  const peakHour = data
    ? data.hourly.reduce(
        (best, row) => {
          const displayHour = ((row.hour + (offset ?? 0)) % 24 + 24) % 24
          return row.views > best.views ? { displayHour, views: row.views } : best
        },
        { displayHour: 0, views: 0 },
      )
    : null

  const hasAnything =
    !!data && (data.sessions.total > 0 || data.visitors.total > 0 || data.paths.length > 0)

  return (
    <section aria-labelledby="insights-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="insights-heading">
          <Eyebrow className="text-xs text-white/85">Insights</Eyebrow>
        </h2>
        {/* Says out loud that these numbers are scoped differently from the
            table below. The filter chips classify individual rows from a user
            agent in the browser; this is a SQL aggregate and cannot see them, so
            claiming otherwise would be the dishonest option. */}
        <p className="text-[11px] text-white/60">
          {data ? `Last ${data.windowDays} days` : 'Last 30 days'} · all recorded traffic
        </p>
      </div>

      {data === null ? (
        <InsightsSkeleton />
      ) : !hasAnything ? (
        <Panel variant="raised-dark" className="rounded-2xl p-6">
          <p className="text-sm text-white/85">No telemetry recorded in the last {data.windowDays} days.</p>
          <p className="mt-1 text-xs text-white/60">
            Page views, scroll depth, and sessions appear here once visitors arrive. Visitors sending
            Global Privacy Control or Do Not Track are never recorded, by design.
          </p>
        </Panel>
      ) : (
        <div className={GRID}>
          {/* Row one — the three session-quality ratios, all the same form
              family, so a third of the row each is the right size for them. */}

          {/* Every visitor sorted into one rung of an intent ladder, rather
              than the bare `acted / total` gauge this used to be.

              It measures ACTING rather than returning — a portfolio is mostly a
              one-visit destination reached from an application or a resume
              link, so a return rate here is structurally near zero and says
              more about the format than about the site. The `Returning` tag on
              the visitor table still carries that question, at the row level
              where a two-in-thirty-eight signal is actually readable.

              What changed is the resolution. The three actions overlap, so as
              a breakdown under a single ratio they could only ever be text; as
              an exclusive ladder they are the chart, and on this much traffic
              the shape of engagement is far more legible than one percentage
              standing on a handful of people. The headline rate keeps the
              centre of the ring. */}
          <ChartFrame
            title="What visitors did"
            meta={`${data.windowDays} ${data.windowDays === 1 ? 'day' : 'days'}`}
            className={SPANS[0]}
          >
            <VisitorActions actions={data.visitors} />
          </ChartFrame>

          {/* The meta counts the sessions actually charted, not every session in
              the window — rows without trustworthy scroll depth are dropped
              server-side (see ScrollDepthFunnel), and a header promising more
              rows than the bars represent would be the dishonest half of that. */}
          <ChartFrame
            title="Scroll depth"
            meta={`${data.sessions.scroll.measured} ${data.sessions.scroll.measured === 1 ? 'session' : 'sessions'}`}
            className={SPANS[1]}
          >
            <ScrollDepthFunnel scroll={data.sessions.scroll} />
          </ChartFrame>

          <ChartFrame
            title="Viewport width"
            meta={`${data.sessions.viewport.known} ${data.sessions.viewport.known === 1 ? 'session' : 'sessions'}`}
            className={SPANS[2]}
          >
            <ViewportMix viewport={data.sessions.viewport} />
          </ChartFrame>

          {/* Row two — the three rank lists. */}

          {/* Rows here are a mix: a campaign name the owner chose where the
              entry link carried one, a browser-reported referrer host
              otherwise. That is the right answer to "where did visits come
              from", but the two are not the same kind of evidence, so `tagged`
              marks which is which in the row tooltip and the screen-reader
              list. (BarList shows `detail` in neither place visually — it keeps
              the row to label/bar/value on purpose.) */}
          <ChartFrame title="Top sources" meta="sessions" className={SPANS[3]}>
            <BarList
              unit="sessions"
              empty="No sessions recorded a referrer in this window."
              items={data.sources.map(s => ({
                label: labelSource(s.host),
                value: s.sessions,
                detail: s.tagged ? 'tagged' : undefined,
              }))}
            />
          </ChartFrame>

          <ChartFrame title="Top pages" meta="views" className={SPANS[4]}>
            <BarList
              unit="views"
              empty="No page views in this window."
              items={data.paths.map(p => ({
                label: p.path,
                value: p.views,
                detail: `${p.visitors} ${p.visitors === 1 ? 'visitor' : 'visitors'}`,
              }))}
            />
          </ChartFrame>

          {/* The one chart that measures intent rather than traffic: a click
              that leaves for a project, a repo, or the mail client is a visitor
              acting on the work, which no page view can tell you. */}
          <ChartFrame title="Clicks out" meta="clicks" className={SPANS[5]}>
            <BarList
              unit="clicks"
              empty="No outbound clicks recorded in this window."
              items={data.clicks.map(c => ({
                label: c.label ?? c.host,
                value: c.clicks,
                detail: `${c.visitors} ${c.visitors === 1 ? 'visitor' : 'visitors'}`,
              }))}
            />
          </ChartFrame>

          {/* Row three. Neither index puts its filter state in the URL, so this
              is the only place the interest behind a visit shows up at all — a
              page view of /notes reads the same whether the list was taken whole
              or narrowed to two tags.

              Labelled by section because the work grid and the notes list share
              a tag vocabulary: two bars reading "react" with no way to tell them
              apart would look like a duplicate rather than two answers. */}
          <ChartFrame title="Top filters" meta="selections" className={SPANS[6]}>
            <BarList
              unit="selections"
              empty="No tag filters applied in this window."
              items={data.filters.map(f => ({
                label: `${f.section} · ${f.tag}`,
                value: f.uses,
                detail: `${f.visitors} ${f.visitors === 1 ? 'visitor' : 'visitors'}`,
              }))}
            />
          </ChartFrame>

          {/* The only chart here with a continuous axis: 24 buckets in a third
              of a row gave each column ~10px, which is below the width where an
              hour-of-day shape is readable at all. */}
          <ChartFrame
            title="Views by hour"
            meta={peakHour && peakHour.views > 0
              ? `peak ${formatHour(peakHour.displayHour)}`
              : undefined}
            className={SPANS[7]}
          >
            <HourlyActivity hourly={data.hourly} />
          </ChartFrame>
        </div>
      )}
    </section>
  )
}
