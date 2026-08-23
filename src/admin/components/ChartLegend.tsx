import type { ReactNode } from 'react'

export interface LegendRow {
  key: string
  label: string
  /** Right-aligned readout. A node, so a caller can dim part of it. */
  value: ReactNode
  /**
   * Swatch fill. Omit where the row has no mark on the chart — the slot is
   * still reserved, so labels line up across cards whether or not they have one.
   */
  color?: string
  /** Renders the swatch at reduced opacity. For a real zero, never a small value. */
  dim?: boolean
}

/**
 * The label list under a circular chart: swatch, name, value.
 *
 * WHY THE HEIGHT IS RESERVED. The three cards in the insight row carry
 * different numbers of rows — three parts under Action rate, four bands under
 * Scroll depth, three buckets under Viewport — and a grid row stretches every
 * card to the tallest. Left alone, that put three rings at three different
 * heights on the same line and three captions at three different baselines.
 * Reserving the tallest legend on all of them lines the rings up at the top and
 * the captions at the bottom, which is the whole of the balance problem.
 *
 * `reserve` is therefore a property of the ROW, not of the data — it must be
 * the largest row count any card in the row can produce. Adding a fifth band to
 * Scroll depth means raising it here.
 */

/** Row box height and the gap between rows, in px. */
const ROW_H = 16
const ROW_GAP = 6
/** The tallest legend in the insight row: Scroll depth's four bands. */
export const LEGEND_ROWS = 4

export default function ChartLegend({ rows, reserve = LEGEND_ROWS }: {
  rows: LegendRow[]
  reserve?: number
}) {
  return (
    <ul
      className="flex w-full flex-col gap-1.5"
      // `min-height`, not `height`: a card that somehow renders more rows than
      // the row's tallest should grow rather than clip its own data.
      style={{ minHeight: reserve * ROW_H + (reserve - 1) * ROW_GAP }}
      aria-hidden="true"
    >
      {rows.map(row => (
        <li key={row.key} className="flex min-h-4 items-center gap-2 text-[11px]">
          {/* Always rendered, even with no colour — an invisible swatch keeps
              the label column in the same place on every card in the row. */}
          <span
            className="h-2 w-2 shrink-0 rounded-xs"
            style={{
              background: row.color ?? 'transparent',
              opacity: row.dim ? 0.35 : 1,
            }}
          />
          <span className="min-w-0 flex-1 truncate text-white/85">{row.label}</span>
          <span className="shrink-0 tabular-nums text-white/85">{row.value}</span>
        </li>
      ))}
    </ul>
  )
}
