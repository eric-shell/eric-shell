import { useEffect, useState, type RefObject } from 'react'

/**
 * One phrase, or its variants from longest to shortest: the longest that fits
 * the field is the one shown.
 */
export type Phrase = string | readonly string[]

/** Keeps the last glyph off the field's padding edge, where it read as clipped. */
const SLACK_PX = 2

let canvas: CanvasRenderingContext2D | null | undefined

function context(): CanvasRenderingContext2D | null {
  if (canvas === undefined) canvas = document.createElement('canvas').getContext('2d')
  return canvas
}

/**
 * The phrases that fit one line of a text field at its current width, for a
 * live placeholder (see `useTypedPlaceholder`). A placeholder wider than its
 * field wraps in a textarea and clips in an input, and the composer's controls
 * leave a phone about 160px of line, so a prompt written for the desktop's
 * 400px would type itself onto a second line. Each phrase is measured in the
 * field's own font: the longest variant that fits is kept, and a phrase with
 * none that fits is left out rather than shown broken.
 *
 * Re-measured whenever the field changes size and once the web font has
 * loaded, since the fallback font's widths are not the real ones. Empty until
 * the first measure (and on the server), which reads as "no animation" to
 * `useTypedPlaceholder`, so the static placeholder shows in the meantime.
 *
 * Pass `enabled` as whether the field is mounted: a field that unmounts and
 * comes back is a new element, and only a change of `enabled` re-attaches.
 */
export function useFittingPhrases(
  ref: RefObject<HTMLTextAreaElement | HTMLInputElement | null>,
  phrases: readonly Phrase[],
  enabled = true,
): string[] {
  // Keyed on the content, not the array: callers pass inline literals.
  const key = JSON.stringify(phrases)
  const [fitting, setFitting] = useState<string[]>([])

  useEffect(() => {
    const el = ref.current
    const ctx = context()
    if (!enabled || !el || !ctx) return
    const list = (JSON.parse(key) as Phrase[]).map(p => (typeof p === 'string' ? [p] : p))

    let shown = ''
    const measure = () => {
      const cs = getComputedStyle(el)
      const room = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - SLACK_PX
      // Built from the longhands: Firefox leaves the computed `font` shorthand empty.
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      if ('letterSpacing' in ctx) ctx.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing
      const next = list.flatMap(variants => variants.find(v => ctx.measureText(v).width <= room) ?? [])
      // The field resizes as the visitor types; only a different answer re-renders.
      const joined = next.join('\n')
      if (joined === shown) return
      shown = joined
      setFitting(next)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    let live = true
    document.fonts?.ready.then(() => { if (live) measure() })
    document.fonts?.addEventListener('loadingdone', measure)
    return () => {
      live = false
      observer.disconnect()
      document.fonts?.removeEventListener('loadingdone', measure)
    }
  }, [ref, key, enabled])

  return fitting
}
