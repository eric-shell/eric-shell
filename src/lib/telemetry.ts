import { getVisitorId } from './visitorId'

const SESSION_KEY = 'eric.sh:sess'
/** Inactivity gap that rolls a visit over into a new session (GA4 uses 30min). */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000
const HEARTBEAT_MS = 20_000

interface StoredSession {
  id: string
  last: number
}

/**
 * Global Privacy Control / Do Not Track. Neither is legally binding in the US,
 * but the site ships a real privacy page, so an explicit opt-out is honored.
 */
function optedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string }
  const dnt = nav.doNotTrack ?? nav.msDoNotTrack ?? (window as { doNotTrack?: string }).doNotTrack
  return nav.globalPrivacyControl === true || dnt === '1' || dnt === 'yes'
}

/**
 * Read the current session id, minting a fresh one if the last activity is
 * older than SESSION_TIMEOUT_MS. Stored in localStorage rather than
 * sessionStorage so a visit spanning multiple tabs stays one session.
 */
function getSessionId(): string {
  const now = Date.now()
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredSession
      if (parsed?.id && typeof parsed.last === 'number' && now - parsed.last < SESSION_TIMEOUT_MS) {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify({ id: parsed.id, last: now }))
        return parsed.id
      }
    }
    const fresh = crypto.randomUUID()
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ id: fresh, last: now }))
    return fresh
  } catch {
    // Private mode / storage disabled: a per-load id still yields usable
    // pageview data, it just won't stitch into a multi-page session.
    return crypto.randomUUID()
  }
}

function touchSession(id: string) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ id, last: Date.now() }))
  } catch { /* storage unavailable — nothing to do */ }
}

/**
 * sendBeacon survives page unload, which fetch does not reliably do. The JSON
 * blob type matters: it makes Vercel parse req.body for us.
 */
function send(payload: Record<string, unknown>, viaBeacon: boolean) {
  const body = JSON.stringify(payload)
  try {
    if (viaBeacon && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))
      return
    }
    // The pageview goes out as a real fetch so it carries X-Visitor-Id and picks
    // up Vercel's edge geo headers — sendBeacon cannot set headers.
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Visitor-Id': String(payload.visitorId) },
      body,
      keepalive: true,
    }).catch(() => { /* telemetry is never worth surfacing */ })
  } catch { /* ignore */ }
}

function scrollPct(): number {
  const doc = document.documentElement
  const scrollable = doc.scrollHeight - window.innerHeight
  if (scrollable <= 0) return 100
  return Math.max(0, Math.min(100, Math.round((window.scrollY / scrollable) * 100)))
}

export function initTelemetry() {
  if (optedOut()) return

  const visitorId = getVisitorId()
  if (!visitorId) return
  const sessionId = getSessionId()

  send({
    type: 'pageview',
    visitorId,
    sessionId,
    path: window.location.pathname,
    referrer: document.referrer || null,
    clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
    language: navigator.language ?? null,
    viewportW: window.innerWidth,
    viewportH: window.innerHeight,
    screenW: window.screen?.width,
    screenH: window.screen?.height,
  }, false)

  // Engaged time counts only while the tab is actually visible, so a page left
  // open in a background tab doesn't inflate to hours.
  let engagedMs = 0
  let maxScroll = scrollPct()
  let lastTick = Date.now()
  let visible = document.visibilityState === 'visible'
  let lastSentEngaged = -1
  let lastSentScroll = -1

  function accrue() {
    const now = Date.now()
    if (visible) engagedMs += now - lastTick
    lastTick = now
  }

  function flush(viaBeacon: boolean) {
    accrue()
    const engaged = Math.round(engagedMs)
    // Skip no-op beats: a parked tab shouldn't generate writes.
    if (engaged === lastSentEngaged && maxScroll === lastSentScroll) return
    lastSentEngaged = engaged
    lastSentScroll = maxScroll
    touchSession(sessionId)
    send({ type: 'heartbeat', visitorId, sessionId, engagedMs: engaged, scrollPct: maxScroll }, viaBeacon)
  }

  window.addEventListener('scroll', () => {
    const pct = scrollPct()
    if (pct > maxScroll) maxScroll = pct
  }, { passive: true })

  document.addEventListener('visibilitychange', () => {
    accrue()
    visible = document.visibilityState === 'visible'
    // Hiding the tab is the last reliable moment on mobile, where `pagehide`
    // often never fires — flush by beacon here too.
    if (!visible) flush(true)
  })

  setInterval(() => flush(false), HEARTBEAT_MS)
  window.addEventListener('pagehide', () => flush(true))
}
