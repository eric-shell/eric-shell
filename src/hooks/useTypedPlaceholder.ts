import { useEffect, useState } from 'react'

const TYPE_MS = 55
const DELETE_MS = 22
/** How long a finished phrase sits before it starts erasing. */
const HOLD_MS = 1900
/** Beat between one phrase clearing and the next starting. */
const GAP_MS = 400
/** Lead-in so the panel has settled before the first character lands. */
const START_MS = 600

/**
 * Joins phrases into a single effect dependency — see the effect below. A
 * control character, so it can never collide with prose the way a space would.
 */
const SEP = '\u0000'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

/**
 * Types a rotating list of phrases out one character at a time, for use as a
 * live `placeholder`. Returns `null` when it has nothing to say — while
 * disabled, with no phrases, or under `prefers-reduced-motion` — so the caller
 * can fall back to its static placeholder rather than render an empty field.
 *
 * Callers should pass `enabled: false` the moment the placeholder stops being
 * visible (the field has a value, a conversation has started). The animation
 * re-renders its consumer ~20×/s, and none of that is worth paying for behind
 * text the visitor cannot see.
 */
export function useTypedPlaceholder(phrases: string[], enabled = true): string | null {
  // Read once: a visitor who changes this setting mid-visit gets it on reload,
  // and a live query here would be a subscription for no practical gain.
  const [reduced] = useState(prefersReducedMotion)

  // Depending on the joined string rather than the array keeps a caller's
  // inline `['…', '…']` literal — a new identity on every render — from
  // restarting the animation on every keystroke.
  const key = phrases.join(SEP)
  const active = enabled && !reduced && key.length > 0

  // The run token pairs the text with the settings that produced it, so a
  // change of phrases (or a pause and resume) resets to empty during render
  // rather than through a setState in the effect — no stale half-typed phrase
  // flashes for the length of START_MS, and no cascading render.
  const run = `${active}${SEP}${key}`
  const [state, setState] = useState({ run, text: '' })
  const text = state.run === run ? state.text : ''

  useEffect(() => {
    if (!active) return
    const list = key.split(SEP)

    let phrase = 0
    let chars = 0
    let phase: 'typing' | 'holding' | 'deleting' = 'typing'
    let timer = 0
    const show = (value: string) => setState({ run, text: value })

    function tick() {
      const current = list[phrase]

      if (phase === 'typing') {
        show(current.slice(0, ++chars))
        if (chars < current.length) {
          timer = window.setTimeout(tick, TYPE_MS)
        } else {
          phase = 'holding'
          timer = window.setTimeout(tick, HOLD_MS)
        }
      } else if (phase === 'holding') {
        phase = 'deleting'
        timer = window.setTimeout(tick, DELETE_MS)
      } else {
        show(current.slice(0, --chars))
        if (chars > 0) {
          timer = window.setTimeout(tick, DELETE_MS)
        } else {
          phrase = (phrase + 1) % list.length
          phase = 'typing'
          timer = window.setTimeout(tick, GAP_MS)
        }
      }
    }

    timer = window.setTimeout(tick, START_MS)
    return () => clearTimeout(timer)
  }, [active, key, run])

  return active ? text : null
}
