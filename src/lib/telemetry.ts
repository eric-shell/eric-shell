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
 * Identity headers for any request the server persists against a visitor.
 *
 * Both ids, always together: `X-Visitor-Id` says who the browser thinks it is,
 * `X-Session-Id` says which visit this belongs to, and the server prefers the
 * session's established owner when the two disagree. Neither is a credential —
 * both are client-supplied and pseudonymous (see api/_lib/visitor.ts).
 */
export function identityHeaders(): Record<string, string> {
  const visitorId = getVisitorId()
  const sessionId = getSessionId()
  return {
    ...(visitorId ? { 'X-Visitor-Id': visitorId } : {}),
    ...(sessionId ? { 'X-Session-Id': sessionId } : {}),
  }
}

/** Interaction events `/api/events` accepts. Mirrors its `VALID_TYPES`. */
export type VisitorEventType = 'ada_toggle' | 'chat_cleared' | 'speech_input' | 'outbound_click'

/**
 * Fire-and-forget interaction event.
 *
 * Honors GPC/DNT for the same reason `initTelemetry` does — an opt-out that
 * covered page views but not "this visitor toggled high-contrast twice and
 * dictated a message" would be an opt-out in name only. Never throws and never
 * surfaces a failure: no interaction event is worth interrupting the UI it
 * describes.
 */
export function sendEvent(type: VisitorEventType, metadata?: Record<string, unknown>) {
  if (optedOut()) return
  const visitorId = getVisitorId()
  if (!visitorId) return
  void fetch('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...identityHeaders(),
      'X-Referrer': document.referrer,
    },
    body: JSON.stringify({ visitorId, type, metadata }),
    // `outbound_click` fires on a click that is about to unload this document.
    // Without keepalive the browser cancels the request the moment navigation
    // starts, so the one event most worth recording would be the one most
    // likely to be lost. Harmless for the in-page event types.
    keepalive: true,
  }).catch(err => {
    if (import.meta.env.DEV) console.warn(`${type} event failed:`, err)
  })
}

/**
 * The current session id, or null — read-only, and deliberately never mints one.
 *
 * Sent alongside the visitor id by chat / contact / event requests so the server
 * can resolve them all to whoever the session already belongs to. A visitor id
 * that changes mid-visit (storage evicted, two documents minting at once) would
 * otherwise fork one person into two CRM rows; the session id is the thread that
 * survives, so it is what the server ties identity to.
 *
 * Minting here would be wrong: a chat message is not the start of a visit, and a
 * session created outside `initTelemetry()` would carry no entry path, referrer,
 * or viewport — and would be created even for a visitor who opted out below.
 */
export function getSessionId(): string | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSession
    if (!parsed?.id || typeof parsed.last !== 'number') return null
    return Date.now() - parsed.last < SESSION_TIMEOUT_MS ? parsed.id : null
  } catch {
    return null
  }
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

/**
 * Campaign tags off the current URL's query string, or nulls.
 *
 * Sent on every page view, not just the first. The server backfills with
 * coalesce (first non-null wins), so an untagged second page reports nulls and
 * leaves the session's acquisition intact — which means this needs no notion of
 * "is this the entry page", a question MPA routing makes awkward to answer.
 *
 * Values are clamped hard: they are attacker-controllable via a crafted link,
 * and they end up rendered in the admin.
 */
function campaign(): Record<string, string | null> {
  try {
    const q = new URLSearchParams(window.location.search)
    const tag = (k: string) => {
      const v = q.get(k)?.trim()
      return v ? v.slice(0, 80) : null
    }
    return {
      utmSource: tag('utm_source'),
      utmMedium: tag('utm_medium'),
      utmCampaign: tag('utm_campaign'),
    }
  } catch {
    return { utmSource: null, utmMedium: null, utmCampaign: null }
  }
}

/**
 * Record clicks on links that leave the site.
 *
 * One delegated listener on the document rather than a handler wired into Card,
 * Footer, and every CTA. Call-site instrumentation would have to be remembered
 * every time someone adds a link — this cannot be forgotten, and it covers
 * markup that doesn't exist yet.
 *
 * Only OUTBOUND links are recorded. Same-origin navigation is already a page
 * view, and logging it here would double-count every route change. Everything
 * captured describes the site's own markup — destination, link text, section —
 * never anything the visitor typed.
 *
 * Listens in the capture phase so a handler that calls stopPropagation (Pill
 * does, inside card links) can't swallow the event first.
 */
function initOutboundClicks() {
  document.addEventListener('click', e => {
    // Modifier-clicks and middle-clicks open a background tab. They're real
    // intent and worth recording, so the only button excluded is right-click,
    // which doesn't navigate at all.
    if (e instanceof MouseEvent && e.button === 2) return

    const el = e.target instanceof Element ? e.target : null
    const link = el?.closest('a')
    const href = link?.getAttribute('href')
    if (!link || !href) return

    let url: URL
    try {
      url = new URL(href, window.location.href)
    } catch {
      return
    }

    const scheme = url.protocol
    const isMessage = scheme === 'mailto:' || scheme === 'tel:'
    // A same-host http(s) link is internal — page_views owns it.
    if (!isMessage && (scheme !== 'http:' && scheme !== 'https:')) return
    if (!isMessage && url.host === window.location.host) return

    // An icon-only link (footer socials) has no text node; its accessible name
    // is the only label there is.
    const label = (
      link.textContent?.trim().replace(/\s+/g, ' ') ||
      link.getAttribute('aria-label') ||
      link.getAttribute('title') ||
      ''
    ).slice(0, 80)

    // Which part of the page the link lived in — the difference between "they
    // opened a project from the work grid" and "they clicked the footer".
    const context =
      link.closest('section[id]')?.id ??
      link.closest('header, footer')?.tagName.toLowerCase() ??
      null

    sendEvent('outbound_click', {
      // Strip the query and hash: they carry nothing here and are the one part
      // of a URL that could pick up a token from a hand-written link.
      //
      // `origin` is the literal string "null" for a non-special scheme, so a
      // mailto: has to be rebuilt from the scheme instead — otherwise every
      // email link recorded itself as "nullsomeone@example.com". The address
      // here is the site's own, not the visitor's.
      href: (isMessage
        ? `${scheme}${url.pathname}`
        : `${url.origin}${url.pathname}`
      ).slice(0, 300),
      host: isMessage ? scheme.replace(':', '') : url.host.replace(/^www\./, ''),
      label,
      context,
    })
  }, { capture: true })
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
    ...campaign(),
  }, false)

  initOutboundClicks()

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
