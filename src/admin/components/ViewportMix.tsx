import { rankStep, share } from '../lib/chartTheme'
import RadialSegments from './RadialSegments'
import ChartLegend from './ChartLegend'
import RingCentre from './RingCentre'
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
 * Drawn as a proportionally divided ring, the same instrument Scroll depth and
 * the Action rate gauge use, so the three cards in the row read as one family.
 *
 * The form fits this data exactly: the three buckets are mutually exclusive and
 * sum to `known`, which is the only test a full proportional ring has to pass.
 * Scroll depth had to be reshaped into exclusive bands to meet it; this needed
 * nothing.
 *
 * The buckets are ordered (narrow → wide), which makes this ordinal: a one-hue
 * ramp, validated with `--ordinal --mode dark`. Wedges are separated by a seam
 * in the canvas colour rather than a lighter stroke, which would add
 * data-weight ink that isn't data.
 *
 * COLOUR HERE IS IDENTITY, NOT MAGNITUDE — the one chart in the panel where
 * that is still true, and deliberately so. Three segments share a single bar,
 * so the shade is what tells them apart, and the legend swatches below map
 * shade to label. Shading by value instead (as the rank lists and the hourly
 * strip now do) would repaint the swatches every time the data moved: a reader
 * who learned "bright means wide" would be wrong the next day, and two
 * similar-sized buckets would become indistinguishable in the bar they share.
 * The index is the rank, and the ranking is the width band.
 *
 * What it *does* now share with the rest of the panel is the contrast floor.
 * `rankStep` bottoms out at 3.23:1 on the canvas where the raw `ordinalStep(0)`
 * it used before was 2.55:1, under the 3:1 minimum for a non-text mark.
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
    // Reversed against `rankStep`'s own direction (0 is its brightest) so the
    // long-standing reading is preserved: narrow is the deep end, wide is
    // bright. Only the floor changed, not the order.
    color: rankStep(BUCKETS.length - 1 - i, BUCKETS.length),
  }))

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-3">
        {/* A zero-count bucket draws no arc and claims no gap — see the
            `drawable` filter in RadialSegments. It keeps its legend row, where
            the count says plainly that it is zero rather than missing. */}
        <div className="mx-auto w-full max-w-44">
          <RadialSegments
            segments={rows}
            total={total}
            label={rows.map(row => `${row.label}: ${row.pct}%`).join(', ')}
          >
            <RingCentre value={total} sub={total === 1 ? 'session' : 'sessions'} />
          </RadialSegments>
        </div>

        {/* No glow on the swatches. They are identity keys, not data marks —
            they encode no magnitude, and an 8px square with a 6px halo is
            mostly halo. The `hint` moves to the screen-reader list below; a
            `title` on a legend row is a tooltip nobody discovers. */}
        <ChartLegend
          rows={rows.map(row => ({
            key: row.key,
            label: row.label,
            color: row.color,
            dim: row.value === 0,
            value: <>{row.pct}% <span className="text-white/55">· {row.value}</span></>,
          }))}
        />
      </div>

      {/* The caption this chart's doc has always claimed it had. It carries the
          one thing the labels deliberately do not say: these are widths, not
          devices. It also gives the card a third block, so it reserves the same
          vertical structure as the two circular cards beside it. */}
      <p className="mt-auto text-[10px] leading-snug text-white/55 text-center">
        Browser viewport width, not device type — a half-screen desktop window
        counts as narrow.
      </p>

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
