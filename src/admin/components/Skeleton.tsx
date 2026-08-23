import { twMerge } from 'tailwind-merge'
import { Panel } from '../../components/ui'
import { RING_R, RING_STROKE } from '../lib/chartTheme'
import { VISITOR_COLUMNS } from '../lib/visitorColumns'

export function Skeleton({ className }: { className?: string }) {
  return <div className={twMerge('rounded bg-white/10', className)} />
}

/**
 * A placeholder bar sitting inside the line box the real text occupies.
 *
 * The wrapper carries the line height and the bar is drawn shorter inside it,
 * so a skeleton row measures exactly as tall as the row it stands in for while
 * still reading as a placeholder rather than a solid slab. `text-xs` is a 16px
 * line box (`h-4`), `text-sm` a 20px one (`h-5`).
 */
function Line({ h = 'h-4', bar = 'h-3', w, right, pill, className }: {
  /** The line box being reserved — match the real cell's text size. */
  h?: string
  /** The bar drawn inside it. */
  bar?: string
  w: string
  right?: boolean
  /** Fill the line box as a badge rather than sitting a text bar inside it. */
  pill?: boolean
  className?: string
}) {
  return (
    <div className={twMerge('flex items-center', h, right && 'justify-end', className)}>
      <Skeleton className={twMerge(pill ? twMerge(h, 'rounded-full') : bar, w)} />
    </div>
  )
}

/**
 * The metrics row: four stat tiles and the visitors-per-day chart.
 *
 * Geometry tracks `StatCard` and the chart `Panel` in Dashboard.tsx — the same
 * `min-w-[120px]`, the same 26px value line, and above all the same grid spans.
 * The chart used to be a plain `flex-1` panel, which is a *flex* instruction:
 * in the two-column phone grid it had no effect, so the placeholder sat in a
 * half-width cell and the real chart arrived full-width underneath it.
 */
export function MetricsRowSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <Panel
          key={i}
          variant="raised-dark"
          className="flex min-w-[120px] animate-pulse flex-col justify-between rounded-2xl p-4"
        >
          {/* StatCard's lines and the exact gaps between them: a 15px label
              row, `mt-1.5`, the 26px `leading-none` value, `mt-2` + the 4px
              ratio meter, `mt-1`, then the 16px sub. 113px of tile, up from
              101 before the meter existed.

              The meter is drawn on all four even though only Engaged and
              Converted carry one. Grid items stretch, so every real tile is
              already the height of the tallest — a meter tile — and a
              skeleton without one would be 12px short of the row it stands in
              for.

              No trend chip. It sits inline on the value's baseline and adds no
              height, and it only renders once a timeframe other than `all` is
              picked — which is not the default. A placeholder for something
              that usually never arrives is worse than none. */}
          <Line h="h-[15px]" bar="h-2.5" w="w-20" />
          <Line h="h-[26px]" bar="h-5" w="w-10" className="mt-1.5" />
          <Skeleton className="mt-2 h-1 w-full rounded-full" />
          <Line h="h-4" bar="h-2.5" w="w-24" className="mt-1" />
        </Panel>
      ))}
      <Panel
        variant="raised-dark"
        className="col-span-2 min-h-[116px] animate-pulse rounded-2xl p-4 md:col-span-4 xl:col-span-1 xl:flex-1"
      >
        {/* 82px, not 84: the panel's own 116px floor minus its `p-4` and its
            1px border. Any taller and the plot's placeholder is what sets the
            panel's height, which puts the row 2px over the real one. */}
        <Skeleton className="h-full min-h-[82px] w-full" />
      </Panel>
    </>
  )
}

/**
 * The three body shapes an insight card can have. `InsightsPanel` maps its
 * `SPANS` order onto these — see the array there.
 */
export type InsightShape = 'ring' | 'bars' | 'hours'

/** ChartFrame's figcaption: a 10px title and a 10px meta, baseline-aligned. */
function FrameCaptionSkeleton() {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <Line h="h-[15px]" bar="h-2" w="w-20" />
      <Line h="h-[15px]" bar="h-2" w="w-12" />
    </div>
  )
}

/**
 * Deterministic bar heights for the hourly strip, as percentages.
 *
 * Fixed rather than random: a placeholder that reshuffles between renders
 * draws the eye to itself, and `animate-pulse` on the panel is already
 * carrying the "this is loading" signal.
 */
const HOUR_STUBS = [
  18, 12, 10, 8, 8, 12, 22, 38, 55, 68, 74, 80,
  86, 78, 72, 66, 70, 82, 90, 76, 58, 42, 30, 22,
]

