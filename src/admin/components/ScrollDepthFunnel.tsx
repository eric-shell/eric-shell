import { ChartEmpty } from './ChartFrame'
import { ordinalStep, share } from '../lib/chartTheme'
import { formatMonthDay } from '../lib/dateFormat'
import type { ScrollDepth, ScrollReach } from '@/../api/_lib/insights-types'

/**
 * How far sessions actually read, as a funnel of "reached at least N%".
 *
 * Ordinal, not categorical: the stages have a fixed order, so they take a
 * one-hue ramp (deep → bright as the read gets deeper) rather than four
 * identities. Every stage is a superset of the one below it, so the bars can
 * never render out of order — the funnel is monotonic by construction in SQL.
 *
 * DATA QUALITY. Sessions written before the telemetry fix recorded
 * `max_scroll_pct = 100` unconditionally, so they are excluded server-side and
 * counted instead (see the cutoff derivation in api/admin/insights.ts). This
 * component's job is to make that exclusion visible: a funnel that silently
 * dropped most of its rows, or one that drew a flat 100% at every stage, would
 * both read as a finding rather than a bug.
 */
const STAGES: { key: keyof ScrollReach; label: string }[] = [
  { key: 'pct25', label: '25%' },
  { key: 'pct50', label: '50%' },
  { key: 'pct75', label: '75%' },
  { key: 'pct90', label: '90%' },
]

/** One line explaining what was left out, or null when nothing was. */
function excludedNote(scroll: ScrollDepth): string | null {
  if (scroll.excluded === 0) return null
  const s = scroll.excluded === 1 ? 'session' : 'sessions'
  const since = scroll.since ? ` — measured from ${formatMonthDay(scroll.since)}` : ''
  return `${scroll.excluded} earlier ${s} excluded: scroll depth was mis-recorded as 100% before the telemetry fix${since}.`
}

export default function ScrollDepthFunnel({ scroll }: { scroll: ScrollDepth }) {
  const note = excludedNote(scroll)

  if (scroll.measured === 0) {
    return (
      <ChartEmpty>
        {scroll.excluded > 0
          ? `No sessions with trustworthy scroll depth yet. ${note}`
          : 'No sessions recorded scroll depth in this window.'}
      </ChartEmpty>
    )
  }

  const total = scroll.measured

  return (
    <>
      <ul className="flex flex-1 flex-col justify-center gap-2.5" aria-hidden="true">
        {STAGES.map((stage, i) => {
          const count = scroll.reach[stage.key]
          const pct = share(count, total)
          return (
            <li
              key={stage.key}
              className="flex items-center gap-2"
              title={`${count} of ${total} sessions scrolled at least ${stage.label}`}
            >
              <span className="w-8 shrink-0 text-[11px] tabular-nums text-white/70">{stage.label}</span>
              {/* Track is the remainder; the fill is square at the baseline and
                  4px-rounded at the data end. */}
              <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-white/7">
                <span
                  className="block h-full rounded-r-sm transition-[width] duration-500 motion-reduce:transition-none"
                  style={{
                    width: `${pct}%`,
                    // A non-zero count must still be visible; a 1-of-400 stage
                    // would otherwise round to an invisible bar.
                    minWidth: count > 0 ? 3 : 0,
                    background: ordinalStep(i / (STAGES.length - 1)),
                  }}
                />
              </span>
              <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-white/85">
                {pct}% <span className="text-white/55">· {count}</span>
              </span>
            </li>
          )
        })}
      </ul>

      {note && <p className="text-[10px] leading-snug text-white/55">{note}</p>}

      {/* The table equivalent. Values are never gated behind a hover title. */}
      <ul className="sr-only">
        {STAGES.map(stage => (
          <li key={stage.key}>
            Scrolled at least {stage.label}: {scroll.reach[stage.key]} of {total} sessions
            ({share(scroll.reach[stage.key], total)}%).
          </li>
        ))}
        {note && <li>{note}</li>}
      </ul>
    </>
  )
}
