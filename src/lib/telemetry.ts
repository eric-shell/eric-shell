import { getVisitorId } from './visitorId'

const SESSION_KEY = 'eric.sh:sess'
/** Inactivity gap that rolls a visit over into a new session (GA4 uses 30min). */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000

/**
 * Escalating heartbeat schedule, in ms since the last beat.
 *
 * A fixed 20s beat sent ~180 requests/hour for a single open tab — each one a
 * serverless invocation, a Postgres write, and an Upstash command, to record a
 * number that the `pagehide` / `visibilitychange` flush captures anyway.
 * Periodic beats exist only to bound data loss when those events never fire
 * (notoriously, mobile Safari), so they back off hard: dense early, when a
 * visitor is most likely to leave, then sparse.
 *
 * Cumulatively: 15s, 45s, 1m45, 3m45, 8m45, then every 5 minutes. An hour-long
 * session costs 15 beats instead of 180.
 */
const HEARTBEAT_SCHEDULE_MS = [15_000, 30_000, 60_000, 120_000, 300_000]

/**
 * Ceiling on a single accrual segment.
 *
 * A visible tab is accrued at least once per heartbeat and the sparsest beat is
 * five minutes, so any wall-clock gap longer than that is not someone reading.
 * It is a laptop that slept with the tab foregrounded (several platforms fire no
 * `visibilitychange` for that), a timer the OS froze, or a clock that stepped.
 * Before this cap, waking a machine the next morning credited the session with
 * the entire overnight gap — the 24h clamp on the server was the only thing
 * standing between that and an even sillier number.
 */
const MAX_SEGMENT_MS = Math.max(...HEARTBEAT_SCHEDULE_MS) + 30_000

interface StoredSession {
  id: string
  last: number
  /**
   * Engaged ms already reported for this session by *any* page load in it.
   *
   * The session id outlives a route change; `initTelemetry()` does not. See
   * `startSession()` for why the running total has to be carried here.
   */
  engaged?: number
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
 * Read the current session, minting a fresh one if the last activity is older
 * than SESSION_TIMEOUT_MS. Stored in localStorage rather than sessionStorage so
 * a visit spanning multiple tabs stays one session.
 *
 * Returns the engaged-time baseline alongside the id, and this is the whole
 * point. Routing here is MPA, so every internal link is a fresh document and a
 * fresh `initTelemetry()` with `engagedMs` back at zero — but the *session id*
 * is reused, and the server folds heartbeats together with
 * `greatest(existing, incoming)`. A visit that read `/` for 40s and `/resume`
 * for 90s therefore stored 90s, not 130s: the max of the pages rather than the
 * sum, and the second page's first 40s was invisible entirely because every
 * beat it sent lost the greatest() comparison. Carrying the running total
 * forward and sending `baseline + this page` fixes the arithmetic while keeping
 * every value on the wire cumulative and monotonic — which is exactly what
 * makes greatest() safe against beacons that arrive out of order.
 *
 * Note the write below preserves `engaged`. The old one rewrote the record as
 * `{ id, last }` on every page load, which is precisely how the total got lost
 * even before the client stopped sending it.
 */
function startSession(): { id: string; engagedBaseMs: number } {
  const now = Date.now()
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredSession
      if (parsed?.id && typeof parsed.last === 'number' && now - parsed.last < SESSION_TIMEOUT_MS) {
        const engaged = typeof parsed.engaged === 'number' && parsed.engaged > 0
          ? Math.round(parsed.engaged)
          : 0
        window.localStorage.setItem(SESSION_KEY, JSON.stringify({ id: parsed.id, last: now, engaged }))
        return { id: parsed.id, engagedBaseMs: engaged }
      }
    }
    const fresh = crypto.randomUUID()
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ id: fresh, last: now, engaged: 0 }))
    return { id: fresh, engagedBaseMs: 0 }
  } catch {
    // Private mode / storage disabled: a per-load id still yields usable
    // pageview data, it just won't stitch into a multi-page session.
    return { id: crypto.randomUUID(), engagedBaseMs: 0 }
  }
}

/**
 * Record this page's cumulative total against the shared session ledger.
 *
 * Monotonic, mirroring the server's `greatest()`, and for the same reasons.
 * Each page load pins its baseline once at init and never re-reads it, so no
 * tab can ever add another tab's total to its own; taking the max here only
 * raises the ledger to a figure some page load has genuinely reported. That
 * also covers a bfcache restore, whose baseline is stale-low by the time it
 * wakes and would otherwise walk the ledger backwards.
 *
 * Two tabs open on one session both accrue against it, and this deliberately
 * resolves to roughly the larger of the two rather than their sum. Summing them
 * would bill one human's attention twice for having a second window open; the
 * max is the honest reading of "how long was this visit in front of them".
 */
function commitSession(id: string, engagedTotalMs: number) {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    const parsed = raw ? JSON.parse(raw) as StoredSession : null
    // Another tab may have rolled the session over while this page sat idle.
    // Writing our total onto a different session id would graft this page's
    // dwell onto a visit it was never part of, so leave the record alone — we
    // keep beating against our own session id, which the server still accepts.
    if (parsed && parsed.id !== id) return
    const prior = typeof parsed?.engaged === 'number' ? parsed.engaged : 0
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({
      id,
      last: Date.now(),
      engaged: Math.max(prior, engagedTotalMs),
    }))
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

