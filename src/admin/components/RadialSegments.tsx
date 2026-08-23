import { useEffect, useState } from 'react'
import { ACCENT, PREFERS_REDUCED_MOTION, RING_R, RING_STROKE, glowFor } from '../lib/chartTheme'

export interface RadialSegment {
  key: string
  /** Share of `total`. Segments are laid out proportionally to this. */
  value: number
  color: string
}

/**
 * A full ring divided proportionally — the whole circle is `total`, and each
 * segment takes the share of the circumference its value is worth.
 *
 * The one circular instrument in the insight row — all three cards draw it, at
 * the shared radius and stroke in chartTheme.
 *
 * **ONLY EVER FOR A REAL PARTITION.** Every segment must be mutually exclusive
 * and the set must sum to `total`, because that is precisely what the picture
 * asserts. Cumulative or overlapping measures cannot go in here: they would
 * either overflow the circle or have to be renormalised into shares of a
 * quantity nobody asked about. That constraint is why Scroll depth is charted
 * as deepest-point-reached buckets rather than as its "reached at least N%"
 * stages, and why What visitors did sorts its three overlapping actions into an
 * exclusive ladder before drawing them.
 *
 * Keep it to a handful of segments — angle is read less accurately than length,
 * so this earns its place where the shape of a split is the point, never as a
 * way to rank things.
 */

/**
 * Radius and thickness come from chartTheme so this and the Action rate gauge
 * are the same instrument, not two rings that happen to look similar.
 */
const R = RING_R
const STROKE = RING_STROKE
/**
 * Angular space between two segments. Bare canvas, doing the job a stroke would
 * otherwise do — a lighter separator would add data-weight ink that isn't data.
 *
 * The gaps come out of the circle before the shares are laid out, so a segment
 * is its exact fraction of `360 - n * GAP` rather than of 360. With a handful
 * of segments that is under 2% of the ring and it keeps every gap identical;
 * taking the gap out of each segment instead would shrink small ones twice.
 */
const GAP = 2
/**
 * Smallest arc a non-zero value may draw. Butt caps mean a sub-degree sliver is
 * simply not visible, and "one session did this" must never render identically
 * to "none did" — the job `minWidth: 3` does on the rank lists.
 */
const MIN_SWEEP = 3

/** Point on the ring at `deg` clockwise from twelve o'clock. */
function polar(deg: number): readonly [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180
  return [50 + R * Math.cos(rad), 50 + R * Math.sin(rad)] as const
}

/** Stroked arc between two angles. Never filled — the stroke is the mark. */
function arc(from: number, to: number): string {
  const [x1, y1] = polar(from)
  const [x2, y2] = polar(to)
  const large = Math.abs(to - from) > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`
}

export default function RadialSegments({ segments, total, label, children }: {
  segments: RadialSegment[]
  /** The whole. Segments are shares of this, not of each other's sum. */
  total: number
  /** Accessible name. Values live in the caller's list, not in the graphic. */
  label: string
  /** Centre content — the same slot the gauge puts its headline number in. */
  children?: React.ReactNode
}) {
  // Draw-in on mount. Skipped outright under prefers-reduced-motion rather
  // than transitioned at zero duration, so there is no one-frame jump from
  // empty.
  const [drawn, setDrawn] = useState(PREFERS_REDUCED_MOTION)
  useEffect(() => {
    if (PREFERS_REDUCED_MOTION) return
    const id = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(id)
  }, [])

  if (segments.length === 0 || total <= 0) return null

  // Only segments that draw claim a gap. A zero-value bucket takes no arc, so
  // reserving a gap for it would leave a notch with nothing on either side.
  const drawable = segments.filter(s => s.value > 0)
  const usable = 360 - GAP * drawable.length

  // Prefix sums rather than a running total across the map: a mutable
  // accumulator in render is what the React compiler rejects, and at a handful
  // of segments the quadratic walk is free.
  const laid = drawable.map((seg, i) => {
    const before = drawable.slice(0, i).reduce((sum, s) => sum + s.value, 0)
    // Twelve o'clock is 0deg in `polar`, and that is where the gauge's arc
    // starts too — the two instruments must open from the same point.
    const from = (before / total) * usable + GAP * i
    const sweep = Math.max(MIN_SWEEP, (seg.value / total) * usable)
    return { ...seg, from, sweep }
  })

  return (
    <div className="relative w-full">
      <svg
        viewBox="0 0 100 100"
        // The ring reaches 46.5 units of a 50-unit half-box, so the glow falls
        // outside the viewBox and an `overflow: hidden` root would shave it flat.
        className="w-full overflow-visible"
        role="img"
        aria-label={label}
      >
        {/* The unfilled circle underneath. With a true partition the segments
            cover it, so it shows only through the gaps — which is exactly what
            makes the gaps read as part of the instrument rather than as holes,
            and it is the same track the gauge draws. */}
        <circle
          cx="50" cy="50" r={R}
          fill="none"
          stroke={ACCENT}
          strokeOpacity={0.14}
          strokeWidth={STROKE}
        />

        {laid.map((seg, i) => (
          <path
            key={seg.key}
            // The path is the segment's whole arc; the dash reveals it, growing
            // from its own start. Animating the geometry instead (interpolating
            // `d`) is not portable — CSS transitions on `d` are patchy across
            // engines, where `stroke-dashoffset` is universal.
            //
            // `pathLength` renormalises the path to 100 units for dash
            // arithmetic, so the offset is a percentage and none of this has to
            // know the arc's real length.
            d={arc(seg.from, seg.from + seg.sweep)}
            pathLength={100}
            fill="none"
            stroke={seg.color}
            strokeWidth={STROKE}
            strokeDasharray={100}
            strokeDashoffset={drawn ? 0 : 100}
            // Butt, not round. A round cap overhangs its arc end by half the
            // stroke — 4.5 units here, against a gap of only ~1.5 units of arc —
            // so adjacent segments would bleed across every seam and the
            // division would be the first thing lost.
            strokeLinecap="butt"
            style={{
              // 3px. The seams are barely two rendered pixels on this card, so
              // the panel's 6px default reaches straight across them.
              filter: glowFor(seg.color, 3),
              transition: PREFERS_REDUCED_MOTION
                ? undefined
                : 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)',
              // Clockwise from the top, so the ring assembles in the order the
              // legend lists it.
              transitionDelay: PREFERS_REDUCED_MOTION ? undefined : `${i * 90}ms`,
            }}
          />
        ))}
      </svg>

      {children && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}
