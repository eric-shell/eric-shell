import { useCallback, useMemo } from 'react'
import { AreaClosed, Bar, LinePath } from '@visx/shape'
import { curveMonotoneX } from '@visx/curve'
import { LinearGradient } from '@visx/gradient'
import { Group } from '@visx/group'
import { scaleLinear, scaleTime } from '@visx/scale'
import { ParentSize } from '@visx/responsive'
import { localPoint } from '@visx/event'
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip'
import { formatMonthDay } from '../lib/dateFormat'
import type { StatDay } from '@/../api/_lib/types'

/**
 * Daily visitors. Single series, so there is no legend — the caption names it.
 *
 * Colors are validated against the dark canvas (#111521), not flipped from the
 * light theme: `validate_palette.js --mode dark` shows every step of the brand
 * blue ramp falls below the chroma floor and "reads gray", which is exactly why
 * the old chart looked washed out. ACCENT is the same hue family pushed to a
 * chroma that clears the floor; the fill ramp DEEP→ACCENT passes --ordinal.
 */
// SVG paint accepts CSS custom properties, so these stay tied to the single
// definition in index.css rather than re-stating a hex the theme could drift from.
const ACCENT = 'var(--color-accent)'
const DEEP = 'var(--color-accent-deep)'
const SURFACE = 'var(--color-blue-950)'

interface Point {
  date: Date
  visitors: number
}

const getDate = (d: Point) => d.date
const getCount = (d: Point) => d.visitors

function Chart({ days, width, height }: { days: StatDay[]; width: number; height: number }) {
  const {
    showTooltip, hideTooltip, tooltipData, tooltipLeft = 0, tooltipTop = 0,
  } = useTooltip<Point>()

  // Portal, not an in-flow tooltip. The metrics row is only ~116px tall, and an
  // absolutely-positioned tooltip gets clamped inside that box — so a point near
  // the top or bottom of the plot had its tooltip clipped. Rendering into a
  // body-level portal bounds it by the viewport instead, and `detectBounds`
  // flips it to the other side of the cursor near an edge.
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    detectBounds: true,
    scroll: true,
  })

  // Leaves room for the axis band beneath the plot — a container that clips its
  // own axis labels is the classic dashboard-card scroll bug.
  const AXIS_H = 16
  const innerH = Math.max(0, height - AXIS_H)

  const data = useMemo<Point[]>(
    () => days.map(d => ({ date: new Date(d.date + 'T00:00:00'), visitors: d.visitors })),
    [days],
  )

  const xScale = useMemo(
    () => scaleTime({
      range: [0, width],
      domain: [data[0]?.date ?? new Date(), data[data.length - 1]?.date ?? new Date()],
    }),
    [data, width],
  )

  const yScale = useMemo(
    () => scaleLinear({
      range: [innerH, 0],
      // Always include zero so area height stays proportional to the value.
      domain: [0, Math.max(...data.map(getCount), 1)],
      nice: true,
    }),
    [data, innerH],
  )

  const handleMove = useCallback(
    (event: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>) => {
      const point = localPoint(event)
      if (!point || data.length === 0) return
      // Nearest point rather than exact hit: a 1px-wide date band is impossible
      // to land on, so the whole plot is the hit target.
      const x0 = xScale.invert(point.x).valueOf()
      let nearest = data[0]
      for (const d of data) {
        if (Math.abs(d.date.valueOf() - x0) < Math.abs(nearest.date.valueOf() - x0)) nearest = d
      }
      showTooltip({
        tooltipData: nearest,
        tooltipLeft: xScale(getDate(nearest)),
        tooltipTop: yScale(getCount(nearest)),
      })
    },
    [data, showTooltip, xScale, yScale],
  )

  if (width < 10 || data.length === 0) return null

  return (
    <div className="relative h-full w-full">
      <svg ref={containerRef} width={width} height={height} className="overflow-visible">
        <LinearGradient id="visitors-area" from={ACCENT} to={DEEP} fromOpacity={0.38} toOpacity={0.02} />

        <Group>
          <AreaClosed<Point>
            data={data}
            x={d => xScale(getDate(d))}
            y={d => yScale(getCount(d))}
            yScale={yScale}
            curve={curveMonotoneX}
            fill="url(#visitors-area)"
          />
          {/* 2px line, round join/cap — the fixed mark spec. */}
          <LinePath<Point>
            data={data}
            x={d => xScale(getDate(d))}
            y={d => yScale(getCount(d))}
            curve={curveMonotoneX}
            stroke={ACCENT}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {tooltipData && (
            <g>
              {/* Crosshair, hairline and solid — never dashed. */}
              <line
                x1={tooltipLeft} x2={tooltipLeft} y1={0} y2={innerH}
                stroke="#ffffff" strokeOpacity={0.25} strokeWidth={1}
              />
              {/* End-marker with a 2px surface ring so it stays legible where it
                  crosses the line. r >= 4 keeps it above the 8px minimum. */}
              <circle
                cx={tooltipLeft} cy={tooltipTop} r={5}
                fill={ACCENT} stroke={SURFACE} strokeWidth={2}
              />
            </g>
          )}

          <Bar
            width={width} height={innerH} fill="transparent"
            onMouseMove={handleMove}
            onTouchMove={handleMove}
            onMouseLeave={hideTooltip}
            onTouchEnd={hideTooltip}
          />
        </Group>
      </svg>

      {tooltipData && (
        <TooltipInPortal
          // Lift clear of the marker so the pointer never covers the value.
          top={tooltipTop - 12}
          left={tooltipLeft}
          style={{
            ...defaultStyles,
            background: 'color-mix(in oklch, var(--color-blue-950) 92%, transparent)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 8,
            color: '#fff',
            padding: '6px 10px',
            fontSize: 11,
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          }}
        >
          {/* Text wears an ink token; the colored mark beside it carries identity. */}
          <span className="font-semibold">{tooltipData.visitors}</span>
          <span className="opacity-60"> · {formatMonthDay(tooltipData.date.toISOString())}</span>
        </TooltipInPortal>
      )}
    </div>
  )
}

export default function VisitorsChart({ days }: { days: StatDay[] }) {
  if (days.length === 0) return null
  const total = days.reduce((sum, d) => sum + d.visitors, 0)
  const peak = Math.max(...days.map(d => d.visitors))

  return (
    <figure className="flex h-full w-full flex-col gap-1">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
          Visitors / day
        </span>
        <span className="text-[10px] text-white/70">
          <span className="font-semibold text-white/80">{total}</span> in {days.length}d
        </span>
      </figcaption>

      <div className="min-h-0 flex-1">
        <ParentSize debounceTime={0}>
          {({ width, height }) => <Chart days={days} width={width} height={height} />}
        </ParentSize>
      </div>

      <div className="flex shrink-0 justify-between text-[9px] tabular-nums text-white/55">
        <span>{formatMonthDay(days[0].date)}</span>
        <span>{formatMonthDay(days[days.length - 1].date)}</span>
      </div>

      {/* Values are never gated behind hover. */}
      <ul className="sr-only">
        <li>Peak {peak} visitors in a day.</li>
        {days.map(d => (
          <li key={d.date}>{formatMonthDay(d.date)}: {d.visitors} visitors</li>
        ))}
      </ul>
    </figure>
  )
}
