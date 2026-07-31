const STORAGE_KEY = 'eric.sh:vid'

/**
 * Pinned for the life of this document.
 *
 * Every caller used to re-read localStorage independently: `initTelemetry()`
 * captured the value once at load, while chat, contact, and outbound-click read
 * it again at call time. So if the stored value ever changed mid-visit, one open
 * page reported its page views as one visitor and everything the reader actually
 * did as another — which is exactly how a real visit landed in the CRM as two
 * rows, split down the seam between the pinned read and the per-call ones.
 *
 * A document is one person. Resolve the id once and reuse it, whatever storage
 * does afterwards.
 */
let cached: string | null = null

export function getVisitorId(): string {
  if (cached) return cached
  if (typeof window === 'undefined') return ''
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (existing) {
      cached = existing
      return existing
    }
    const fresh = crypto.randomUUID()
    window.localStorage.setItem(STORAGE_KEY, fresh)
    // Read back rather than trusting `fresh`: two documents opening at once
    // (a link tapped twice, a restored tab pair) both find the key empty and
    // both mint. Adopting whatever actually landed makes them converge on one
    // id instead of spending the visit as two strangers.
    cached = window.localStorage.getItem(STORAGE_KEY) || fresh
    return cached
  } catch {
    return ''
  }
}
