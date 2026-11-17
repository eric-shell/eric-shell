import { useCallback } from 'react'

/** Cleared on leave. Not `--mx` `--my`: the glow fades out where the pointer left it. */
const TILT_VARS = ['--tx', '--ty', '--ax', '--ay'] as const

/** Tilt is for a hover-capable pointer, and never under reduced motion. */
export const canTilt = () =>
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.matchMedia('(hover: hover)').matches

/**
 * Point `el` toward the pointer: `--tx` `--ty` for the `card-lift` tilt, `--mx`
 * `--my` for a `card-glow`, `--ax` `--ay` for a Card's arrow. `strength` scales
 * the angles; 1 is the Work card's ±6° by ±5°, sized for a ~340px card. A bigger
 * surface wants less, because the same angle swings its far edge further.
 */
export function tiltToward(el: HTMLElement, e: PointerEvent, strength = 1) {
  const r = el.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width
  const y = (e.clientY - r.top) / r.height
  el.style.setProperty('--tx', `${((x - 0.5) * 12 * strength).toFixed(2)}deg`)
  el.style.setProperty('--ty', `${((0.5 - y) * 10 * strength).toFixed(2)}deg`)
  el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
  el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
  el.style.setProperty('--ax', `${((x - 0.5) * 14).toFixed(1)}px`)
  el.style.setProperty('--ay', `${((y - 0.5) * 10).toFixed(1)}px`)
}

/** Settle `el` back to flat; `card-lift`'s transition eases it there. */
export function clearTilt(el: HTMLElement) {
  TILT_VARS.forEach(v => el.style.removeProperty(v))
}

/**
 * The Work card's pointer tilt for one standalone surface (the hero chat, the
 * contact form). Returns a ref callback; the element also needs `card-lift` and
 * a `transition-transform`. Client-only by construction: nothing is set until a
 * pointer moves, so the prerendered markup is untouched.
 *
 * A grid of cards does not use this: `useWaveGrid` delegates one listener for
 * the whole grid instead of one per card.
 */
export function usePointerTilt<T extends HTMLElement>(strength = 1) {
  return useCallback((el: T | null) => {
    if (!el || !canTilt()) return
    const move = (e: PointerEvent) => tiltToward(el, e, strength)
    const leave = () => clearTilt(el)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      clearTilt(el)
    }
  }, [strength])
}
