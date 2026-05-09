import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, LogOut, RefreshCw, Search } from 'lucide-react'
import { Button, H2, Panel } from '../../components/ui'
import VisitorList from './VisitorList'
import { MetricsRowSkeleton, Skeleton, VisitorTableSkeleton } from './Skeleton'
import { apiCall } from '../lib/api'
import { formatMonthDay } from '../lib/dateFormat'
import type { StatDay, StatsPayload, VisitorListPayload, VisitorSummary } from '@/../api/_lib/types'

function StatCard({ label, value, sub }: { label: string; value: number | string; sub: string }) {
  return (
    <Panel variant="white" className="flex flex-col justify-between rounded-2xl p-4 min-w-[110px]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-950/50">{label}</p>
      <p className="text-2xl font-bold text-blue-950 mt-1">{value}</p>
      <p className="text-xs text-blue-950/40 mt-0.5">{sub}</p>
    </Panel>
  )
}

function BarChart({ days }: { days: StatDay[] }) {
  const W = 300
  const H = 48
  const gap = 2
  const barW = (W - gap * (days.length - 1)) / days.length
  const maxV = Math.max(...days.map(d => d.visitors), 1)
  const minBarH = 2

  return (
    <div className="flex flex-col gap-1 w-full h-full justify-between">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="flex-1"
      >
        {days.map((d, i) => {
          const barH = Math.max(minBarH, (d.visitors / maxV) * H)
          const x = i * (barW + gap)
          const y = H - barH
          return (
            <rect
              key={d.date}
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={1}
              className="fill-blue-600/60 hover:fill-blue-700 transition-colors cursor-default"
            >
              <title>{formatMonthDay(d.date)}: {d.visitors} visitor{d.visitors !== 1 ? 's' : ''}</title>
            </rect>
          )
        })}
      </svg>
      <div className="flex justify-between text-[9px] text-blue-950/40 shrink-0">
        <span>{formatMonthDay(days[0].date)}</span>
        <span>{formatMonthDay(days[days.length - 1].date)}</span>
      </div>
    </div>
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

  const load = useCallback(async () => {
    setLoading(true)
    const [v, s] = await Promise.all([
      apiCall<VisitorListPayload>('/api/admin/visitors', undefined, {
        errorMessage: 'Failed to load visitors.',
        onUnauthorized: onLogout,
      }),
      apiCall<StatsPayload>('/api/admin/stats'),
    ])
    if (v) setVisitors(v.visitors ?? [])
    if (s) setStats(s.days)
    setLoading(false)
    setLastLoaded(new Date())
  }, [onLogout])

  useEffect(() => { load() }, [load])

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
    v.contact_email?.toLowerCase().includes(q)
  )

  const totalVisitors = visitors?.length ?? 0
  const engaged = visitors?.filter(v => v.chat_message_count > 0).length ?? 0
  const converted = visitors?.filter(v => v.contact_count > 0).length ?? 0
  const totalMessages = visitors?.reduce((s, v) => s + v.chat_message_count, 0) ?? 0

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <H2 className="text-blue-950">CRM</H2>
        <div className="flex items-center gap-2">
          {lastLoaded && (
            <span className="text-xs text-blue-950/60 pr-1">
              Updated {lastLoaded.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button variant="primary" size="sm" onClick={load} disabled={loading}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Refresh</Button>
          <Button variant="white" size="sm" href={window.location.origin} target="_blank"><ExternalLink size={14} />Visit Website</Button>
          <Button variant="white" size="sm" onClick={logout}><LogOut size={14} />Sign out</Button>
        </div>
      </header>

      {/* Metrics row */}
      <div className="flex gap-3 items-stretch min-h-[88px]">
        {visitors === null ? (
          <MetricsRowSkeleton />
        ) : (
          <>
            <StatCard label="Visitors" value={totalVisitors} sub="total" />
            <StatCard label="Engaged" value={engaged} sub={`chatted · ${pct(engaged, totalVisitors)}%`} />
            <StatCard label="Converted" value={converted} sub={`submitted · ${pct(converted, totalVisitors)}%`} />
            <StatCard label="Messages" value={totalMessages} sub="across all visitors" />
            <Panel variant="white" className="flex-1 rounded-2xl p-4">
              {stats
                ? <BarChart days={stats} />
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
          className="w-full rounded-xl border border-blue-950/10 bg-white py-2.5 pl-9 pr-4 text-sm text-blue-950 placeholder:text-blue-950/30 outline-none focus:border-blue-950/30 transition-colors"
        />
      </div>

      <Panel variant="white" className={`rounded-2xl p-6 transition-opacity duration-300 ${loading && visitors !== null ? 'opacity-40' : 'opacity-100'}`}>
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