/**
 * How far down the document the reader has reached, 0-100 — or `null` while
 * there is nothing to measure yet.
 *
 * That null case is load-bearing. A page shorter than the viewport is genuinely
 * 100%: the whole thing was on screen. A page that has not *rendered* also
 * "fits", and is not. `initTelemetry()` runs from main.tsx immediately after
 * `createRoot().render()`, and React 19 commits asynchronously, so at that
 * instant `#root` is empty and `documentElement.scrollHeight` is just the
 * viewport height — which the old unconditional `return 100` read as a reader
 * who had seen the entire page. Every session in the CRM recorded 100% scroll
 * depth before it had painted a pixel, and the Reader tag's scroll test was a
 * tautology as a result. `body` carries no height until React commits (nothing
 * in index.css gives html/body a height), so that is the tell.
 */
function scrollPct(): number | null {
  if ((document.body?.scrollHeight ?? 0) <= 0) return null
  const doc = document.documentElement
  const scrollable = doc.scrollHeight - window.innerHeight
  if (scrollable <= 0) return 100
  return Math.max(0, Math.min(100, Math.round((window.scrollY / scrollable) * 100)))
}

export function initTelemetry() {
  if (optedOut()) return

  const visitorId = getVisitorId()
  if (!visitorId) return
  const { id: sessionId, engagedBaseMs } = startSession()

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
  // open in a background tab doesn't inflate to hours. This counter covers THIS
  // document only; `engagedBaseMs` carries the rest of the session.
  let engagedMs = 0
  // Deliberately not seeded from scrollPct() — there is no laid-out document to
  // measure at this point in the load. Sampled on scroll and again at flush,
  // by which time React has committed.
  let maxScroll = 0
  let lastTick = Date.now()
  let visible = document.visibilityState === 'visible'
  // Seeded with what the server already has rather than a sentinel: the
  // baseline is, by definition, what an earlier page load in this session
  // reported, and 0 is the column default for scroll. Without this, every
  // navigation a visitor bounced straight through fired one beacon carrying a
  // value byte-identical to the stored one. (If that earlier beacon was dropped
  // in flight the stored value is lower than the baseline, and this suppresses
  // the repair — but only for a page the visitor spent literally no time on;
  // the first beat with any real dwell sends the full cumulative and heals it.)
  let lastSentEngaged = engagedBaseMs
  let lastSentScroll = 0

  function accrue() {
    const now = Date.now()
    // Math.max(0, …) covers a clock stepped backwards; MAX_SEGMENT_MS covers a
    // machine that slept with the tab visible. Both would otherwise land in
    // engagedMs as reading time.
    if (visible) engagedMs += Math.min(Math.max(0, now - lastTick), MAX_SEGMENT_MS)
    lastTick = now
  }

  function sampleScroll() {
    const pct = scrollPct()
    if (pct !== null && pct > maxScroll) maxScroll = pct
  }

  function flush(viaBeacon: boolean) {
    accrue()
    sampleScroll()
    // Cumulative for the SESSION, not for this page — see startSession(). The
    // server takes greatest() of this, so it must only ever go up.
    const engaged = Math.round(engagedBaseMs + engagedMs)
    // Skip no-op beats: a parked tab shouldn't generate writes.
    if (engaged === lastSentEngaged && maxScroll === lastSentScroll) return
    lastSentEngaged = engaged
    lastSentScroll = maxScroll
    commitSession(sessionId, engaged)
    send({ type: 'heartbeat', visitorId, sessionId, engagedMs: engaged, scrollPct: maxScroll }, viaBeacon)
  }

  window.addEventListener('scroll', sampleScroll, { passive: true })

  document.addEventListener('visibilitychange', () => {
    accrue()
    visible = document.visibilityState === 'visible'
    // Hiding the tab is the last reliable moment on mobile, where `pagehide`
    // often never fires — flush by beacon here too.
    if (!visible) flush(true)
  })

  // setTimeout chain rather than setInterval, so the gap can grow. A hidden tab
  // accrues no engaged time, so every beat it would send is a guaranteed no-op
  // write and `flush` is skipped for it.
  let beat = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  function schedule() {
    clearTimeout(timer)
    const delay = HEARTBEAT_SCHEDULE_MS[Math.min(beat, HEARTBEAT_SCHEDULE_MS.length - 1)]
    timer = setTimeout(() => {
      beat++
      if (visible) flush(false)
      schedule()
    }, delay)
  }
  schedule()

  window.addEventListener('pagehide', () => {
    clearTimeout(timer)
    flush(true)
  })

  // A `pagehide` that parks the page in the bfcache is not the end of the visit.
  // Back returns to this same document — with the beat chain we just cancelled
  // still cancelled, so everything read after that point rode entirely on the
  // final `pagehide`. That is the exact event periodic beats exist to survive
  // the absence of. Restart from the dense end of the schedule, since a restored
  // page is a fresh stretch of reading, and re-baseline `lastTick` so the time
  // spent frozen in the cache can't be accrued as engagement.
  window.addEventListener('pageshow', e => {
    if (!e.persisted) return
    visible = document.visibilityState === 'visible'
    lastTick = Date.now()
    beat = 0
    schedule()
  })
}
