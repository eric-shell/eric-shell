import { ChartEmpty } from './ChartFrame'
import { rankStep, share } from '../lib/chartTheme'
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
 * THE LADDER IS ORDERED BY INTENT, not by volume, and the ramp follows it:
 * brightest at the top rung. That is deliberately the opposite of the "bigger
 * segment, brighter" rule the rank lists use, because here the smallest segment
 * is the one that matters — a contact submission is the outcome this site
 * exists to produce, and it must not be the dimmest mark on the card because it
 * is also the rarest.
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

  const rows = RUNGS.map((rung, i) => ({
    ...rung,
    value: counts[rung.key],
    pct: share(counts[rung.key], total),
    color: rankStep(i, RUNGS.length),
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
            {/* The KPI survives the change and keeps the centre. This is the
                one card in the row with a single headline number — the other
                two show their totals there, because a split has no headline —
                so `hero` stays here and nowhere else. */}
            <RingCentre
              hero
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
