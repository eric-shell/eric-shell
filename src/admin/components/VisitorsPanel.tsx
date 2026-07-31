import { useState } from 'react'
import { type LucideIcon, Bot, EyeOff, MessageSquare, Search, X } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { Eyebrow, Panel } from '../../components/ui'
import { SURFACE, SURFACE_HOVER } from '../../components/ui/variants'
import VisitorList from './VisitorList'
import { VisitorTableSkeleton } from './Skeleton'
import { resolveLocation } from '../lib/location'
import { TIMEFRAMES, type Timeframe } from '../lib/timeframe'
import type { VisitorSummary } from '@/../api/_lib/types'

/**
 * The visitor table and its toolbar — the per-row view, as against the
 * server-side aggregates in `InsightsPanel`. The two are siblings and share a
 * shape: a `<section>` landmark, an `Eyebrow` heading, and a note on the right
 * saying how the numbers under it are scoped.
 *
 * Like InsightsPanel it owns no fetch. Rows arrive already narrowed by the
 * dashboard's bot/engaged filters, because those define the working set the
 * metric tiles read from too — see the note on `baseVisitors` in Dashboard.
 * Search is the one filter that lives here, since it narrows only this table.
 */

/**
 * Toolbar filter toggle. `aria-pressed` rather than a checkbox: it is a control
 * that changes the view, not a value being submitted.
 *
 * On is the `primary` fill, the same one `Pill` uses for an active chip — a
 * filter that is doing something is a solid mark, not a tinted outline. The
 * earlier accent ring was the wrong signal twice over: `--color-accent` is
 * reserved for non-text marks, and on this canvas a 15%-alpha fill inside a
 * 40%-alpha ring read as *disabled* rather than active.
 *
 * Every state carries a `border` (transparent where there's nothing to draw)
 * so the box measures the same on and off and the row doesn't shift by 2px
 * when a chip toggles.
 */
function FilterChip({ active, onClick, icon: Icon, title, disabled, children }: {
  active: boolean
  onClick: () => void
  icon: LucideIcon
  title: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      title={title}
      className={twMerge(
        // Taller and wider on a phone: at h-7 these are 28px of tappable height
        // sitting right next to each other, which is a miss waiting to happen.
        // Back to the compact size once there's a pointer driving them.
        'flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition sm:h-7 sm:px-2',
        disabled
          ? 'cursor-default border-white/10 text-white/40'
          : active
            ? `cursor-pointer ${SURFACE.primary} ${SURFACE_HOVER.primary}`
            : 'cursor-pointer border-white/15 text-white/85 hover:bg-white/[0.06] hover:text-white',
      )}
    >
      <Icon size={13} aria-hidden="true" />
      {children}
    </button>
  )
}

/**
 * Timeframe segments — the toolbar's left-hand control, from `sm` up.
 *
 * A segmented control rather than a dropdown at this width: there are four
 * mutually exclusive values, all of them a few characters wide, and which one
 * is active is the single most important thing about the numbers on this page.
 * A menu would hide three of the four behind a click to save no space at all.
 * The phone gets `TimeframeSelect` below instead, where that trade flips.
 *
 * `radiogroup` semantics, unlike the `aria-pressed` chips on the right: these
 * are one value chosen from a set, not independent toggles, so arrow keys and
 * a single tab stop are what a screen-reader user should get.
 */
