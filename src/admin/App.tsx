import { useCallback, useEffect, useState } from 'react'
import { Toaster } from '../components/ui'
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

/**
 * A route, carrying the current query string across the redirect.
 *
 * The contact notification email links to `/dashboard?v=<id>`, and it is
 * usually opened signed out. Both hops of the sign-in round trip used to go to
 * a bare path, so the link reliably landed on a dashboard with no visitor open.
 * Only the query is carried and only onto these two fixed paths, so there is
 * nothing here for an open redirect to use.
 */
function withQuery(path: string): string {
  return path + window.location.search
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
    if (authed && isLogin) window.location.replace(withQuery(DASHBOARD_PATH))
    else if (!authed && !isLogin) window.location.replace(withQuery(LOGIN_PATH))
  }, [authed, isLogin])

  const handleLogout = useCallback(() => {
    // Also the `onUnauthorized` path for every admin fetch, so an expired
    // session lands on the login page rather than a dashboard full of errors —
    // and, with the query carried, signs back in to the visitor it was on.
    window.location.assign(withQuery(LOGIN_PATH))
  }, [])

  const handleLogin = useCallback(() => {
    window.location.assign(withQuery(DASHBOARD_PATH))
  }, [])

  // Nothing renders until the probe has resolved AND the route agrees with it,
  // so neither UI can flash before its redirect lands.
  const ready = authed !== null && authed !== isLogin

  return (
    // The ink field, the same one the public site's hero and footer stand on.
    // `focus-on-field` turns every focus ring in here white: the default ring
    // is Luminous Blue, which is 3.4:1 against ink and loses to the panels.
    <div className="relative min-h-screen bg-ink text-white font-sans focus-on-field">
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
