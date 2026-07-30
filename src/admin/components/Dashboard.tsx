import { useCallback, useEffect, useState } from 'react'
import {
  type LucideIcon, ExternalLink, LogOut, MailCheck, MessageSquare, MousePointer2,
  RefreshCw, Search, Users,
} from 'lucide-react'
import { Button, Eyebrow, H2, Panel } from '../../components/ui'
import VisitorList from './VisitorList'
import VisitorsChart from './VisitorsChart'
import { MetricsRowSkeleton, Skeleton, VisitorTableSkeleton } from './Skeleton'
import { apiCall } from '../lib/api'
import { formatDuration } from '../lib/dateFormat'
import { resolveLocation } from '../lib/location'
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
            className={positive ? 'text-green-400' : 'text-white/60'}
            aria-hidden="true"
          />
        )}
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">{label}</p>
      </div>
      {/* Proportional figures, not tabular: tabular-nums makes a value like 121
          look loose at display size. Sans, never the display face. */}
      <p className="mt-1.5 font-sans text-[26px] font-semibold leading-none text-white">{value}</p>
      <p className={`mt-1 text-xs ${positive ? 'font-medium text-green-400' : 'text-white/70'}`}>{sub}</p>
    </Panel>
  )
}

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
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
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

  const q = query.trim().toLowerCase()
  const filteredVisitors = !q || !visitors ? visitors : visitors.filter(v =>
    v.id.startsWith(q) ||
    v.contact_name?.toLowerCase().includes(q) ||
    v.contact_email?.toLowerCase().includes(q) ||
    resolveLocation(v).label?.toLowerCase().includes(q)
  )

  const totalVisitors = visitors?.length ?? 0
  const engaged = visitors?.filter(v => v.chat_message_count > 0).length ?? 0
  const converted = visitors?.filter(v => v.contact_count > 0).length ?? 0
  const totalViews = visitors?.reduce((s, v) => s + v.page_view_count, 0) ?? 0
  const totalEngagedMs = visitors?.reduce((s, v) => s + v.total_engaged_ms, 0) ?? 0

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Eyebrow className="text-white/70">eric.sh</Eyebrow>
          <H2 className="text-white">CRM</H2>
        </div>
        <div className="flex items-center gap-2">
          {lastLoaded && (
            <span className="flex items-center gap-1.5 pr-1 text-xs text-white/85">
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
          <Button
            variant="raised-dark" size="sm" href={window.location.origin} target="_blank"
            leftIcon={<ExternalLink aria-hidden="true" />}
          >
            Visit Website
          </Button>
          <Button variant="raised-dark" size="sm" onClick={logout} leftIcon={<LogOut aria-hidden="true" />}>
            Sign out
          </Button>
        </div>
      </header>

      {/* Metrics row */}
      {/* Sized to include the chart's caption, plot, baseline, and axis band —
          a shorter row squeezed the plot into a strip of stubby tabs. */}
      <div className="flex gap-3 items-stretch min-h-[116px]">
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
            <Panel variant="raised-dark" className="flex-1 rounded-2xl p-4">
              {stats
                ? <VisitorsChart days={stats} />
                : <Skeleton className="h-full w-full min-h-[48px]" />}
            </Panel>
          </>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/55 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, email, or visitor ID…"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/55 outline-none transition focus:border-accent/60 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-accent)_22%,transparent)]"
        />
      </div>

      {/* Hold the previous render at reduced opacity on refetch rather than
          flashing a skeleton — no layout jump. */}
      <Panel
        variant="raised-dark"
        className={`rounded-2xl p-6 shadow-sm transition-opacity duration-300 ${
          loading && visitors !== null ? 'opacity-40' : 'opacity-100'
        }`}
      >
        {filteredVisitors === null ? (
          <VisitorTableSkeleton />
        ) : filteredVisitors.length === 0 ? (
          <p className="text-sm text-white/50">
            {q ? 'No visitors match your search.' : 'No visitors yet.'}
          </p>
        ) : (
          <VisitorList visitors={filteredVisitors} onVisitorDeleted={handleVisitorDeleted} />
        )}
      </Panel>
    </div>
  )
}
