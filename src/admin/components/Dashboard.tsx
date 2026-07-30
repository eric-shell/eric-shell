import { useCallback, useEffect, useState } from 'react'
import {
  type LucideIcon, LogOut, MailCheck, MessageSquare, MousePointer2,
  Bot, EyeOff, RefreshCw, Search, Users, X,
} from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { Button, Container, Eyebrow, H2, Panel } from '../../components/ui'
import VisitorList from './VisitorList'
import VisitorsChart from './VisitorsChart'
import { MetricsRowSkeleton, Skeleton, VisitorTableSkeleton } from './Skeleton'
import { apiCall } from '../lib/api'
import { formatDuration } from '../lib/dateFormat'
import { resolveLocation } from '../lib/location'
import { isAutomated } from '../lib/classify'
import type { StatDay, StatsPayload, VisitorListPayload, VisitorSummary } from '@/../api/_lib/types'

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

/**
 * Toolbar filter toggle. `aria-pressed` rather than a checkbox: it is a control
 * that changes the view, not a value being submitted.
 */
function FilterChip({ active, onClick, icon: Icon, title, children }: {
  active: boolean
  onClick: () => void
  icon: LucideIcon
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className={twMerge(
        'flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-semibold ring-1 ring-inset transition-colors',
        active
          ? 'bg-accent/15 text-white ring-accent/40'
          : 'text-white/85 ring-white/15 hover:bg-white/[0.06] hover:text-white',
      )}
    >
      <Icon size={13} aria-hidden="true" />
      {children}
    </button>
  )
}

// 60s was pure habit. The visitor list is not a live feed — two minutes is
// indistinguishable in use and halves the query volume of an open tab.
const POLL_MS = 120_000

interface DashboardProps {
  onLogout: () => void
}

/**
 * Case- and accent-insensitive key for search.
 *
 * A plain `toLowerCase().includes()` is accent-sensitive, so typing "zurich"
 * matched nothing against "Zürich, ZH, CH" — and the field advertises location
 * search. Decomposing to NFD and dropping the combining marks makes o/ö, u/ü,
 * and e/é interchangeable, which matches how the columns already sort
 * (localeCompare with sensitivity 'base').
 */
