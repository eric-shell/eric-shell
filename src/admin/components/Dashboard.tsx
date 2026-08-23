import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  type LucideIcon, LogOut, MailCheck, MessageSquare, MousePointer2,
  RefreshCw, Users,
} from 'lucide-react'
import { Button, Container, Eyebrow, H2, Panel } from '../../components/ui'
import Footer from '../../components/layout/Footer/Footer'
import VisitorsChart from './VisitorsChart'
import InsightsPanel from './InsightsPanel'
import VisitorsPanel from './VisitorsPanel'
import { MetricsRowSkeleton, Skeleton } from './Skeleton'
import { apiCall } from '../lib/api'
import { formatDuration } from '../lib/dateFormat'
import { glowFor, magnitudeStep } from '../lib/chartTheme'
import { detectProxyBursts, isAutomated } from '../lib/classify'
import { isNewSince, useLastVisit } from '../lib/lastVisit'
import { DEFAULT_TIMEFRAME, isTimeframe, withinTimeframe, type Timeframe } from '../lib/timeframe'
import type { StatDay, VisitorListPayload, VisitorSummary } from '@/../api/_lib/types'
import type { InsightsPayload } from '@/../api/_lib/insights-types'

/**
 * Stat tile. Label stays uppercase micro-type to match the site's `Eyebrow`
 * idiom (a deliberate departure from the dataviz sentence-case default — the
 * design system supplies casing).
 *
 * `tone` marks a genuine signal, never decoration: `positive` is only for a
 * conversion. Semantic color always ships with an icon so it is never
 * color-alone. green-400 is 7.04:1 on the blue-950 canvas — AA text.
 *
 * `meter` turns a tile whose sub-line is already a ratio into something
 * glanceable: the same single-proportion-against-its-own-track form the Action
 * rate gauge uses, at tile scale. Only pass it where the number above it IS
 * that ratio's numerator — it is drawn from the same array in the same render,
 * which is what keeps the bar and the percentage from ever disagreeing.
 *
 * The meter is blue even on the `positive` tile. Marks and semantics are two
 * different systems here: every data mark in the admin is a step of the accent
 * ramp, and green is reserved for the one callout that means something. Giving
 * the meter the tone would have merged them.
 */
function StatCard({ label, value, sub, icon: Icon, tone = 'neutral', meter }: {
  label: string
  value: number | string
  sub: string
  icon?: LucideIcon
  tone?: 'neutral' | 'positive'
  /** `[part, whole]` for the ratio bar. Omit on tiles that aren't ratios. */
  meter?: [number, number]
}) {
  const positive = tone === 'positive' && value !== 0
  const fill = meter ? magnitudeStep(meter[0], meter[1]) : null
  return (
    <Panel
      variant="raised-dark"
      className="group relative flex min-w-[120px] flex-col justify-between overflow-hidden rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-1.5">
        {Icon && (
          <Icon
            size={11}
            strokeWidth={2.5}
            className={positive ? 'text-green-400' : 'text-white/75'}
            aria-hidden="true"
          />
        )}
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/65">{label}</p>
      </div>
      {/* Proportional figures, not tabular: tabular-nums makes a value like 121
          look loose at display size. Sans, never the display face. */}
      <p className="mt-1.5 font-sans text-[26px] font-semibold leading-none text-white">{value}</p>
      {meter && fill && (
        // Track spans the tile, so a short bar reads as a small share rather
        // than just a small bar. Same 3px floor the rank lists use: a 1-in-40
        // rate must still draw something.
        <div className="mt-2 h-1 w-full rounded-full bg-white/10" aria-hidden="true">
          <div
            className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
            style={{
              width: `${pct(meter[0], meter[1])}%`,
              minWidth: meter[0] > 0 ? 3 : 0,
              background: fill,
              filter: meter[0] > 0 ? glowFor(fill, 4) : undefined,
            }}
          />
        </div>
      )}
      <p className={`mt-1 text-xs ${positive ? 'font-medium text-green-400' : 'text-white/85'}`}>{sub}</p>
    </Panel>
  )
}

const HIDE_BOTS_KEY = 'eric.sh:crm:hide-bots'
const ENGAGED_ONLY_KEY = 'eric.sh:crm:engaged-only'
const TIMEFRAME_KEY = 'eric.sh:crm:timeframe'

// 60s was pure habit. The visitor list is not a live feed — two minutes is
// indistinguishable in use and halves the query volume of an open tab.
const POLL_MS = 120_000

interface DashboardProps {
  onLogout: () => void
}