function TimeframeSegments({ value, onChange, labelledBy }: {
  value: Timeframe
  onChange: (v: Timeframe) => void
  /** The visible "Last seen" text, so the group's name matches what's on screen. */
  labelledBy: string
}) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="flex items-center gap-0.5 rounded-md p-0.5 ring-1 ring-inset ring-white/15"
    >
      {TIMEFRAMES.map(({ value: v, label, title }) => {
        const active = v === value
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            // Only the active segment is tabbable; arrows move within the group.
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(v)}
            onKeyDown={e => {
              const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
                : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1
                  : 0
              if (!step) return
              e.preventDefault()
              const i = TIMEFRAMES.findIndex(t => t.value === value)
              const next = TIMEFRAMES[(i + step + TIMEFRAMES.length) % TIMEFRAMES.length]
              onChange(next.value)
              // Follow the selection, or focus would sit on a segment that is no
              // longer the tabbable one.
              const el = e.currentTarget.parentElement?.querySelector<HTMLElement>(
                `[data-timeframe="${next.value}"]`,
              )
              el?.focus()
            }}
            data-timeframe={v}
            title={title}
            className={twMerge(
              // Same `primary` fill as the filter chips, and a transparent
              // border on the unselected segments so selecting one doesn't
              // nudge the group's width. No hover on the selected segment:
              // it's a radio, so clicking it again does nothing.
              'flex h-6 cursor-pointer items-center rounded border px-2 text-xs font-semibold tabular-nums transition',
              active
                ? SURFACE.primary
                : 'border-transparent text-white/70 hover:bg-white/[0.06] hover:text-white',
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * The same choice on a phone, as a native `<select>` — matching how sorting
 * already degrades in `VisitorList`. Four segments plus their label, sharing a
 * row with two filter chips, does not survive a 390px screen; and a native
 * select opens the OS picker, which beats a row of 24px-wide tap targets.
 *
 * It carries its own `<label>` rather than sharing one with the segmented
 * control: only one of the two is ever in the accessibility tree (the other is
 * `display: none`), and each wants a different association.
 */
function TimeframeSelect({ value, onChange }: {
  value: Timeframe
  onChange: (v: Timeframe) => void
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:hidden">
      <label htmlFor="visitor-timeframe" className={LABEL_CLASS}>
        Last seen
      </label>
      <select
        id="visitor-timeframe"
        value={value}
        onChange={e => onChange(e.target.value as Timeframe)}
        className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-2 text-sm text-white outline-none focus:border-accent/60"
      >
        {TIMEFRAMES.map(({ value: v, full }) => (
          // Native option lists can't be styled on Android, so give them an
          // explicit dark background rather than inheriting white-on-white.
          <option key={v} value={v} className="bg-blue-950 text-white">
            {full}
          </option>
        ))}
      </select>
    </div>
  )
}

/** The uppercase micro-type both toolbar groups label themselves with. */
const LABEL_CLASS = 'text-[10px] font-semibold uppercase tracking-wide text-white/70'

/**
 * Case- and accent-insensitive key for search.
 *
 * A plain `toLowerCase().includes()` is accent-sensitive, so typing "zurich"
 * matched nothing against "Zürich, ZH, CH" — and the field advertises location
 * search. Decomposing to NFD and dropping the combining marks makes o/ö, u/ü,
 * and e/é interchangeable, which matches how the columns already sort
 * (localeCompare with sensitivity 'base').
 */
function fold(s: string | null | undefined): string {
  return (s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

interface VisitorsPanelProps {
  /** Already narrowed by the bot/engaged filters; null while loading. */
  visitors: VisitorSummary[] | null
  /** Unfiltered count, for the "N of M" readout while searching. */
  totalCount: number
  /** True while a refetch is in flight, to dim rather than flash a skeleton. */
  loading: boolean
  /** False when there are no rows at all, which hides the filter row entirely. */
  hasAnyVisitors: boolean
  timeframe: Timeframe
  onTimeframeChange: (v: Timeframe) => void
  hideBots: boolean
  botCount: number
  onToggleBots: () => void
  engagedOnly: boolean
  quietCount: number
  onToggleEngaged: () => void
  onVisitorDeleted: (id: string) => void
}

export default function VisitorsPanel({
  visitors,
  totalCount,
  loading,
  hasAnyVisitors,
  timeframe,
  onTimeframeChange,
  hideBots,
  botCount,
  onToggleBots,
  engagedOnly,
  quietCount,
  onToggleEngaged,
  onVisitorDeleted,
}: VisitorsPanelProps) {
  const [query, setQuery] = useState('')

  const q = fold(query.trim())
  const filteredVisitors = !q || !visitors ? visitors : visitors.filter(v =>
    v.id.startsWith(q) ||
    fold(v.contact_name).includes(q) ||
    fold(v.contact_email).includes(q) ||
    fold(resolveLocation(v).label).includes(q)
  )

  return (
    <section aria-labelledby="visitors-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="visitors-heading">
          <Eyebrow className="text-xs text-white/85">Visitors</Eyebrow>
        </h2>
        {/* The mirror of the note on Insights. There the point is that the
            filters don't reach the aggregates; here it is that they do, so the
            two panels can disagree without either being wrong. */}
        <p className="text-[11px] text-white/60">
          One row per visitor · the filters and search below narrow this table
          and the metrics above
        </p>
      </div>

      {/* Hold the previous render at reduced opacity on refetch rather than
          flashing a skeleton — no layout jump. */}
      <Panel
        variant="raised-dark"
        className={`rounded-2xl shadow-sm transition-opacity duration-300 ${
          loading && visitors !== null ? 'opacity-40' : 'opacity-100'
        }`}
      >
        {/* Search lives inside the panel it filters. As a free-floating field it
            wore the same surface as the panels around it and read as another
            section rather than a control on this table. Here it is a toolbar
            row: no border, no fill of its own, just a divider against the
            results below it. */}
        <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3">
          <Search size={15} className="shrink-0 text-white/70" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, email, location, or visitor ID…"
            aria-label="Search visitors"
            className="h-7 min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/70 outline-none"
          />
          {/* Only while filtering: confirms the search is scoped to this table
              and that an empty result is a filter, not an empty database. */}
          {q && (
            <>
              {filteredVisitors !== null && (
                <span className="shrink-0 text-xs tabular-nums text-white/70">
                  {filteredVisitors.length} of {totalCount}
                </span>
              )}
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                title="Clear search"
                className="-m-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded text-white/70 transition-colors hover:text-white"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </>
          )}

        </div>

        {/* Filters sit on their own row rather than inside the search field.
            Search is a lookup; these change which rows count at all, including
            in the metric tiles above — different jobs, different row.
            The row renders whenever there are visitors, even when a filter
            currently matches nothing. Hiding it made the feature invisible on
            clean data — you could not tell whether it existed or had silently
            failed. A disabled chip with a count of zero says the same thing
            honestly — and a timeframe that empties the table must never take
            away the control you'd use to widen it again.

            Two groups, pushed apart: the timeframe on the left sets the window
            everything on the page describes, the chips on the right subtract
            from within it. Reading order matches that dependency.

            The two only sit on one line from `sm` up. Below that they stack,
            each under its own label — four segments and two chips on a 390px
            screen would wrap into an unreadable scramble, and `justify-between`
            on a wrapped row leaves lonely items stranded mid-line. */}
        {hasAnyVisitors && (
          <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:gap-y-2 sm:py-2.5">
            <div className="hidden items-center gap-2 sm:flex">
              <span id="visitor-timeframe-label" className={LABEL_CLASS}>
                Last seen
              </span>
              <TimeframeSegments
                value={timeframe}
                onChange={onTimeframeChange}
                labelledBy="visitor-timeframe-label"
              />
            </div>
            <TimeframeSelect value={timeframe} onChange={onTimeframeChange} />

            <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
              <span className={`${LABEL_CLASS} sm:mr-0.5`}>
                Filters
              </span>
              {/* Own row so the chips stay side by side under the label on a
                  phone instead of inheriting the group's vertical stack. */}
              <div className="flex flex-wrap items-center gap-2">
                <FilterChip
                  active={hideBots}
                  disabled={botCount === 0}
                  onClick={onToggleBots}
                  icon={hideBots ? EyeOff : Bot}
                  title={botCount === 0
                    ? 'No automated traffic detected in this data, so there is nothing to hide.'
                    : `${hideBots ? 'Hiding' : 'Hides'} ${botCount} automated ${botCount === 1 ? 'visitor' : 'visitors'} — ` +
                      'crawlers, headless clients, and fetch-without-reading. Bounces and possible spam always stay visible.'}
                >
                  {hideBots && botCount > 0 ? `${botCount} bots hidden` : 'Hide bots'}
                </FilterChip>
                <FilterChip
                  active={engagedOnly}
                  disabled={quietCount === 0}
                  onClick={onToggleEngaged}
                  icon={MessageSquare}
                  title={quietCount === 0
                    ? 'Every visitor here chatted or submitted the form, so there is nothing to hide.'
                    : `Show only visitors who chatted or submitted the contact form. Hides ${quietCount} who did neither.`}
                >
                  {engagedOnly && quietCount > 0 ? `${quietCount} quiet hidden` : 'Engaged only'}
                </FilterChip>
              </div>
            </div>
          </div>
        )}

        {/* The empty state distinguishes an empty database from an empty
            window — otherwise narrowing to 24h on quiet data reads as data
            loss. */}
        <div className="p-6">
          {filteredVisitors === null ? (
            <VisitorTableSkeleton />
          ) : filteredVisitors.length === 0 ? (
            <p className="text-sm text-white/65">
              {q
                ? 'No visitors match your search.'
                : timeframe === 'all'
                  ? 'No visitors yet.'
                  : 'No visitors active in this timeframe.'}
            </p>
          ) : (
            <VisitorList visitors={filteredVisitors} onVisitorDeleted={onVisitorDeleted} />
          )}
        </div>
      </Panel>
    </section>
  )
}
