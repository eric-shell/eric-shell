import { useEffect, useState } from 'react'
import { Backdrop, Toaster } from '../components/ui'
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
    <div className="relative min-h-screen bg-blue-50 text-blue-950 font-sans">
      {/* Same ambient language as the public site's sections. `fixed` (rather
          than Backdrop's default `absolute`) keeps the blobs viewport-sized on a
          long scrolling table instead of stretching to the document height.
          It sits behind every panel, so it never washes out text. */}
      <Backdrop tone="light" className="fixed" />
      <div className="relative">
        <Toaster />
        {authed === null ? (
          <div className="flex min-h-screen items-center justify-center text-blue-950/50 text-sm">Loading…</div>
        ) : authed ? (
          <Dashboard onLogout={() => setAuthed(false)} />
        ) : (
          <Login onSuccess={() => setAuthed(true)} />
        )}
      </div>
    </div>
  )
}