function fold(s: string | null | undefined): string {
  return (s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function pct(n: number, total: number) {
  if (!total) return 0
  return Math.round((n / total) * 100)
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [visitors, setVisitors] = useState<VisitorSummary[] | null>(null)
  const [stats, setStats] = useState<StatDay[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
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

  useEffect(() => {
    try {
      window.localStorage.setItem(HIDE_BOTS_KEY, hideBots ? '1' : '0')
      window.localStorage.setItem(ENGAGED_ONLY_KEY, engagedOnly ? '1' : '0')
    } catch { /* private mode */ }
  }, [hideBots, engagedOnly])
  const [lastLoaded, setLastLoaded] = useState<Date | null>(null)

  const fetchData = useCallback(() => {
    return Promise.all([
      apiCall<VisitorListPayload>('/api/admin/visitors', undefined, {
        errorMessage: 'Failed to load visitors.',
        onUnauthorized: onLogout,
      }),
      apiCall<StatsPayload>('/api/admin/stats'),
    ]).then(([v, s]) => {
      if (v) setVisitors(v.visitors ?? [])
      if (s) setStats(s.days)
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
  // The bot filter is a data-quality decision, so it defines the working set —
  // the metric tiles read from it too. Otherwise the header would claim 28
  // visitors while the table showed 25, and the conversion percentages would
  // stay diluted by crawler traffic, which is the whole reason to hide it.
  //
  // Search is a lookup, not a statement about the data, so it narrows only the
  // table. Typing a name shouldn't rewrite the totals above it.
  const hasEngaged = (v: VisitorSummary) => v.chat_message_count > 0 || v.contact_count > 0
  const botCount = visitors?.filter(isAutomated).length ?? 0
  // Counted after the bot filter, so the label doesn't promise to hide rows
  // that are already gone.
  const afterBots = hideBots && visitors ? visitors.filter(v => !isAutomated(v)) : visitors
  const quietCount = afterBots?.filter(v => !hasEngaged(v)).length ?? 0
  const baseVisitors = engagedOnly && afterBots ? afterBots.filter(hasEngaged) : afterBots

  const q = fold(query.trim())
  const filteredVisitors = !q || !baseVisitors ? baseVisitors : baseVisitors.filter(v =>
    v.id.startsWith(q) ||
    fold(v.contact_name).includes(q) ||
    fold(v.contact_email).includes(q) ||
    fold(resolveLocation(v).label).includes(q)
  )

  const totalVisitors = baseVisitors?.length ?? 0
  const engaged = baseVisitors?.filter(v => v.chat_message_count > 0).length ?? 0
  const converted = baseVisitors?.filter(v => v.contact_count > 0).length ?? 0
  const totalViews = baseVisitors?.reduce((s, v) => s + v.page_view_count, 0) ?? 0
  const totalEngagedMs = baseVisitors?.reduce((s, v) => s + v.total_engaged_ms, 0) ?? 0

  return (
    <Container className="flex flex-col gap-4 px-4 py-6 sm:gap-6 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Eyebrow className="text-white/85">eric.sh</Eyebrow>
          <H2 className="text-white">CRM</H2>
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

      {/* Hold the previous render at reduced opacity on refetch rather than
          flashing a skeleton — no layout jump. */}
      <Panel
        variant="raised-dark"
        className={`rounded-2xl shadow-sm transition-opacity duration-300 ${
          loading && visitors !== null ? 'opacity-40' : 'opacity-100'
        }`}
      >
        {/* Search lives inside the panel it filters. As a free-floating field it
            wore the same surface as the panels around it and read as another
            section rather than a control on this table. Here it is a toolbar
            row: no border, no fill of its own, just a divider against the
            results below it. */}
        <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3">
          <Search size={15} className="shrink-0 text-white/70" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, email, location, or visitor ID…"
            aria-label="Search visitors"
            className="h-7 min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/70 outline-none"
          />
          {/* Only while filtering: confirms the search is scoped to this table
              and that an empty result is a filter, not an empty database. */}
          {q && (
            <>
              {filteredVisitors !== null && (
                <span className="shrink-0 text-xs tabular-nums text-white/70">
                  {filteredVisitors.length} of {visitors?.length ?? 0}
                </span>
              )}
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                title="Clear search"
                className="-m-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded text-white/70 transition-colors hover:text-white"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </>
          )}

        </div>

        {/* Filters sit on their own row rather than inside the search field.
            Search is a lookup; these change which rows count at all, including
            in the metric tiles above — different jobs, different row. */}
        {(botCount > 0 || quietCount > 0) && (
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-2.5">
            <span className="mr-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/70">
              Filter
            </span>
            {botCount > 0 && (
              <FilterChip
                active={hideBots}
                onClick={() => setHideBots(h => !h)}
                icon={hideBots ? EyeOff : Bot}
                title={
                  `${hideBots ? 'Hiding' : 'Hides'} ${botCount} automated ${botCount === 1 ? 'visitor' : 'visitors'} — ` +
                  'crawlers, headless clients, and fetch-without-reading. Bounces and possible spam always stay visible.'
                }
              >
                {hideBots ? `${botCount} bots hidden` : 'Hide bots'}
              </FilterChip>
            )}
            {quietCount > 0 && (
              <FilterChip
                active={engagedOnly}
                onClick={() => setEngagedOnly(e => !e)}
                icon={MessageSquare}
                title={`Show only visitors who chatted or submitted the contact form. Hides ${quietCount} who did neither.`}
              >
                {engagedOnly ? `${quietCount} quiet hidden` : 'Engaged only'}
              </FilterChip>
            )}
          </div>
        )}

        <div className="p-6">
          {filteredVisitors === null ? (
            <VisitorTableSkeleton />
          ) : filteredVisitors.length === 0 ? (
            <p className="text-sm text-white/65">
              {q ? 'No visitors match your search.' : 'No visitors yet.'}
            </p>
          ) : (
            <VisitorList visitors={filteredVisitors} onVisitorDeleted={handleVisitorDeleted} />
          )}
        </div>
      </Panel>
    </Container>
  )
}
