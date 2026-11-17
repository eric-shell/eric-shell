import { useEffect, useRef, useState } from 'react'

/**
 * Counts from 0 to `target` once `start` turns true. Renders `target` until
 * then, so the prerendered page and a reduced-motion visitor both see the real
 * number; the count only plays for someone watching it arrive.
 */
export function useCountUp(target: number, start: boolean, durationMs = 1400) {
  const [value, setValue] = useState(target)
  const played = useRef(false)

  useEffect(() => {
    if (!start || played.current) return
    played.current = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / durationMs)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    // Reset on cleanup so a re-run (StrictMode's double effect in dev) plays
    // the count again instead of leaving it stranded at 0.
    return () => { cancelAnimationFrame(raf); played.current = false; setValue(target) }
  }, [start, target, durationMs])

  return value
}
