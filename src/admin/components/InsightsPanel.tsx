import { Eyebrow, Panel } from '../../components/ui'
import BarList from './BarList'
import { ChartFrame } from './ChartFrame'
import HourlyActivity from './HourlyActivity'
import RadialGauge from './RadialGauge'
import ScrollDepthFunnel from './ScrollDepthFunnel'
import ViewportMix from './ViewportMix'
import { Skeleton } from './Skeleton'
import { formatHour, labelSource, localHourOffset } from '../lib/chartTheme'
import type { InsightsPayload } from '@/../api/_lib/insights-types'

/**
 * The insight grid: six single-series charts over one server-side aggregate.
 *
 * It is fed by props from the dashboard's existing poll — it deliberately owns
 * no fetch and no interval of its own. Neon bills compute-hours, so a second
 * polling loop for a second panel is the exact cost mistake the CRM already
 * corrected once.
 */

function InsightsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Panel key={i} variant="raised-dark" className="flex animate-pulse flex-col gap-3 rounded-2xl p-4">
          <Skeleton className="h-2 w-24" />
          <Skeleton className="h-24 w-full" />
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
          {data ? `Last ${data.windowDays} days` : 'Last 30 days'} · all recorded traffic —
          the table filters below do not apply here
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {/* A single ratio against its own track — the one form the owner
              specifically wanted, and the one the palette can carry without a
              categorical hue in sight. */}
          <ChartFrame title="Return rate" meta={`${data.windowDays}d`}>
            <RadialGauge
              value={data.visitors.returning}
              total={data.visitors.total}
              unit="visitors came back on another day"
              caption="Visitors with sessions on two or more separate days — the strongest interest signal here."
            />
          </ChartFrame>

          {/* The meta counts the sessions actually charted, not every session in
              the window — pre-fix rows are excluded (see ScrollDepthFunnel), and
              a header promising more rows than the bars represent would be the
              dishonest half of that. */}
          <ChartFrame
            title="Scroll depth"
            meta={`${data.sessions.scroll.measured} ${data.sessions.scroll.measured === 1 ? 'session' : 'sessions'}`}
          >
            <ScrollDepthFunnel scroll={data.sessions.scroll} />
          </ChartFrame>

          <ChartFrame
            title="Views by hour"
            meta={peakHour && peakHour.views > 0
              ? `peak ${formatHour(peakHour.displayHour)}`
              : undefined}
          >
            <HourlyActivity hourly={data.hourly} />
          </ChartFrame>

          <ChartFrame title="Top sources" meta="sessions">
            <BarList
              unit="sessions"
              empty="No sessions recorded a referrer in this window."
              items={data.sources.map(s => ({ label: labelSource(s.host), value: s.sessions }))}
            />
          </ChartFrame>

          <ChartFrame title="Top pages" meta="views">
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

          <ChartFrame
            title="Viewport width"
            meta={`${data.sessions.viewport.known} ${data.sessions.viewport.known === 1 ? 'session' : 'sessions'}`}
          >
            <ViewportMix viewport={data.sessions.viewport} />
          </ChartFrame>
        </div>
      )}
    </section>
  )
}
