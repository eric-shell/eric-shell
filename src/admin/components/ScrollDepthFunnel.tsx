import { ChartEmpty } from './ChartFrame'
import { rankStep, share } from '../lib/chartTheme'
import RadialSegments from './RadialSegments'
import ChartLegend from './ChartLegend'
import RingCentre from './RingCentre'
import type { ScrollDepth } from '@/../api/_lib/insights-types'

/**
 * Where sessions stopped reading — the page split into depth bands, as
 * proportional segments of one ring.
 *
 * THIS MEASURES A PARTITION, NOT THE FUNNEL. The payload carries cumulative
 * stages ("reached at least N%"), which are nested supersets:
 * `pct90 ⊆ pct75 ⊆ pct50 ⊆ pct25`. Those sum well past 100% and therefore can
 * never be proportional slices of a circle — no arrangement of a full ring can
 * show them, which is the whole reason this card is bands rather than stages.
 * Subtracting adjacent stages turns them into mutually exclusive buckets that
 * sum to exactly `measured`, and those a ring can carry honestly.
 *
 * What that costs, stated plainly because it is a real loss: the cumulative
 * reading is gone. "How many got far enough to see the contact form" was one
 * glance at the old funnel and is now a sum of the last buckets. What replaces
 * it is the question a partition answers well — where does attention actually
 * run out.
 *
 * FOUR BANDS, NOT FIVE. The stages support a fifth (75–89 split from 90+), and
 * it was dropped on palette grounds: five steps of the ramp put adjacent ΔL at
 * 0.054, under the 0.06 the ordinal palette was validated at, and widening the
 * ramp to compensate would push its deep end under the 3:1 contrast floor for a
 * non-text mark. Four bands clear both (ΔL 0.072, floor 3.23:1). The 90% stage
 * still reaches the screen-reader list.
 *
 * The ramp runs bright at the shallow end to deep at the far end, which is the
 * direction this card has always read. In a typical funnel the shallow band is
 * also the largest, so the brightest segment is the biggest one.
 *
 * DATA QUALITY. Sessions written before the telemetry fix recorded
 * `max_scroll_pct = 100` unconditionally and are excluded server-side (see the
 * cutoff derivation in api/admin/insights.ts). The frame's meta counts only the
 * sessions actually charted, so the denominator stays honest without the chart
 * carrying a migration note about it.
 */
const LEGEND = 'Deepest point each measured session reached. Bands are exclusive and sum to the whole.'

/**
 * The bands, outermost first, each derived by subtracting the next stage from
 * this one. `Math.max(0, …)` is defensive only: the funnel is monotonic by
 * construction in SQL, so a negative band would be a data bug, and clamping
 * keeps one from rendering as a backwards arc while it is investigated.
 */
function bands(scroll: ScrollDepth) {
  const r = scroll.reach
  return [
    { key: 'under25', label: 'Under 25%', value: Math.max(0, scroll.measured - r.pct25) },
    { key: 'to50', label: '25 to 49%', value: Math.max(0, r.pct25 - r.pct50) },
    { key: 'to75', label: '50 to 74%', value: Math.max(0, r.pct50 - r.pct75) },
    { key: 'deep', label: '75% or more', value: Math.max(0, r.pct75) },
  ]
}

export default function ScrollDepthFunnel({ scroll }: { scroll: ScrollDepth }) {
  if (scroll.measured === 0) {
    return <ChartEmpty>No sessions recorded scroll depth in this window.</ChartEmpty>
  }

  const total = scroll.measured
  const rows = bands(scroll).map((band, i) => ({
    ...band,
    pct: share(band.value, total),
    // Rank by band, not by value: the ramp carries the depth axis, and the arc
    // length already carries the magnitude. Ranking by value instead would
    // repaint the swatches every time the data moved, and the legend below
    // depends on shade meaning the same thing tomorrow.
    color: rankStep(i, 4),
  }))

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-3">
        {/* Same cap the Action rate gauge uses at its non-hero size, so the
            three instruments in this row are one family at two weights. */}
        <div className="mx-auto w-full max-w-44">
          <RadialSegments
            segments={rows}
            total={total}
            label={rows.map(r => `${r.label}: ${r.pct}%`).join(', ')}
          >
            <RingCentre value={total} sub={total === 1 ? 'session' : 'sessions'} />
          </RadialSegments>
        </div>

        {/* The segments carry no labels of their own — there is no room on the
            stroke. Identity comes from the swatch, listed in the order the ring
            runs clockwise from twelve. */}
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

      <p className="mt-auto text-[10px] leading-snug text-white/55 text-center">{LEGEND}</p>

      {/* The table equivalent, and the only place the cumulative stages survive
          — they are still the more useful answer to "did they get far enough",
          and they cost nothing here. */}
      <ul className="sr-only">
        {rows.map(row => (
          <li key={row.key}>
            Stopped at {row.label}: {row.value} of {total} sessions ({row.pct}%).
          </li>
        ))}
        <li>
          Cumulatively, of {total} measured sessions: {scroll.reach.pct25} reached at least 25%,
          {' '}{scroll.reach.pct50} reached 50%, {scroll.reach.pct75} reached 75%,
          {' '}and {scroll.reach.pct90} reached 90%.
        </li>
        <li>{LEGEND}</li>
      </ul>
    </>
  )
}
