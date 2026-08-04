/**
 * `2026-08-01` → `August 1, 2026`.
 *
 * Parsed as UTC explicitly. `new Date('2026-08-01')` is already UTC midnight,
 * but rendering it with a local-timezone formatter shifts it back a day for
 * anyone west of Greenwich — which is most of the audience. Splitting the parts
 * and formatting in UTC keeps a note's date identical to the date in the data
 * file no matter who is reading it.
 */
export function formatNoteDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
