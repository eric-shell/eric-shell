import { ordinalStep, share } from '../lib/chartTheme'
import { ChartEmpty } from './ChartFrame'
import type { ViewportMix as ViewportMixData } from '@/../api/_lib/insights-types'

/**
 * Part-to-whole: which viewport widths the site is actually being read at.
 *
 * **Viewport, not device.** The only thing recorded is CSS pixel width, so a
 * half-screen desktop window lands in the narrow bucket. Labelling these
 * "mobile / tablet / desktop" would assert something the data doesn't support,
 * so the labels name the width band and the caption says so.
 *
 * The buckets are ordered (narrow → wide), which makes this ordinal: a one-hue
 * ramp, validated with `--ordinal --mode dark`. Segments are separated by a 2px
 * gap in the surface colour rather than a stroke — the gap is the separator,
 * and a border would add data-weight ink that isn't data.
 */
const BUCKETS: { key: keyof ViewportMixData; label: string; hint: string }[] = [
  { key: 'phone', label: 'Narrow', hint: 'under 640px — phones' },
  { key: 'tablet', label: 'Medium', hint: '640–1023px — tablets, split windows' },
  { key: 'desktop', label: 'Wide', hint: '1024px and up — laptops, desktops' },
]

export default function ViewportMix({ viewport }: { viewport: ViewportMixData }) {
  const total = viewport.known
  if (total === 0) {
    return <ChartEmpty>No session reported a viewport size in this window.</ChartEmpty>
  }

  const rows = BUCKETS.map((bucket, i) => ({
    ...bucket,
    value: viewport[bucket.key],
    pct: share(viewport[bucket.key], total),
    color: ordinalStep(i / (BUCKETS.length - 1)),
  }))
  const shown = rows.filter(r => r.value > 0)

  return (
    <>
      <div className="flex flex-1 flex-col justify-center gap-3">
        {/* Zero-width buckets are dropped rather than rendered at 0px: an empty
            flex child still claims its share of the gap and would leave a stray
            notch in the bar. */}
        <div className="flex h-2.5 w-full gap-0.5" aria-hidden="true">
          {shown.map(row => (
            <span
              key={row.key}
              className="min-w-0 rounded-[3px] transition-[flex-grow] duration-500 motion-reduce:transition-none"
              style={{ flex: `${row.value} 1 0`, background: row.color }}
              title={`${row.label} (${row.hint}) — ${row.value} of ${total} sessions`}
            />
          ))}
        </div>

        {/* Doubles as the legend and the direct labels. Identity comes from the
            swatch beside the text, never from colouring the text itself. */}
        <ul className="flex flex-col gap-1.5" aria-hidden="true">
          {rows.map(row => (
            <li key={row.key} className="flex items-center gap-2 text-[11px]" title={row.hint}>
              <span
                className="h-2 w-2 shrink-0 rounded-xs"
                style={{ background: row.color, opacity: row.value === 0 ? 0.35 : 1 }}
              />
              <span className="min-w-0 flex-1 truncate text-white/85">{row.label}</span>
              <span className="shrink-0 tabular-nums text-white/85">
                {row.pct}% <span className="text-white/55">· {row.value}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="sr-only">
        {rows.map(row => (
          <li key={row.key}>
            {row.label} viewport ({row.hint}): {row.value} of {total} sessions ({row.pct}%).
          </li>
        ))}
      </ul>
    </>
  )
}
