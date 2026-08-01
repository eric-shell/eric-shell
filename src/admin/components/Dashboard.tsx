import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  type LucideIcon, LogOut, MailCheck, MessageSquare, MousePointer2,
  RefreshCw, Users,
} from 'lucide-react'
import { Button, Container, Eyebrow, H2, Panel } from '../../components/ui'
import VisitorsChart from './VisitorsChart'
import InsightsPanel from './InsightsPanel'
import VisitorsPanel from './VisitorsPanel'
import { MetricsRowSkeleton, Skeleton } from './Skeleton'
import { apiCall } from '../lib/api'
import { formatDuration } from '../lib/dateFormat'
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
 */
function StatCard({ label, value, sub, icon: Icon, tone = 'neutral' }: {
  label: string
  value: number | string
  sub: string
  icon?: LucideIcon
  tone?: 'neutral' | 'positive'
}) {
  const positive = tone === 'positive' && value !== 0
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

  async function logout() {
    try { await fetch('/api/admin/logout', { method: 'POST' }) } catch { /* ignore */ }
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
  const hasEngaged = (v: VisitorSummary) => v.chat_message_count > 0 || v.contact_count > 0

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

  const totalVisitors = baseVisitors?.length ?? 0
  const engaged = baseVisitors?.filter(v => v.chat_message_count > 0).length ?? 0
  const converted = baseVisitors?.filter(v => v.contact_count > 0).length ?? 0
  const totalViews = baseVisitors?.reduce((s, v) => s + v.page_view_count, 0) ?? 0
  const totalEngagedMs = baseVisitors?.reduce((s, v) => s + v.total_engaged_ms, 0) ?? 0

  return (
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
            <StatCard label="Visitors" value={totalVisitors} sub="total" icon={Users} />
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
            />
            {/* The only tile that earns semantic color — a contact submission is
                the one event on this dashboard that actually means something. */}
            <StatCard
              label="Converted"
              value={converted}
              sub={`submitted · ${pct(converted, totalVisitors)}%`}
              icon={MailCheck}
              tone="positive"
            />
            <Panel variant="raised-dark" className="col-span-2 min-h-[116px] rounded-2xl p-4 md:col-span-4 xl:col-span-1 xl:flex-1">
              {stats
                ? <VisitorsChart days={stats} />
                : <Skeleton className="h-full w-full min-h-[48px]" />}
            </Panel>
          </>
        )}
      </div>

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
  )
}
