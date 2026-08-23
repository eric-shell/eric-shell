import { glowFor, magnitudeStep } from '../lib/chartTheme'
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
 * **Bars are shaded by magnitude**, via `magnitudeStep` — the top row is the
 * bright ACCENT, the tail runs deep, scaled to the largest row rather than the
 * total so the shape of the tail stays readable when one row dominates.
 *
 * The rows are nominal (hostnames, paths, tags), so this is not an ordinal
 * ramp: the shade carries no identity and the tooltip and screen-reader list
 * never refer to it. It is a second reading of the same magnitude the bar
 * length already gives, which is why nothing is lost when two rows tie or when
 * the caller re-sorts. Rank itself is still carried by order and length.
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
        {items.map((item, i) => {
          const fill = magnitudeStep(item.value, max)
          return (
          <li
            key={i}
            className="flex items-center gap-2"
            title={`${item.label} — ${item.value} ${unit}${item.detail ? `, ${item.detail}` : ''}`}
          >
            <span className="w-[38%] shrink-0 truncate text-[11px] text-white/85">{item.label}</span>
            {/* No `overflow-hidden` on the track, deliberately: the fill's
                glow is drawn outside its box and the track would clip it back
                to a rectangle. Nothing is lost by dropping it — the fill can
                never exceed `max`, so it cannot overrun the track, and both
                radii are 2px, so the fill's square left corner sits inside the
                track's rounded one by well under a pixel. */}
            <span className="h-2 min-w-0 flex-1 rounded-sm bg-white/7">
              <span
                className="block h-full rounded-r-sm transition-[width] duration-500 motion-reduce:transition-none"
                style={{
                  width: `${(item.value / max) * 100}%`,
                  minWidth: item.value > 0 ? 3 : 0,
                  // Floored well above the bottom of the ramp — see
                  // `magnitudeStep`. A tail row here can be the 3px `minWidth`
                  // stub above, and a 3px mark is the last thing that can
                  // afford to be painted at 2.5:1.
                  background: fill,
                  // In the row's own step, so the halo can never be brighter
                  // than the bar it belongs to. A zero row draws no box and so
                  // no glow; skipping it keeps that explicit.
                  filter: item.value > 0 ? glowFor(fill) : undefined,
                }}
              />
            </span>
            <span className="shrink-0 text-right text-[11px] tabular-nums text-white/85">{item.value}</span>
          </li>
          )
        })}
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
