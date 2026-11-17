/**
 * `2026-08-01` → `August 1, 2026`. Every date a reader sees: note dates, and
 * the "Updated" lines.
 *
 * Parsed as UTC explicitly. `new Date('2026-08-01')` is already UTC midnight,
 * but rendering it with a local-timezone formatter shifts it back a day for
 * anyone west of Greenwich — which is most of the audience. Splitting the parts
 * and formatting in UTC keeps a date identical to the one in the data file no
 * matter who is reading it, and identical between the prerendered HTML and the
 * hydrating browser, which a timezone shift would break.
 */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
