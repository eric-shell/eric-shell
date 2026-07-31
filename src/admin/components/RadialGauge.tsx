import { useEffect, useId, useState } from 'react'
import { ACCENT, ACCENT_DEEP, GLOW, PREFERS_REDUCED_MOTION, share } from '../lib/chartTheme'

const R = 42
const CIRCUMFERENCE = 2 * Math.PI * R

/**
 * A single proportion, drawn as a ring with the value in the middle.
 *
 * This is a **meter**, not a two-slice pie. The reader is not asked to compare
 * two wedges against each other — there is one arc measured against its own
 * track, which is the form the dataviz skill prescribes for "a single ratio
 * against a limit". The track is a dim step of the same hue (blue-on-blue), so
 * the state reads across the whole ring rather than only where it is filled.
 *
 * The number in the middle is the real answer; the arc is the glanceable
 * version of it. Nothing is gated behind the graphic.
 */
export default function RadialGauge({ value, total, unit, caption }: {
  /** Numerator. */
  value: number
  /** Denominator. Zero renders the empty state, never a divide-by-zero arc. */
  total: number
  /** What the numerator counts, e.g. "returned". */
  unit: string
  /** One line of context under the ring. */
  caption: string
}) {
  const gradientId = useId()
  const pct = share(value, total)

  // Draw-in on mount. Skipped outright under prefers-reduced-motion rather than
  // transitioned-to-zero-duration, so there is no one-frame jump from empty.
  const [drawn, setDrawn] = useState(PREFERS_REDUCED_MOTION)
  useEffect(() => {
    if (PREFERS_REDUCED_MOTION) return
    const id = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const offset = CIRCUMFERENCE * (1 - (drawn ? pct / 100 : 0))

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2">
      <div className="relative w-full max-w-34">
        <svg
          viewBox="0 0 100 100"
          className="w-full"
          role="img"
          aria-label={`${pct}% — ${value} of ${total} ${unit}.`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor={ACCENT_DEEP} />
              <stop offset="100%" stopColor={ACCENT} />
            </linearGradient>
          </defs>

          {/* Track: the unfilled remainder, a dim step of the arc's own hue. */}
          <circle
            cx="50" cy="50" r={R}
            fill="none"
            stroke={ACCENT}
            strokeOpacity={0.14}
            strokeWidth={9}
          />

          {/* Value arc. Starts at 12 o'clock; round cap so a tiny share still
              renders as a mark instead of vanishing to a hairline. */}
          <circle
            cx="50" cy="50" r={R}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
            style={{
              filter: GLOW,
              transition: PREFERS_REDUCED_MOTION ? undefined : 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </svg>

        {/* Hero value as HTML, not SVG text: it inherits the site's sans and its
            proportional figures. tabular-nums would make a value like 12% look
            loose at this size. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-sans text-[26px] font-semibold leading-none text-white">{pct}%</span>
          <span className="mt-1 text-[10px] text-white/70">{value} of {total}</span>
        </div>
      </div>

      <p className="text-[10px] leading-snug text-white/55 text-center">{caption}</p>
    </div>
  )
}
