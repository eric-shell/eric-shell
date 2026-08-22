import { useCallback, useMemo } from 'react'
import { twMerge } from 'tailwind-merge'
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip'
import { TOOLTIP_STYLE, formatHour, localHourOffset, magnitudeStep } from '../lib/chartTheme'
import { ChartEmpty } from './ChartFrame'
import type { HourRow } from '@/../api/_lib/insights-types'

interface Column {
  displayHour: number
  views: number
}

/**
 * Half the widest readout this tooltip can draw — "15 views · 11pm UTC" at
 * 11px, rounded up. Used to keep a centred tooltip inside the card at hour 0
 * and hour 23. A constant rather than a measurement: the content is two short
 * numbers and a fixed vocabulary, so its width is knowable, and measuring would
 * mean a layout read on every pointer move.
 */
const TIP_HALF = 62

/**
 * Page views by hour of day — "when does traffic actually arrive?"
 *
 * One series, painted by `magnitudeStep` — the same deep-to-bright ramp behind
 * Scroll depth, Viewport mix, and the three rank lists — keyed to each hour's
 * share of the peak.
 *
 * TIME ZONES. The aggregate buckets in UTC because Postgres has no idea what
 * the reader's clock says. The shift to local hours happens here — but only
 * when the reader's offset is a whole number of hours. In a half-hour zone
 * (India, Nepal, parts of Australia) a UTC bucket cannot be moved without
 * misplacing counts, so the axis honestly says UTC instead.
 */
