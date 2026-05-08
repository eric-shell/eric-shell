import { useCallback, useEffect, useState } from 'react'
import { Button, H2, Panel, toast } from '../../components/ui'
import VisitorList, { type VisitorSummary } from './VisitorList'
import VisitorDetail from './VisitorDetail'

interface DashboardProps {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [visitors, setVisitors] = useState<VisitorSummary[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const load = useCallback(async () => {
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
          <Button variant="secondary" size="sm" onClick={load}>Refresh</Button>
          <Button variant="ghost" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <Panel variant="white" className="rounded-2xl p-6">
        {visitors === null ? (
          <p className="text-sm text-blue-950/50">Loading…</p>
        ) : visitors.length === 0 ? (
          <p className="text-sm text-blue-950/50">No visitors yet.</p>
        ) : (
          <VisitorList visitors={visitors} onSelect={setSelectedId} />
        )}
      </Panel>

      {selectedId && (
        <VisitorDetail id={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
