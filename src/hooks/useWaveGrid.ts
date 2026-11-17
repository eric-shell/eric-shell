import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

/** How far each column drifts across the grid's pass through the viewport, in px. Odd columns lead, the middle lags. */
const DRIFT: Record<number, number[]> = { 1: [0], 2: [-36, 44], 3: [-50, 70, -20], 4: [-50, 70, -20, 40] }
/** Most the grid leans, in degrees, however fast the page is flung. */
const MAX_LEAN = 2.5

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Motion for the Work grid, all of it client-only and all of it off under
 * `prefers-reduced-motion`:
 *
 * - column drift: each column moves at its own speed as the grid scrolls
 *   through the viewport, so rows shear apart and settle (`--cv` per item,
 *   `--wp` on the grid, read by the `wave-grid` CSS through `translate`);
 * - lean: the whole grid skews a degree or two with scroll velocity and
 *   relaxes when the page stops (`--skew`);
 * - tilt: the card under the pointer tilts toward it and its glow follows
 *   (`--tx` `--ty` `--mx` `--my` `--ax` `--ay` on the card's link);
 * - reflow: when the visible set changes, cards that stay slide from their old
 *   position to their new one rather than jumping (FLIP on each item's link).
 *
 * Returns the column count, for staggering the flip-in entrance by column.
 */
export function useWaveGrid(gridRef: RefObject<HTMLElement | null>, itemsKey: string) {
  const [cols, setCols] = useState(1)
  const positions = useRef(new Map<string, { x: number; y: number }>())

  // Column count and per-item drift. Re-run when the visible set changes, since
  // an item's column is its position among the visible ones.
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const measure = () => {
      const n = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1
      setCols(n)
      const drift = reducedMotion() ? [0] : DRIFT[Math.min(n, 4)]
      Array.from(grid.children).forEach((li, i) => {
        (li as HTMLElement).style.setProperty('--cv', String(drift[i % n] ?? 0))
      })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [gridRef, itemsKey])

  // FLIP: slide surviving cards from where they were.
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const next = new Map<string, { x: number; y: number }>()
    for (const li of Array.from(grid.children) as HTMLElement[]) {
      const key = li.dataset.key
      if (!key) continue
      const now = { x: li.offsetLeft, y: li.offsetTop }
      next.set(key, now)
      const before = positions.current.get(key)
      const card = li.firstElementChild as HTMLElement | null
      if (!before || !card || reducedMotion()) continue
      const dx = before.x - now.x
      const dy = before.y - now.y
      if (dx || dy) {
        card.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
          { duration: 650, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
        )
      }
    }
    positions.current = next
  }, [gridRef, itemsKey])

  // Drift and lean, on one rAF loop that only runs while the grid is on screen.
  useEffect(() => {
    const grid = gridRef.current
    if (!grid || reducedMotion()) return
    let raf = 0
    let visible = false
    let lastY = window.scrollY
    let velocity = 0
    const tick = () => {
      raf = 0
      if (!visible) return
      const dy = window.scrollY - lastY
      lastY = window.scrollY
      velocity += (dy - velocity) * 0.15
      const r = grid.getBoundingClientRect()
      const through = Math.max(0, Math.min(1, (window.innerHeight - r.top) / (window.innerHeight + r.height)))
      grid.style.setProperty('--wp', through.toFixed(4))
      grid.style.setProperty('--skew', `${Math.max(-MAX_LEAN, Math.min(MAX_LEAN, velocity * 0.07)).toFixed(3)}deg`)
      // Keep ticking until the lean has settled, then stop until the next scroll.
      if (Math.abs(velocity) > 0.05) raf = requestAnimationFrame(tick)
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick) }
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) kick() })
    io.observe(grid)
    window.addEventListener('scroll', kick, { passive: true })
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', kick)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [gridRef])

  // Pointer tilt, on hover-capable pointers only.
  useEffect(() => {
    const grid = gridRef.current
    if (!grid || reducedMotion() || !window.matchMedia('(hover: hover)').matches) return
    const VARS = ['--tx', '--ty', '--ax', '--ay']
    const move = (e: PointerEvent) => {
      const card = (e.target as Element).closest<HTMLElement>('li > a')
      if (!card || !grid.contains(card)) return
      const r = card.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      card.style.setProperty('--tx', `${((x - 0.5) * 12).toFixed(2)}deg`)
      card.style.setProperty('--ty', `${((0.5 - y) * 10).toFixed(2)}deg`)
      card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
      card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
      card.style.setProperty('--ax', `${((x - 0.5) * 14).toFixed(1)}px`)
      card.style.setProperty('--ay', `${((y - 0.5) * 10).toFixed(1)}px`)
    }
    const out = (e: PointerEvent) => {
      const card = (e.target as Element).closest<HTMLElement>('li > a')
      if (card && !card.contains(e.relatedTarget as Node | null)) VARS.forEach(v => card.style.removeProperty(v))
    }
    grid.addEventListener('pointermove', move)
    grid.addEventListener('pointerout', out)
    return () => {
      grid.removeEventListener('pointermove', move)
      grid.removeEventListener('pointerout', out)
    }
  }, [gridRef])

  return cols
}