/**
 * One insight card's contents, at the geometry the real chart renders.
 *
 * The `ring` shape is exact and worth the precision: the ring is `w-full
 * max-w-44` over a square viewBox, and `ChartLegend` reserves four rows on
 * every circular card, so the whole block is deterministic before any data
 * arrives. It is also the tallest thing in the panel by a wide margin — the
 * old placeholder reserved 96px for what is now a ~176px ring plus an 82px
 * legend, and the first row of the panel jumped by more than 150px on load.
 *
 * `bars` cannot be exact, and that is the honest limit here: the row count is
 * whatever the query returned, capped at eight. Six is the reserve — enough
 * that a well-populated list barely moves, small enough that a quiet one does
 * not collapse. It is the only shape in this file that approximates.
 */
export function InsightCardSkeleton({ shape }: { shape: InsightShape }) {
  return (
    <div className="flex h-full min-w-0 flex-col gap-3">
      <FrameCaptionSkeleton />

      {shape === 'ring' && (
        <>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-3">
            {/* Drawn from the shared ring constants rather than as a bordered
                div, so the placeholder scales with the card exactly as the real
                ring does and cannot drift from it when the geometry changes. */}
            <div className="mx-auto w-full max-w-44">
              <svg viewBox="0 0 100 100" className="w-full" aria-hidden="true">
                <circle
                  cx="50" cy="50" r={RING_R}
                  fill="none"
                  strokeWidth={RING_STROKE}
                  className="stroke-white/10"
                />
              </svg>
            </div>
            {/* ChartLegend's four reserved rows, at its row box and gap. */}
            <ul className="flex w-full flex-col gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex min-h-4 items-center gap-2">
                  <Skeleton className="h-2 w-2 shrink-0 rounded-xs" />
                  <Skeleton className="h-2 w-full max-w-24" />
                  <Skeleton className="ml-auto h-2 w-12 shrink-0" />
                </li>
              ))}
            </ul>
          </div>
          {/* Two lines of the 10px `leading-snug` caption every circular card
              now carries, bottom-aligned the way the real one is. */}
          <div className="mt-auto flex flex-col items-center gap-1">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-2/3" />
          </div>
        </>
      )}

      {shape === 'bars' && (
        <ul className="flex flex-1 flex-col justify-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            // `h-4`, because BarList's label is an 11px line box and that, not
            // the 8px track beside it, is what sets the row height.
            <li key={i} className="flex h-4 items-center gap-2">
              <Skeleton className="h-2 w-[38%] shrink-0" />
              <Skeleton className="h-2 min-w-0 flex-1 rounded-sm" />
              <Skeleton className="h-2 w-5 shrink-0" />
            </li>
          ))}
        </ul>
      )}

      {shape === 'hours' && (
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex h-18 items-end gap-0.5 xl:h-24 xl:gap-1">
            {HOUR_STUBS.map((h, i) => (
              <div
                key={i}
                className="min-w-0 flex-1 rounded-t-[3px] bg-white/10"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          {/* The real baseline, not a placeholder for it — it is a hairline
              either way, and a grey stub would read as missing. */}
          <div className="h-px w-full bg-white/15" />
          <div className="grid grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Line key={i} h="h-[15px]" bar="h-2" w="w-6" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** One phone card, at the geometry `MobileList` renders. */
function VisitorCardSkeleton() {
  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-3">
        <Line w="w-32" />
        <Line w="w-20" />
      </div>
      <div className="mt-1.5 flex items-end justify-between gap-3">
        {/* Location is `text-sm`; the tags beside it are 9px badges. */}
        <Line h="h-5" w="w-28" />
        <div className="flex shrink-0 gap-1">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-14 rounded-full" />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-4 border-t border-white/5 pt-2">
        <Line w="w-16" />
        <div className="ml-auto flex gap-4">
          <Line w="w-8" />
          <Line w="w-8" />
        </div>
      </div>
    </li>
  )
}

/**
 * The visitor list at rest — the first thing `/dashboard` paints, since
 * `DashboardBoot` renders it while the auth probe is still in flight.
 *
 * It mirrors all three renderings `VisitorList` has: the phone cards below
 * `md`, the folding table above it, and the `SortBar` that sits over both up to
 * `xl`. It previously rendered one fixed six-column table at every width, and
 * that was wrong twice over. It was stale — Name and Email had merged into
 * `Contact` long ago, and Flags, Location and Activity had never been added —
 * and on a phone it was an overflow: `table-fixed` honours the column widths
 * whatever the container does, so 560px of fixed columns forced the *document*
 * to 593px on a 412px screen and Android zoomed the whole page out to fit. The
 * real table never had that problem because it lives inside `overflow-x-auto`
 * and only renders from `md` up.
 */
export function VisitorTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {/* SortBar: a 10px label over a 36px control row, capped at max-w-sm. */}
      <div className="mb-3 flex flex-col gap-1.5 xl:hidden">
        <Line h="h-[13px]" bar="h-2.5" w="w-14" />
        <div className="flex max-w-sm items-stretch gap-2">
          <Skeleton className="h-9 min-w-0 flex-1 rounded-lg" />
          <Skeleton className="h-9 w-20 shrink-0 rounded-lg" />
        </div>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {Array.from({ length: rows }).map((_, i) => <VisitorCardSkeleton key={i} />)}
      </ul>

      {/* Same wrapper, same min-widths and same columns as the real table, so
          the two can't disagree about how much room they need. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[43rem] table-fixed text-sm xl:min-w-[67rem]">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/65">
              {VISITOR_COLUMNS.map(col => (
                <th key={col.id} scope="col" className={twMerge('py-2 pr-4 font-semibold', col.className)}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b border-white/5">
                {VISITOR_COLUMNS.map(col => (
                  <td key={col.id} className={twMerge('py-3 pr-4', col.className)}>
                    {col.skeleton.map((bar, j) => (
                      <Line
                        key={j}
                        // The table is `text-sm`, so a line box is 20px unless
                        // the column says otherwise.
                        h={bar.h ?? 'h-5'}
                        w={bar.w}
                        pill={bar.pill}
                        right={col.align === 'right'}
                      />
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * A chat bubble and the timestamp under it, at the geometry
 * ConversationTimeline renders: `px-4 py-2.5` around a 20px `text-sm` line box,
 * so `height` is 20px per line of copy plus 20px of padding — `h-10` for one
 * line, `h-15` for two, `h-20` for three. Then a `mt-1.5` stamp.
 */
function BubbleSkeleton({ role, height }: { role: 'user' | 'assistant'; height: string }) {
  return (
    <div className={twMerge('flex flex-col', role === 'user' ? 'items-end' : 'items-start')}>
      <Skeleton className={twMerge('w-[70%] max-w-[85%] rounded-2xl', height)} />
      <Skeleton className="mt-1.5 mx-2 h-3 w-28" />
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Mirrors TabBar: three tabs at `px-4 py-2` around a 16px `text-xs` line
          box, over the same 2px selected-tab rail. Two stubs in a bare flex row
          sat ~12px shorter than the real bar and the panel jumped on load. */}
      <div className="mb-4 flex border-b border-white/10">
        {['w-16', 'w-20', 'w-20'].map((w, i) => (
          <div key={i} className="px-4 py-2 border-b-2 border-transparent -mb-px">
            <Skeleton className={twMerge('h-4', w)} />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <BubbleSkeleton role="user" height="h-10" />
        <BubbleSkeleton role="assistant" height="h-20" />
        <BubbleSkeleton role="user" height="h-10" />
        <BubbleSkeleton role="assistant" height="h-15" />
      </div>

      {/* The Location / Notes / actions footer is always present once the fetch
          resolves, so leaving it out of the skeleton grew the drawer by ~230px
          on load and shoved every row below it down the page. */}
      <div className="mt-5 border-t border-white/10 pt-4">
        <Skeleton className="mb-1.5 h-3 w-16" />
        {/* px-3 py-2 around a 20px text-sm line box, plus the 1px border. */}
        <Skeleton className="h-9.5 w-full rounded-lg" />
        <Skeleton className="mt-1.5 h-2.5 w-full" />
        <Skeleton className="mt-1 h-2.5 w-2/3" />

        <Skeleton className="mt-4 mb-1.5 h-3 w-12" />
        {/* Same, over rows={3}. */}
        <Skeleton className="h-19.5 w-full rounded-lg" />

        {/* size="sm" buttons: py-1.5 around a 16px text-xs line box + border. */}
        <div className="mt-2 flex items-center justify-end gap-2">
          <Skeleton className="h-7.5 w-24 rounded-lg" />
          <Skeleton className="h-7.5 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function MetaFieldSkeletons({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 min-w-0 animate-pulse">
          <Skeleton className="shrink-0 w-7 h-7 rounded-full" />
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-2 w-10" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </>
  )
}
