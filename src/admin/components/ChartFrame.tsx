import { twMerge } from 'tailwind-merge'
import { Panel } from '../../components/ui'

/**
 * The card every insight chart sits in: one `raised-dark` panel, one `<figure>`,
 * one caption row.
 *
 * The caption is where a single-series chart gets its identity — a legend box
 * with one swatch would only restate it. The frame never fixes a height, so the
 * card always grows to include its own axis band rather than clipping it into a
 * nested scrollbar.
 */
export function ChartFrame({ title, meta, children, className }: {
  title: string
  meta?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Panel
      variant="raised-dark"
      // `min-w-0` is load-bearing, not tidying. A grid item's default
      // `min-width: auto` is its min-content width, and one chart can make that
      // enormous: BarList's label is `w-[38%] shrink-0 truncate`, and in
      // intrinsic sizing a percentage resolves to `auto`, so the flex base
      // becomes the label's max-content — the whole untruncated path, which
      // `shrink-0` then refuses to go below. The single-column track inflated
      // to fit it and every panel in the grid stretched to match: with real
      // note slugs in Top pages the cards ran to 382px at every viewport,
      // eating the right gutter at 390 and hanging 22px off the screen at 360.
      // Bounding the track here is what lets `truncate` do its job at all —
      // otherwise it truncates into a box that was sized by the full string.
      className={twMerge('min-w-0 rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md', className)}
    >
      <figure className="flex h-full min-w-0 flex-col gap-3">
        <figcaption className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/85">
            {title}
          </span>
          {/* Same micro-label treatment as the title opposite it, one weight
              down so the pair still has a hierarchy. Cased here rather than at
              the call sites so a new chart cannot introduce a lowercase one. */}
          {meta !== undefined && (
            <span className="shrink-0 text-[10px] uppercase tracking-wider text-white/85">{meta}</span>
          )}
        </figcaption>
        {children}
      </figure>
    </Panel>
  )
}

/**
 * The empty state for a chart with nothing to draw. Says which measurement is
 * missing rather than "no data", so an empty card is never confused with a
 * broken one.
 */
export function ChartEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex min-h-16 flex-1 items-center text-xs text-white/65">{children}</p>
  )
}
