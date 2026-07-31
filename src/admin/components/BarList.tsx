import { ACCENT } from '../lib/chartTheme'
import { ChartEmpty } from './ChartFrame'

export interface BarListItem {
  /** Display label. Truncated visually; the full string stays in `title`. */
  label: string
  value: number
  /** Extra context for the hover title and the screen-reader list only — it
   *  does not compete with the value in the row. */
  detail?: string
}

/**
 * A ranked horizontal bar list — top sources, top pages.
 *
 * **One colour for every bar, on purpose.** These are nominal categories
 * (hostnames, paths): colouring them darker-where-bigger would spend the
 * identity channel re-encoding what bar length already shows, and a ramp across
 * nominal rows is an explicit anti-pattern. Rank is carried by order and length.
 *
 * Bars are scaled to the largest row, not to the total, so the shape of the tail
 * stays readable when one row dominates.
 */
export default function BarList({ items, empty, unit }: {
  items: BarListItem[]
  /** Shown when there is nothing to rank. */
  empty: string
  /** Plural noun for the value, used in the screen-reader list. */
  unit: string
}) {
  if (items.length === 0) return <ChartEmpty>{empty}</ChartEmpty>

  const max = Math.max(...items.map(i => i.value), 1)

  return (
    <>
      {/* Keyed by rank, not by label. Labels are not unique across callers —
          "Clicks out" groups by destination host and shows the link text, and
          two hosts can perfectly well share the words "View project". Nothing
          in a row carries state, so position is the honest identity here. */}
      <ul className="flex flex-1 flex-col justify-center gap-2" aria-hidden="true">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-center gap-2"
            title={`${item.label} — ${item.value} ${unit}${item.detail ? `, ${item.detail}` : ''}`}
          >
            <span className="w-[38%] shrink-0 truncate text-[11px] text-white/85">{item.label}</span>
            <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-sm bg-white/7">
              <span
                className="block h-full rounded-r-sm transition-[width] duration-500 motion-reduce:transition-none"
                style={{
                  width: `${(item.value / max) * 100}%`,
                  minWidth: item.value > 0 ? 3 : 0,
                  background: ACCENT,
                }}
              />
            </span>
            <span className="shrink-0 text-right text-[11px] tabular-nums text-white/85">{item.value}</span>
          </li>
        ))}
      </ul>

      <ul className="sr-only">
        {items.map((item, i) => (
          <li key={i}>
            {item.label}: {item.value} {unit}{item.detail ? `, ${item.detail}` : ''}.
          </li>
        ))}
      </ul>
    </>
  )
}
