import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * False while React is rendering on the server or hydrating the prerendered
 * document; true from the first render after that.
 *
 * The public routes are prerendered to HTML at build time and hydrated in the
 * browser (see scripts/prerender.mjs). Hydration requires the first client
 * render to produce exactly the markup the build produced, and some of this
 * site cannot promise that: the chat restores a thread from localStorage, types
 * its greeting unless reduced motion is on, and shows a mic only where the
 * browser has speech recognition. None of that is knowable at build time.
 *
 * Gate those on this instead of on `typeof window`. A `typeof window` check
 * gives the server one answer and the hydrating client another, which is the
 * mismatch itself. This gives both the same answer and then flips, so the
 * client-only piece mounts in a normal render right after hydration.
 *
 * `useSyncExternalStore` rather than an effect that sets state: React reads the
 * server snapshot during hydration and schedules the switch itself, with no
 * extra committed frame of the placeholder, and on a plain client render (dev,
 * Storybook, anything not prerendered) it is simply `true` from the start.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false)
}
