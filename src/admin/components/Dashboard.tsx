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
 * color-alone. green-700 is 5.96:1 on white — AA text.
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
      variant="white"
      className="group relative flex min-w-[120px] flex-col justify-between overflow-hidden rounded-2xl p-4 shadow-sm ring-1 ring-blue-950/4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-1.5">
        {Icon && (
          <Icon
            size={11}
            strokeWidth={2.5}
            className={positive ? 'text-green-700' : 'text-blue-950/35'}
            aria-hidden="true"
          />
        )}
        <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-950/50">{label}</p>
      </div>
      {/* Proportional figures, not tabular: tabular-nums makes a value like 121
          look loose at display size. Sans, never the display face. */}
      <p className="mt-1.5 font-sans text-[26px] font-semibold leading-none text-blue-950">{value}</p>
      <p className={`mt-1 text-xs ${positive ? 'font-medium text-green-700' : 'text-blue-950/45'}`}>{sub}</p>
    </Panel>
  )
}

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

  useEffect(() => {
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
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
          <Eyebrow className="text-blue-950/45">eric.sh</Eyebrow>
          <H2 className="text-blue-950">CRM</H2>
        </div>
        <div className="flex items-center gap-2">
          {lastLoaded && (
            <span className="flex items-center gap-1.5 pr-1 text-xs text-blue-950/55">
              {/* Quietly signals the 60s auto-refresh is alive. */}
              <span className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-blue-600 animate-pulse' : 'bg-green-700/60'}`} />
              {lastLoaded.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button variant="primary" size="sm" onClick={load} disabled={loading}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Refresh</Button>
          <Button variant="white" size="sm" href={window.location.origin} target="_blank"><ExternalLink size={14} />Visit Website</Button>
          <Button variant="white" size="sm" onClick={logout}><LogOut size={14} />Sign out</Button>
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
            <Panel variant="white" className="flex-1 rounded-2xl p-4 shadow-sm ring-1 ring-blue-950/4">
              {stats
                ? <VisitorsChart days={stats} />
                : <Skeleton className="h-full w-full min-h-[48px]" />}
            </Panel>
          </>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-950/30 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, email, or visitor ID…"
          className="w-full rounded-xl border border-blue-950/10 bg-white py-2.5 pl-9 pr-4 text-sm text-blue-950 shadow-sm placeholder:text-blue-950/30 outline-none transition-shadow focus:border-blue-600/40 focus:shadow-[0_0_0_3px_oklch(0.546_0.091_231.5/0.12)]"
        />
      </div>

      {/* Hold the previous render at reduced opacity on refetch rather than
          flashing a skeleton — no layout jump. */}
      <Panel
        variant="white"
        className={`rounded-2xl p-6 shadow-sm ring-1 ring-blue-950/4 transition-opacity duration-300 ${
          loading && visitors !== null ? 'opacity-40' : 'opacity-100'
        }`}
      >
        {filteredVisitors === null ? (
          <VisitorTableSkeleton />
        ) : filteredVisitors.length === 0 ? (
          <p className="text-sm text-blue-950/50">
            {q ? 'No visitors match your search.' : 'No visitors yet.'}
          </p>
        ) : (
          <VisitorList visitors={filteredVisitors} onVisitorDeleted={handleVisitorDeleted} />
        )}
      </Panel>
    </div>
  )
}
