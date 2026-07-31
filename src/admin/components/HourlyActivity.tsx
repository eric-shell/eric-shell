import { useMemo } from 'react'
import { ACCENT, ACCENT_DEEP, GLOW, formatHour, localHourOffset } from '../lib/chartTheme'
import { ChartEmpty } from './ChartFrame'
import type { HourRow } from '@/../api/_lib/insights-types'

/**
 * Page views by hour of day — "when does traffic actually arrive?"
 *
 * One series, so length carries magnitude and a single accent carries the mark;
 * an ordinal ramp here would only re-encode the bar heights.
 *
 * TIME ZONES. The aggregate buckets in UTC because Postgres has no idea what
 * the reader's clock says. The shift to local hours happens here — but only
 * when the reader's offset is a whole number of hours. In a half-hour zone
 * (India, Nepal, parts of Australia) a UTC bucket cannot be moved without
 * misplacing counts, so the axis honestly says UTC instead.
 */
export default function HourlyActivity({ hourly }: { hourly: HourRow[] }) {
  const offset = localHourOffset()

  const columns = useMemo(() => {
    const byHour = new Map(hourly.map(h => [h.hour, h.views]))
    // Display hour i (local, or UTC when the offset isn't whole hours) reads the
    // UTC bucket it came from.
    return Array.from({ length: 24 }, (_, displayHour) => {
      const utcHour = ((displayHour - (offset ?? 0)) % 24 + 24) % 24
      return { displayHour, views: byHour.get(utcHour) ?? 0 }
    })
  }, [hourly, offset])

  const max = Math.max(...columns.map(c => c.views), 0)
  const zone = offset === null ? 'UTC' : 'local time'

  if (max === 0) return <ChartEmpty>No page views in this window.</ChartEmpty>

  const peak = columns.reduce((a, b) => (b.views > a.views ? b : a))

  return (
    <>
      <div className="flex flex-1 flex-col gap-1">
        {/* The whole column is the hit target, not the few-pixel bar. A
            24-column strip cannot give each mark a 24px-wide target, so the
            column's full height does the work instead — and every value is in
            the screen-reader list below regardless. */}
        <div className="flex h-18 items-end gap-px" aria-hidden="true">
          {columns.map(col => (
            <div
              key={col.displayHour}
              className="flex h-full min-w-0 flex-1 items-end"
              title={`${formatHour(col.displayHour)} — ${col.views} ${col.views === 1 ? 'view' : 'views'} (${zone})`}
            >
              <div
                className="w-full rounded-t-[3px] transition-[height] duration-500 motion-reduce:transition-none"
                style={{
                  // An empty hour keeps a 2px stub so the reader can see the
                  // hour exists and was quiet, rather than guessing at a gap.
                  height: col.views === 0 ? 2 : `${Math.max(6, (col.views / max) * 100)}%`,
                  // Decoration, not encoding: every column carries the same
                  // baseline-anchored gradient regardless of height, matching the
                  // visitors chart's area fill. Height is the only thing that
                  // varies with the value.
                  background: col.views === 0
                    ? ACCENT
                    : `linear-gradient(to top, ${ACCENT_DEEP}, ${ACCENT})`,
                  opacity: col.views === 0 ? 0.22 : col.displayHour === peak.displayHour ? 1 : 0.74,
                  // Paint-only glow — it never changes the column's layout box.
                  filter: col.views === 0 ? undefined : GLOW,
                }}
              />
            </div>
          ))}
        </div>

        {/* Hairline solid baseline — never dashed. */}
        <div className="h-px w-full bg-white/15" />

        {/* Four equal cells of six hours each, so a tick sits at the start of
            the column it names. `justify-between` would have pinned 6pm to the
            right edge, three hours from where hour 18 actually is. */}
        <div className="grid grid-cols-4 text-[9px] tabular-nums text-white/60" aria-hidden="true">
          {[0, 6, 12, 18].map(h => <span key={h}>{formatHour(h)}</span>)}
        </div>
      </div>

      <ul className="sr-only">
        <li>Hours shown in {zone}. Busiest hour {formatHour(peak.displayHour)} with {peak.views} views.</li>
        {columns.map(col => (
          <li key={col.displayHour}>{formatHour(col.displayHour)}: {col.views} views.</li>
        ))}
      </ul>
    </>
  )
}
