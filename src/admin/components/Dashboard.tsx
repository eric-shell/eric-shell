import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, LogOut, RefreshCw } from 'lucide-react'
import { Button, H2, Panel, toast } from '../../components/ui'
import VisitorList, { type VisitorSummary } from './VisitorList'
import { Skeleton } from './Skeleton'

function VisitorTableSkeleton() {
  return (
    <table className="w-full table-fixed text-sm animate-pulse">
      <thead>
        <tr className="border-b border-blue-950/10 text-left text-xs uppercase tracking-wide text-blue-950/50">
          <th className="py-2 px-4 font-semibold w-28">Visitor</th>
          <th className="py-2 pr-4 font-semibold w-36">Last seen</th>
          <th className="py-2 pr-4 font-semibold w-36">Name</th>
          <th className="py-2 pr-4 font-semibold">Email</th>
          <th className="py-2 pr-4 font-semibold text-right w-16">Chat</th>
          <th className="py-2 pr-4 font-semibold text-right w-16">Contact</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 6 }).map((_, i) => (
          <tr key={i} className="border-b border-blue-950/5">
            <td className="py-3 px-4"><Skeleton className="h-3 w-20" /></td>
            <td className="py-3 pr-4"><Skeleton className="h-3 w-28" /></td>
            <td className="py-3 pr-4"><Skeleton className="h-3 w-20" /></td>
            <td className="py-3 pr-4"><Skeleton className="h-3 w-36" /></td>
            <td className="py-3 pr-4"><Skeleton className="h-3 w-4 ml-auto" /></td>
            <td className="py-3 pr-4"><Skeleton className="h-3 w-4 ml-auto" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

interface DashboardProps {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [visitors, setVisitors] = useState<VisitorSummary[] | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/visitors')
      if (!res.ok) {
        if (res.status === 401) {
          onLogout()
          return
        }
        toast.error('Failed to load visitors.')
        return
      }
      const data = await res.json()
      setVisitors(data.visitors ?? [])
    } catch {
      toast.error('Network error.')
    } finally {
      setLoading(false)
    }
  }, [onLogout])

  useEffect(() => { load() }, [load])

  async function logout() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } catch {
      // ignore — we still flip the local state
    }
    onLogout()
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <H2 className="text-blue-950">CRM</H2>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={load} disabled={loading}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Refresh</Button>
          <Button variant="white" size="sm" href={window.location.origin} target="_blank"><ExternalLink size={14} />Visit Website</Button>
          <Button variant="white" size="sm" onClick={logout}><LogOut size={14} />Sign out</Button>
        </div>
      </header>

      <Panel variant="white" className={`rounded-2xl p-6 transition-opacity duration-300 ${loading && visitors !== null ? 'opacity-40' : 'opacity-100'}`}>
        {visitors === null ? (
          <VisitorTableSkeleton />
        ) : visitors.length === 0 ? (
          <p className="text-sm text-blue-950/50">No visitors yet.</p>
        ) : (
          <VisitorList visitors={visitors} />
        )}
      </Panel>
    </div>
  )
}
