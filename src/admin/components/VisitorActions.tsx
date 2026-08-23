import { ChartEmpty } from './ChartFrame'
import { magnitudeRamp, share } from '../lib/chartTheme'
import ChartLegend from './ChartLegend'
import RadialSegments from './RadialSegments'
import RingCentre from './RingCentre'
import type { ActionMix } from '@/../api/_lib/insights-types'

/**
 * What visitors did — every visitor counted once, by the strongest thing they
 * did, as proportional segments of one ring.
 *
 * THIS REPLACED A BARE ACTION RATE, and the reason is worth keeping. The card
 * used to be a single gauge showing `acted / total`, with the three actions
 * listed underneath as text. They had to be text: they overlap, one visitor can
 * click out and chat and write in, so they sum past the value and could never
 * be segments of the arc. Sorting the same visitors into an exclusive ladder
 * removes that constraint entirely — the breakdown becomes the chart.
 *
 * It is also a better question for this site. On slim traffic "20% acted" is
 * one number standing on a handful of people; "2 wrote in, 4 chatted, 11
 * clicked out, 38 looked" is the same handful, legible, and it distinguishes
 * the visitor who sent a message from the one who opened a repo link. That
 * distinction is the entire point of a portfolio's analytics.
 *
 * THE RING IS ORDERED BY INTENT; THE RAMP IS NOT. Segments run round the ring
 * in ladder order, strongest rung first, but brightness tracks SIZE: the
 * biggest slice is always the lightest blue. Those are two different axes and
 * separating them is deliberate.
 *
 * The ramp did follow the ladder at first, on the argument that a contact
 * submission is the outcome this site exists to produce and should not be the
 * dimmest mark just because it is the rarest. That argument is real but it
 * loses to a plainer one: on a proportional ring, a reader reads shade as
 * amount. Making the smallest wedge the brightest fights the geometry it sits
 * in, and the same treatment applied to Scroll depth put that card's largest
 * band in its darkest blue. Emphasis for the rung that matters belongs
 * somewhere that is not competing with the size encoding.
 *
 * The rungs are exclusive by construction in SQL (see the action query in
 * api/admin/insights.ts), so they sum to `total` and the ring cannot overflow.
 * The overlapping totals survive in the screen-reader list, where they answer
 * "how many clicked out at all" without competing with the partition.
 */
const RUNGS = [
  { key: 'contacted', label: 'Sent the form' },
  { key: 'chatted', label: 'Chatted' },
  { key: 'clicked', label: 'Clicked out' },
  { key: 'looked', label: 'Looked only' },
] as const

const LEGEND = 'Each visitor counted once, by the strongest thing they did.'

export default function VisitorActions({ actions }: { actions: ActionMix }) {
  if (actions.total === 0) {
    return <ChartEmpty>No visitor activity recorded in this window.</ChartEmpty>
  }

  const total = actions.total
  const counts: Record<(typeof RUNGS)[number]['key'], number> = {
    contacted: actions.contacted,
    chatted: actions.chattedOnly,
    clicked: actions.clickedOnly,
    // The remainder. Clamped only defensively: `acted` is the union of the
    // three rungs and can never exceed the denominator it was counted from.
    looked: Math.max(0, total - actions.acted),
  }

  const values = RUNGS.map(rung => counts[rung.key])
  const colors = magnitudeRamp(values)
  const rows = RUNGS.map((rung, i) => ({
    ...rung,
    value: values[i],
    pct: share(values[i], total),
    color: colors[i],
  }))

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-3">
        <div className="mx-auto w-full max-w-44">
          <RadialSegments
            segments={rows}
            total={total}
            label={rows.map(row => `${row.label}: ${row.pct}%`).join(', ')}
          >
            {/* The one card here whose centre is a rate rather than a total:
                this split has a headline number and the other two do not. It is
                drawn at the same size as theirs regardless, so the row reads as
                three peers. */}
            <RingCentre
              value={`${share(actions.acted, total)}%`}
              sub={`${actions.acted} of ${total} acted`}
            />
          </RadialSegments>
        </div>

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

      <ul className="sr-only">
        {rows.map(row => (
          <li key={row.key}>
            {row.label}: {row.value} of {total} visitors ({row.pct}%).
          </li>
        ))}
        <li>
          Counting every visitor who did each thing, including those who did more
          than one: {actions.clicked} clicked out, {actions.chatted} chatted,
          {' '}and {actions.contacted} submitted the contact form.
        </li>
        <li>{LEGEND}</li>
      </ul>
    </>
  )
}
