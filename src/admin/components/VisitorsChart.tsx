import { useState } from 'react'
import { formatMonthDay } from '../lib/dateFormat'
import type { StatDay } from '@/../api/_lib/types'

/**
 * Daily visitors, last N days. Single series, so there is no legend — the tile's
 * label says what is plotted.
 *
 * Built from divs rather than SVG on purpose: the previous SVG version used
 * `preserveAspectRatio="none"`, which stretches non-uniformly and so distorted
 * both the corner radius and the gap between bars. Flexbox gives exact 2px
 * surface gaps and a true 4px data-end at any width.
 *
 * Colors are the validated ordinal pair from the brand ramp — blue-400 for the
 * de-emphasis body, blue-700 for the current period. (`validate_palette.js`
 * --ordinal: monotone L, ΔL >= 0.06, light end 2.78:1 vs white, hue spread 3°.)
 */
export default function VisitorsChart({ days }: { days: StatDay[] }) {
  const [hover, setHover] = useState<number | null>(null)
  if (days.length === 0) return null

  const max = Math.max(...days.map(d => d.visitors), 1)
  const total = days.reduce((sum, d) => sum + d.visitors, 0)
  const lastIndex = days.length - 1
  const active = hover ?? lastIndex
  const activeDay = days[active]

  return (
    <figure className="flex h-full w-full flex-col justify-between gap-1.5">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-950/50">
          Visitors / day
        </span>
        {/* Direct label, selectively: the hovered bar, else the current period.
            Text wears an ink token, never the series color. */}
        <span className="text-[10px] text-blue-950/70">
          <span className="font-semibold text-blue-950">{activeDay.visitors}</span>
          {' · '}
          {formatMonthDay(activeDay.date)}
          {active === lastIndex && <span className="text-blue-950/40"> (latest)</span>}
        </span>
      </figcaption>

      <div
        className="relative flex flex-1 items-end gap-[2px]"
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`Daily visitors over the last ${days.length} days, ${total} total. Peak ${max}.`}
      >
        {days.map((d, i) => {
          const isActive = i === active
          return (
            // The column is the hit target, not the bar — a 3-visitor bar is a
            // few pixels tall and would be near-impossible to hover directly.
            <div
              key={d.date}
              onMouseEnter={() => setHover(i)}
              className="group flex h-full flex-1 cursor-default items-end justify-center"
            >
              <div
                // 4px rounded data-end, square at the baseline. Height is a
                // percentage of the tallest bar; min-height keeps a zero-ish day
                // visible as a hairline rather than vanishing.
                //
                // Capped at 24px and centred in its slot: bars must never fill
                // the band, or the chart reads as a thick saturated block. The
                // leftover is deliberate air.
                className={`w-full max-w-[24px] rounded-t-[4px] transition-colors ${
                  isActive ? 'bg-blue-700' : 'bg-blue-400 group-hover:bg-blue-600'
                }`}
                style={{ height: `max(2px, ${(d.visitors / max) * 100}%)` }}
              />
            </div>
          )
        })}
      </div>

      {/* Hairline baseline, one step off the surface, solid — never dashed. */}
      <div className="h-px w-full shrink-0 bg-blue-950/10" />

      <div className="flex shrink-0 justify-between text-[9px] tabular-nums text-blue-950/40">
        <span>{formatMonthDay(days[0].date)}</span>
        <span>{formatMonthDay(days[lastIndex].date)}</span>
      </div>

      {/* Values are never gated behind hover: the same numbers are readable by
          assistive tech here, so the tooltip only ever enhances. */}
      <ul className="sr-only">
        {days.map(d => (
          <li key={d.date}>{formatMonthDay(d.date)}: {d.visitors} visitors</li>
        ))}
      </ul>
    </figure>
  )
}
