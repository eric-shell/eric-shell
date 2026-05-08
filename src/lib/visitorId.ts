const STORAGE_KEY = 'eric.sh:vid'

export function getVisitorId(): string {
  if (typeof window === 'undefined') return ''
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const fresh = crypto.randomUUID()
    window.localStorage.setItem(STORAGE_KEY, fresh)
    return fresh
  } catch {
    return ''
  }
}
