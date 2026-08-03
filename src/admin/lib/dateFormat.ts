/**
 * The "Last seen" cell: `Today, 4:20 AM` when it happened today, otherwise
 * `Aug 3, 4:20 AM`.
 *
 * The time is kept in both branches — on the busiest rows "when today" is the
 * part being scanned for, and dropping it would make every visitor from the
 * last 24 hours look identical.
 *
 * Same-day is decided from local calendar fields, in the reader's own timezone,
 * because that is the timezone the rest of the string is already rendered in.
 * Comparing ISO date substrings would use UTC and label a visit "Today" hours
 * early or late for anyone not on UTC — for the owner in California that is
 * every visit between 5pm and midnight.
 *
 * A dashboard left open across midnight keeps saying "Today" until something
 * re-renders, which the 120s poll does on its own.
 */
export function formatLastSeen(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()

  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `Today, ${time}`

  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export function formatLong(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export function formatMonthDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Compact engaged-time label: `0s`, `45s`, `3m 20s`, `1h 04m`. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  if (total < 60) return `${total}s`
  const mins = Math.floor(total / 60)
  const secs = total % 60
  if (mins < 60) return `${mins}m ${String(secs).padStart(2, '0')}s`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ${String(mins % 60).padStart(2, '0')}m`
}
