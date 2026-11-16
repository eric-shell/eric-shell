/**
 * Which visitor's drawer is holding edits that haven't been saved, if any.
 *
 * Module scope rather than a ref inside `VisitorList`, because the list is not
 * the only thing that can take the drawer away. The search field lives in
 * `VisitorsPanel`, the timeframe and filter chips keep their state in
 * `Dashboard`, and sign-out is a button in the header — and each of them was a
 * way to lose a half-written note without being asked. They all need to read
 * the same flag, and threading a ref down three components to share one string
 * is more wiring than the thing it carries. There is one visitor list per page,
 * so one slot is the whole model (same shape as `detailCache`).
 *
 * Not React state on purpose: nothing renders from it, and the drawer reports
 * into it from an effect on every clean/dirty flip.
 */
let unsavedId: string | null = null

/**
 * Reported by each drawer about itself.
 *
 * Keyed by id so a drawer can only clear its OWN flag. Two are mounted per open
 * row (table and phone card, one hidden by CSS) and a closing one lingers for
 * the collapse animation; a bare boolean let any of them wipe the flag the
 * visible one had just set.
 */
export function setUnsaved(id: string, dirty: boolean): void {
  if (dirty) unsavedId = id
  else if (unsavedId === id) unsavedId = null
}

/** The visitor with unsaved edits, or null. */
export function unsavedVisitorId(): string | null {
  return unsavedId
}

/** For when the edits are gone on purpose — discarded, or deleted with the row. */
export function clearUnsaved(): void {
  unsavedId = null
}

/** True if nothing is unsaved, or the owner agreed to throw it away. */
export function confirmDiscard(): boolean {
  return unsavedId === null || confirm('You have unsaved changes to this visitor. Discard them?')
}