/**
 * Did this visitor reach out at all? Module scope, not a closure: three places
 * read it, including a `useMemo`, and a per-render arrow would either sit
 * missing from a dep list or invalidate the memo on every render.
 */
const hasEngaged = (v: VisitorSummary) => v.chat_message_count > 0 || v.contact_count > 0

function pct(n: number, total: number) {
  if (!total) return 0
  return Math.round((n / total) * 100)
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [visitors, setVisitors] = useState<VisitorSummary[] | null>(null)
  const [stats, setStats] = useState<StatDay[] | null>(null)
  const [insights, setInsights] = useState<InsightsPayload | null>(null)
  const [loading, setLoading] = useState(false)
  // Persisted: if you want crawler noise out of the way, you want it out of the
  // way tomorrow too. Defaults to off so nothing is hidden until asked, and the
  // toolbar always reports the count so it can never hide rows silently.
  const [hideBots, setHideBots] = useState(() => {
    try { return window.localStorage.getItem(HIDE_BOTS_KEY) === '1' } catch { return false }
  })

  // Narrows to visitors who actually did something — chatted or submitted the
  // form. The most common question this dashboard gets asked.
  const [engagedOnly, setEngagedOnly] = useState(() => {
    try { return window.localStorage.getItem(ENGAGED_ONLY_KEY) === '1' } catch { return false }
  })

  // The window everything on this page describes. Defaults to `all` so a fresh
  // session is never quietly hiding history, and is persisted alongside the
  // chips because a chosen window is a working preference, not a one-off.
  const [timeframe, setTimeframe] = useState<Timeframe>(() => {
    try {
      const saved = window.localStorage.getItem(TIMEFRAME_KEY)
      return isTimeframe(saved) ? saved : DEFAULT_TIMEFRAME
    } catch { return DEFAULT_TIMEFRAME }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(HIDE_BOTS_KEY, hideBots ? '1' : '0')
      window.localStorage.setItem(ENGAGED_ONLY_KEY, engagedOnly ? '1' : '0')
      window.localStorage.setItem(TIMEFRAME_KEY, timeframe)
    } catch { /* private mode */ }
  }, [hideBots, engagedOnly, timeframe])
  const [lastLoaded, setLastLoaded] = useState<Date | null>(null)

  // Frozen for the session and re-stamped on the way out — see `useLastVisit`.
  // Distinct from `lastLoaded`, which is about this tab's poll: this one is
  // about the last time you were here at all.
  const newSince = useLastVisit()

  // One fetch pass for the whole dashboard, now two requests rather than three.
  //
  // The insights aggregate joins this Promise.all rather than owning a poll of
  // its own: Neon bills compute-hours, and a second interval would double the
  // query volume of an open tab for a panel that is read at exactly the same
  // moments as everything else here.
  //
  // The visitors-per-day series used to be a third call to `/api/admin/stats`.
  // It was only ever read alongside the insights — same poll, same render — so
  // a separate endpoint bought a second invocation and a second Neon round trip
  // for nothing. It is now one more statement inside the insights transaction.
  const fetchData = useCallback(() => {
    return Promise.all([
      apiCall<VisitorListPayload>('/api/admin/visitors', undefined, {
        errorMessage: 'Failed to load visitors.',
        onUnauthorized: onLogout,
      }),
      apiCall<InsightsPayload>('/api/admin/insights'),
    ]).then(([v, i]) => {
      if (v) setVisitors(v.visitors ?? [])
      if (i) {
        setInsights(i)
        setStats(i.days)
      }
      setLoading(false)
      setLastLoaded(new Date())
    })
  }, [onLogout])

  const load = useCallback(() => {
    setLoading(true)
    return fetchData()
  }, [fetchData])

  useEffect(() => { fetchData() }, [fetchData])

  // Poll only while the tab is actually visible.
  //
  // Neon bills compute-hours and autosuspends an idle endpoint. A dashboard tab
  // left open in the background used to fire two aggregate queries every 60s
  // forever, which pinned the compute awake around the clock — by far the
  // largest recurring cost in this stack, and for data nobody was looking at.
  // Refetch once on becoming visible so it still feels live.
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined

    const start = () => {
      if (id !== undefined) return
      id = setInterval(load, POLL_MS)
    }
    const stop = () => {
      if (id === undefined) return
      clearInterval(id)
      id = undefined
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        load()
        start()
      } else {
        stop()
      }
    }

    if (document.visibilityState === 'visible') start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [load])

  // DELETE on the session resource, which is also what the route guard GETs.
  // Failure is swallowed on purpose: the local sign-out must happen either way,
  // or a network blip would leave you looking at a dashboard you asked to leave.
  async function logout() {
    try { await fetch('/api/admin/session', { method: 'DELETE' }) } catch { /* ignore */ }
    onLogout()
  }

  const handleVisitorDeleted = useCallback((deletedId: string) => {
    setVisitors(prev => prev?.filter(v => v.id !== deletedId) ?? null)
  }, [])

  // Two different kinds of narrowing, applied at different levels on purpose.
  //
  // Timeframe and the bot filter are statements about which data counts, so
  // they define the working set — the metric tiles read from it too. Otherwise
  // the header would claim 28 visitors while the table showed 25, and the
  // conversion percentages would stay diluted by crawler traffic, which is the
  // whole reason to hide it.
  //
  // Search is a lookup, not a statement about the data, so it narrows only the
  // table. Typing a name shouldn't rewrite the totals above it.
  //
  // Timeframe goes first, so every count below it — including the chip labels —
  // describes the window on screen rather than all of history. Note the per-
  // visitor totals (page views, engaged time) are lifetime figures on rows that
  // fall in the window, not a re-aggregate of the window itself; the row data
  // isn't broken out by day.

  // Computed over the FULL list, before the timeframe narrows it. A burst is a
  // fact about the traffic, not about the window you happen to be looking
  // through — scoping it to the last 24h would dissolve a cluster that straddles
  // midnight and quietly relabel half of it as ordinary.
  const bursts = useMemo(() => detectProxyBursts(visitors ?? []), [visitors])

  const inWindow = visitors && withinTimeframe(visitors, timeframe)
  const botCount = inWindow?.filter(v => isAutomated(v, bursts)).length ?? 0
  // Counted after the bot filter, so the label doesn't promise to hide rows
  // that are already gone.
  const afterBots = hideBots && inWindow ? inWindow.filter(v => !isAutomated(v, bursts)) : inWindow
  const quietCount = afterBots?.filter(v => !hasEngaged(v)).length ?? 0
  const baseVisitors = engagedOnly && afterBots ? afterBots.filter(hasEngaged) : afterBots

  // Counted over the rows actually on screen, so the readout can never promise
  // dots the filters have taken away.
  const newCount = baseVisitors?.filter(v => isNewSince(v, newSince)).length ?? 0

  /**
   * The tiles read the UNFILTERED list, and nothing in the Visitors section
   * reaches them.
   *
   * They used to share `baseVisitors` with the table, on the reasoning that
   * timeframe and the bot filter are statements about which data counts, so the
   * header should agree with the rows beneath it. In use that is not how it
   * reads: the tiles sit above the Insights panel, a long way from the controls
   * that were moving them, and toggling a chip at the bottom of the page
   * silently rewrote the summary at the top.
   *
   * The page now carries three scopes and each says which it is: these totals
   * are everything ever recorded, Insights is a fixed 30 day server aggregate,
   * and the table is whatever the controls above it are set to.
   */
  const totalVisitors = visitors?.length ?? 0
  const engaged = visitors?.filter(v => v.chat_message_count > 0).length ?? 0
  const converted = visitors?.filter(v => v.contact_count > 0).length ?? 0
  const totalViews = visitors?.reduce((s, v) => s + v.page_view_count, 0) ?? 0
  const totalEngagedMs = visitors?.reduce((s, v) => s + v.total_engaged_ms, 0) ?? 0


  return (
    <>
    <Container className="flex flex-col gap-4 px-4 py-6 sm:gap-6 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Eyebrow className="text-white/85">eric.sh CRM</Eyebrow>
          <H2 className="text-white">Admin</H2>
        </div>
        <div className="flex items-center gap-2">
          {lastLoaded && (
            <span className="flex items-center gap-1.5 pr-1 text-xs text-white/90">
              {/* Quietly signals the auto-refresh is alive. */}
              <span className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-accent animate-pulse' : 'bg-green-400/70'}`} />
              {lastLoaded.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {/* Icons go through leftIcon, not children — that is what renders the
              full-height tinted slab and applies `icon-optical` sizing. Passing
              them as children silently opts out of both, which is why these
              looked like plain inline icons. No `size` needed: the CSS variable
              beats lucide's width/height attributes. */}
          <Button
            variant="primary" size="sm" onClick={load} disabled={loading}
            leftIcon={<RefreshCw className={loading ? 'animate-spin' : ''} aria-hidden="true" />}
          >
            Refresh
          </Button>
          <Button variant="raised-dark" size="sm" onClick={logout} leftIcon={<LogOut aria-hidden="true" />}>
            Sign out
          </Button>
        </div>
      </header>

      {/* Says which data these describe, in the same shape Insights and Visitors
          use for the same job. It matters more here than on either of them: the
          controls that look like they should narrow these numbers are a long
          way down the page, and without a label the only way to learn that they
          do not is to toggle one and watch nothing happen. */}
      <section aria-labelledby="totals-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="totals-heading">
            <Eyebrow className="text-xs text-white/85">Totals</Eyebrow>
          </h2>
          <p className="text-[11px] text-white/60">
            All recorded visitors · the filters below do not narrow these
          </p>
        </div>

      {/* Metrics row. On a phone the five tiles cannot sit on one line — they
          forced the document wider than the viewport, so the browser zoomed the
          whole page out to fit.
          Two-up on a phone, four-up once there is room, and the chart only
          joins the row at `xl`. `lg` is nearer 1100px numerically, but it puts
          the plot at ~446px — narrower than the ~522px that prompted this — so
          it would not have fixed anything. At `xl` the inline plot is ~702px,
          and every width below that gets the full-width stacked version, which
          is always wider than the inline one would have been.
          Min-height applies once it is a row; in the grid each cell sizes to
          its own content. */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:flex xl:items-stretch xl:min-h-[116px]">
        {visitors === null ? (
          <MetricsRowSkeleton />
        ) : (
          <>
            {/* No meter on the first two: neither number is a part of a whole
                that is on this page. "Visitors" is the whole, and page views
                have no denominator at all — a bar under either would need a
                maximum invented to draw it against. */}
            <StatCard
              label="Visitors" value={totalVisitors} sub="total" icon={Users}
            />
            <StatCard
              label="Page views"
              value={totalViews}
              sub={totalEngagedMs > 0 ? `${formatDuration(totalEngagedMs)} on site` : 'across all visitors'}
              icon={MousePointer2}
            />
            <StatCard
              label="Engaged"
              value={engaged}
              sub={`chatted · ${pct(engaged, totalVisitors)}%`}
              icon={MessageSquare}
              meter={[engaged, totalVisitors]}
            />
            {/* The only tile that earns semantic color — a contact submission is
                the one event on this dashboard that actually means something. */}
            <StatCard
              label="Converted"
              value={converted}
              sub={`submitted · ${pct(converted, totalVisitors)}%`}
              icon={MailCheck}
              tone="positive"
              meter={[converted, totalVisitors]}
            />
            <Panel variant="raised-dark" className="col-span-2 min-h-[116px] rounded-2xl p-4 md:col-span-4 xl:col-span-1 xl:flex-1">
              {stats
                ? <VisitorsChart days={stats} />
                : <Skeleton className="h-full w-full min-h-[48px]" />}
            </Panel>
          </>
        )}
        </div>
      </section>

      {/* Aggregates that answer questions the visitor table can't: who came
          back, how far they read, where they arrived from, and when. Fed by the
          same poll — see fetchData. */}
      <InsightsPanel data={insights} />

      {/* The per-row view. It receives rows already narrowed by the filters
          below, because those define the working set the metric tiles read from
          too — so the chips live down there but their state lives up here. */}
      <VisitorsPanel
        visitors={baseVisitors}
        // The in-window count, not the all-time one: the "N of M" readout beside
        // the search field would otherwise measure results against rows the
        // timeframe has already excluded.
        totalCount={inWindow?.length ?? 0}
        bursts={bursts}
        newSince={newSince}
        newCount={newCount}
        loading={loading}
        hasAnyVisitors={visitors !== null && visitors.length > 0}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        hideBots={hideBots}
        botCount={botCount}
        onToggleBots={() => setHideBots(h => !h)}
        engagedOnly={engagedOnly}
        quietCount={quietCount}
        onToggleEngaged={() => setEngagedOnly(e => !e)}
        onVisitorDeleted={handleVisitorDeleted}
      />
    </Container>

      {/* The public site's footer, imported rather than restated. It is already
          the site's dark-section vocabulary, which is the same vocabulary this
          page is built from, and its nav is the fastest way back out to the
          live site from an admin screen.

          Outside the Container on purpose: the footer is full bleed and carries
          a Container of its own, so nesting it would indent it by two gutters
          and misalign it with every other edge on the page. */}
      <Footer />
    </>
  )
}
