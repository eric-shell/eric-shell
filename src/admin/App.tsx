import { useEffect, useState } from 'react'
import { Toaster } from '../components/ui'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/visitors')
      .then(res => { if (!cancelled) setAuthed(res.ok) })
      .catch(() => { if (!cancelled) setAuthed(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen bg-blue-50 text-blue-950 font-sans">
      <Toaster />
      {authed === null ? (
        <div className="flex min-h-screen items-center justify-center text-blue-950/50 text-sm">Loading…</div>
      ) : authed ? (
        <Dashboard onLogout={() => setAuthed(false)} />
      ) : (
        <Login onSuccess={() => setAuthed(true)} />
      )}
    </div>
  )
}
