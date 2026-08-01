import { useCallback, useEffect, useState } from 'react'
import { Backdrop, Toaster } from '../components/ui'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import { DashboardBoot, LoginBoot } from './components/BootSkeleton'

export const LOGIN_PATH = '/login'
export const DASHBOARD_PATH = '/dashboard'

/**
 * One bundle serves both routes — vercel.json rewrites `/login` and
 * `/dashboard` to the same `dashboard.html`. A second Vite entry would mean a
 * second React runtime and a second copy of the auth probe for a page that is
 * two form fields; routing on pathname keeps it to one of each.
 */
function onLoginRoute(): boolean {
  return window.location.pathname.replace(/\/+$/, '') === LOGIN_PATH
}

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const isLogin = onLoginRoute()

  useEffect(() => {
    let cancelled = false
    // Cookie-only probe — no database work, unlike the old `/api/admin/visitors`
    // check, which ran the full aggregate just to read its status code.
    fetch('/api/admin/session')
      .then(res => { if (!cancelled) setAuthed(res.ok) })
      .catch(() => { if (!cancelled) setAuthed(false) })
    return () => { cancelled = true }
  }, [])

  // Route guard. `replace` rather than `assign` so the redirect doesn't stack a
  // history entry the back button can bounce off.
  useEffect(() => {
    if (authed === null) return
    if (authed && isLogin) window.location.replace(DASHBOARD_PATH)
    else if (!authed && !isLogin) window.location.replace(LOGIN_PATH)
  }, [authed, isLogin])

  const handleLogout = useCallback(() => {
    // Also the `onUnauthorized` path for every admin fetch, so an expired
    // session lands on the login page rather than a dashboard full of errors.
    window.location.assign(LOGIN_PATH)
  }, [])

  const handleLogin = useCallback(() => {
    window.location.assign(DASHBOARD_PATH)
  }, [])

  // Nothing renders until the probe has resolved AND the route agrees with it,
  // so neither UI can flash before its redirect lands.
  const ready = authed !== null && authed !== isLogin

  return (
    <div className="relative min-h-screen bg-blue-950 text-white font-sans">
      {/* The site's dark-section language (Testimonials, Footer), not a theme
          flip: indigo/violet ambient blobs over a blue-950 canvas. `fixed`
          (rather than Backdrop's default `absolute`) keeps the blobs
          viewport-sized on a long scrolling table instead of stretching to the
          document height. It sits behind every panel, never over text. */}
      <Backdrop tone="dark" className="fixed" />
      <div className="relative">
        <Toaster />
        {/* Shaped by the route, which is known synchronously — the probe is a
            cold serverless call, so the word "Loading…" used to be the whole
            page for a second or more. See BootSkeleton. */}
        {!ready ? (
          isLogin ? <LoginBoot /> : <DashboardBoot />
        ) : authed ? (
          <Dashboard onLogout={handleLogout} />
        ) : (
          <Login onSuccess={handleLogin} />
        )}
      </div>
    </div>
  )
}