export default function HourlyActivity({ hourly }: { hourly: HourRow[] }) {
  const offset = localHourOffset()

  const columns = useMemo<Column[]>(() => {
    const byHour = new Map(hourly.map(h => [h.hour, h.views]))
    // Display hour i (local, or UTC when the offset isn't whole hours) reads the
    // UTC bucket it came from.
    return Array.from({ length: 24 }, (_, displayHour) => {
      const utcHour = ((displayHour - (offset ?? 0)) % 24 + 24) % 24
      return { displayHour, views: byHour.get(utcHour) ?? 0 }
    })
  }, [hourly, offset])

  const {
    showTooltip, hideTooltip, tooltipData, tooltipLeft = 0, tooltipTop = 0,
  } = useTooltip<Column>()

  // A portal, for the same reason VisitorsChart uses one: an absolutely
  // positioned tooltip is bounded by the card, and this card is 72px of plot on
  // a phone — a readout above the peak column would be clipped by its own panel.
  //
  // `detectBounds` is deliberately OFF, though. It treats the anchor as a cursor
  // and lays the tooltip down-and-right of it, flipping near an edge — which put
  // the readout 58px to the right of the column it described, about four columns
  // of drift on a 24-column strip, and flipped it to the left on hour 23. On a
  // bar chart the tooltip belongs over its own mark, so the centring and the
  // clamp are done here instead, where they are deterministic.
  const { containerRef, containerBounds, TooltipInPortal } = useTooltipInPortal({
    detectBounds: false,
    scroll: true,
  })

  /**
   * Bound to `pointermove` on each column, not `pointerenter`.
   *
   * `pointerenter` fires exactly once per boundary crossing, and on a 24-column
   * strip with a gap between every pair there are a lot of boundaries. Crossing
   * into the gap fires leave on the column behind (hiding the readout), and the
   * matching enter on the column ahead does not reliably arrive — so that column
   * sat blank until you left it and came back. Measured over a slow sweep of the
   * full strip: the pointer was over a bar and the tooltip was absent in 66 of
   * 101 samples. It looked exactly like "it only works on the first one".
   *
   * `pointermove` has no such failure mode: it fires on every move and it
   * bubbles, so the wrapper hears it whether the pointer is over the column or
   * over the bar inside it. The guard below keeps it to one state update per
   * column rather than one per pixel.
   */
  const handleMove = useCallback(
    (col: Column) => (e: React.PointerEvent<HTMLDivElement>) => {
      // Already showing this hour — nothing to do. Without this, every pointer
      // move would set state and re-render the strip.
      if (tooltipData?.displayHour === col.displayHour) return

      // Positioned off the BAR, not the full-height column: the readout sits
      // just above the mark it describes and rises and falls with it. The column
      // is the hit target, which is a different job.
      const bar = e.currentTarget.firstElementChild
      if (!bar) return
      const r = bar.getBoundingClientRect()
      const centre = r.left - containerBounds.left + r.width / 2

      showTooltip({
        tooltipData: col,
        // The tooltip is centred on this x by a transform, so an anchor within
        // TIP_HALF of either end would hang off the card — and off the page's
        // gutter with it. Hours 1–22 are exact; only the two end columns are
        // nudged, and by less than the drift this replaced.
        tooltipLeft: Math.min(
          Math.max(centre, TIP_HALF),
          Math.max(TIP_HALF, containerBounds.width - TIP_HALF),
        ),
        tooltipTop: r.top - containerBounds.top,
      })
    },
    [containerBounds.left, containerBounds.top, containerBounds.width, showTooltip, tooltipData],
  )

  const max = Math.max(...columns.map(c => c.views), 0)
  const zone = offset === null ? 'UTC' : 'local time'

  if (max === 0) return <ChartEmpty>No page views in this window.</ChartEmpty>

  const peak = columns.reduce((a, b) => (b.views > a.views ? b : a))

  return (
    <>
      <div ref={containerRef} className="relative flex flex-1 flex-col gap-1">
        {/* The whole column is the hit target, not the few-pixel bar. A
            24-column strip cannot give each mark a 24px-wide target, so the
            column's full height does the work instead — and every value is in
            the screen-reader list below regardless. */}
        {/* Taller and more gapped as the card widens: this sits full width in
            the insight grid, where 24 columns get wide enough that a 1px gutter
            reads as one solid block and 72px of height reads as a flat strip. */}
        {/* Hiding is the strip's job, not each column's. A per-column
            `pointerleave` fires every time the pointer crosses one of the 23
            gaps, which is what made the readout flicker off mid-strip; leaving
            the strip is the only moment it should actually go away. */}
        <div
          className="flex h-18 items-end gap-px sm:gap-0.5 xl:h-24 xl:gap-1"
          aria-hidden="true"
          onPointerLeave={hideTooltip}
        >
          {columns.map(col => (
            <div
              key={col.displayHour}
              // The wash is what makes the hit target visible: it fills the
              // column's full height, so the reader can see they do not have to
              // land on a 4px bar. It doubles as the "the mark responded"
              // signal — a flat full-opacity fill has no room to lighten.
              //
              // Driven off the tooltip's own state rather than CSS `:hover`, so
              // the wash and the readout can never disagree about which hour is
              // being pointed at.
              className={twMerge(
                'flex h-full min-w-0 flex-1 items-end rounded-sm transition-colors',
                tooltipData?.displayHour === col.displayHour && 'bg-white/6',
              )}
              onPointerMove={handleMove(col)}
              // Touch taps do not always produce a `pointermove`, so the enter
              // still carries the tap case. The guard in `handleMove` makes the
              // double binding free.
              onPointerEnter={handleMove(col)}
            >
              <div
                className="w-full rounded-t-[3px] transition-[height] duration-500 motion-reduce:transition-none"
                style={{
                  // An empty hour keeps a 2px stub so the reader can see the
                  // hour exists and was quiet, rather than guessing at a gap.
                  height: col.views === 0 ? 2 : `${Math.max(6, (col.views / max) * 100)}%`,
                  // One flat colour per bar, off the panel's shared magnitude
                  // ramp: the peak hour is ACCENT, the quietest measured hour
                  // sits near ACCENT_DEEP, everything else interpolates. Zero
                  // comes back as ACCENT_DEEP and is dimmed below.
                  //
                  // Flat is the load-bearing word. A per-bar *gradient* was
                  // tried and removed — these columns are short, so the dark end
                  // is what you actually see, and the strip came out navy where
                  // its neighbours are cyan. Each bar is one solid step.
                  //
                  // Still no separate peak emphasis: the peak is the brightest
                  // step because it is the tallest, which is the ramp doing its
                  // job, not a second treatment layered on top.
                  background: magnitudeStep(col.views, max),
                  // Marks a state rather than de-emphasising data: a quiet hour
                  // is not a small value. Same treatment ViewportMix gives a
                  // zero-count swatch — but lifted from 0.22, because the stub
                  // is now ACCENT_DEEP rather than ACCENT and at 0.22 a 2px line
                  // of it is indistinguishable from the canvas.
                  opacity: col.views === 0 ? 0.45 : 1,
                }}
              />
            </div>
          ))}
        </div>

        {/* Hairline solid baseline — never dashed. */}
        <div className="h-px w-full bg-white/15" />

        {/* Four equal cells of six hours each, so a tick sits at the start of
            the column it names. `justify-between` would have pinned 6pm to the
            right edge, three hours from where hour 18 actually is.

            10px/70, matching the axis and row labels the other cards use — at
            9px/60 this was the faintest, smallest type in the panel, which is
            the other half of why the card read as a stranger. */}
        <div className="grid grid-cols-4 text-[10px] tabular-nums text-white/70" aria-hidden="true">
          {[0, 6, 12, 18].map(h => <span key={h}>{formatHour(h)}</span>)}
        </div>

        {tooltipData && (
          <TooltipInPortal
            top={tooltipTop}
            left={tooltipLeft}
            // visx offsets by 10px on each axis by default, which is cursor
            // behaviour. The anchor here is the bar's top-centre and the
            // transform below does the placing, so both are zeroed.
            offsetLeft={0}
            offsetTop={0}
            style={{
              ...defaultStyles,
              ...TOOLTIP_STYLE,
              // Centred on the column, sitting entirely above the bar. Anchored
              // by its own bottom edge rather than its top, so the readout never
              // covers the mark it is reporting however tall that bar is.
              transform: 'translate(-50%, calc(-100% - 8px))',
            }}
          >
            {/* Value leads, label follows — the reader already has the hour
                from where they are pointing and wants the number. */}
            <span className="font-semibold">
              {tooltipData.views} {tooltipData.views === 1 ? 'view' : 'views'}
            </span>
            <span className="opacity-60">
              {' · '}{formatHour(tooltipData.displayHour)}
              {/* Only when the axis is NOT local. "Local time" on all 24 hovers
                  is noise; UTC is the surprising case a reader must be told
                  about, and it is the one the axis cannot show on its own. */}
              {offset === null && ' UTC'}
            </span>
          </TooltipInPortal>
        )}
      </div>

      {/* The table equivalent, and the reason the strip above is `aria-hidden`
          rather than 24 focus stops: it already carries every hour and every
          count in reading order, so nothing here is gated behind a pointer. */}
      <ul className="sr-only">
        <li>Hours shown in {zone}. Busiest hour {formatHour(peak.displayHour)} with {peak.views} views.</li>
        {columns.map(col => (
          <li key={col.displayHour}>{formatHour(col.displayHour)}: {col.views} views.</li>
        ))}
      </ul>
    </>
  )
}
