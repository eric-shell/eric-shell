import { Fragment, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronDown, ChevronLeft,
  ChevronRight, ChevronUp, MailCheck, MessageSquare, Pencil,
} from 'lucide-react'
import VisitorDetail from './VisitorDetail'
import { Button } from '../../components/ui'
import { twMerge } from 'tailwind-merge'
import type { VisitorSummary } from '@/../api/_lib/types'
import { formatDuration, formatShort } from '../lib/dateFormat'
import { resolveLocation } from '../lib/location'
import { classifyVisitor } from '../lib/classify'
import VisitorTags from './VisitorTags'
import {
  DEFAULT_SORT, SORT_LABEL, nextSort, sortVisitors,
  type SortKey, type SortState,
} from '../lib/sortVisitors'

export type { VisitorSummary }

const PAGE_SIZE = 25

/**
 * Expand/collapse duration. Kept in sync with the `duration-*` class in
 * `DetailCollapse` — it also times how long a closing row stays mounted.
 */
const COLLAPSE_MS = 260

/**
 * Height animation for the expanded visitor detail.
 *
 * `grid-template-rows: 0fr → 1fr`, not `max-height`. The panel's height isn't
 * known when it opens: the detail is fetched after mount, and a chat transcript
 * can be any length. A max-height big enough for the longest one would make
 * every short row coast through empty space at the end of its animation, and
 * one sized for the common case would clip the long ones.
 *
 * It mounts closed and opens on the next frame — an element already at its
 * final value has nothing to transition from. Same reason the closing row stays
 * mounted for COLLAPSE_MS in the parent: unmounting on click would delete the
 * thing that's supposed to be animating.
 */
function DetailCollapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={twMerge('grid', open ? 'animate-detail-expand' : 'animate-detail-collapse')}>
      {/* What the 0fr row clips against. */}
      <div className="overflow-hidden">{children}</div>
    </div>
  )
}

interface VisitorListProps {
  visitors: VisitorSummary[]
  onVisitorDeleted?: (id: string) => void
}

function shortId(id: string) {
  return id.slice(0, 8)
}

/** Location cell content, shared by the table and the phone cards. */
function LocationValue({ location }: { location: ReturnType<typeof resolveLocation> }) {
  if (!location.label) return <Dash />
  return (
    <span title={location.approximate ? 'Approximate — from IP geolocation' : 'Manually corrected'}>
      {location.label}
      {/* Nearly every location is IP-derived, so marking the exception reads far
          quieter than marking the rule. A pencil, not a check: the mark says
          "a human typed this", not "this has been verified as correct". */}
      {!location.approximate && (
        <Pencil size={11} className="ml-1 inline-block align-[-1px] text-white/80" aria-label="manually corrected" />
      )}
    </span>
  )
}

/** Page views over engaged time. */
function EngagementValue({ v, align = 'right' }: { v: VisitorSummary; align?: 'left' | 'right' }) {
  if (v.page_view_count === 0 && v.total_engaged_ms === 0) return <Dash />
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <div className="text-white">
        {v.page_view_count} {v.page_view_count === 1 ? 'view' : 'views'}
      </div>
      {v.total_engaged_ms > 0 && (
        <div className="text-xs text-white/75">{formatDuration(v.total_engaged_ms)}</div>
      )}
    </div>
  )
}

/**
 * Engagement, chat count and submission count folded into one right-hand column.
 *
 * Between `md` and `xl` there is not enough width for eight columns — the three
 * count columns are 216px of chrome for two digits of data — but the counts
 * themselves still matter, so they collapse into the engagement cell rather than
 * disappearing. Zeroes are dropped instead of rendered as dashes: with the
 * columns merged there is no vertical alignment left for a dash to preserve, and
 * a quiet row should read quiet.
 */
function ActivityValue({ v }: { v: VisitorSummary }) {
  return (
    <div className="text-right">
      <EngagementValue v={v} />
      {(v.chat_message_count > 0 || v.contact_count > 0) && (
        <div className="mt-0.5 flex items-center justify-end gap-2 text-xs">
          {v.chat_message_count > 0 && (
            <span className="inline-flex items-center gap-1 text-white/90">
              <MessageSquare size={11} className="text-white/70" aria-hidden="true" />
              <span className="sr-only">Chat messages: </span>
              {v.chat_message_count}
            </span>
          )}
          {v.contact_count > 0 && (
            <span className="inline-flex items-center gap-1 font-semibold text-green-400">
              <MailCheck size={11} strokeWidth={2.5} aria-hidden="true" />
              <span className="sr-only">Contact submissions: </span>
              {v.contact_count}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Contact cell content. Name over email in one column: most visitors are
 * anonymous readers, and two separate columns of em-dashes wasted the widest
 * part of the table. Both lines carry a `title` — they truncate hard once the
 * column narrows below `xl`.
 */
function ContactValue({ v }: { v: VisitorSummary }) {
  if (!v.contact_name && !v.contact_email) return <Dash />
  return (
    <div className="min-w-0">
      {v.contact_name && (
        <div className="truncate font-semibold text-white/95" title={v.contact_name}>{v.contact_name}</div>
      )}
      {v.contact_email && (
        <div className="truncate text-xs text-white/75" title={v.contact_email}>{v.contact_email}</div>
      )}
    </div>
  )
}

/**
 * Sortable column header. The button carries the interaction so the column is
 * reachable by keyboard; `aria-sort` on the cell is what a screen reader
 * actually announces. The arrow only appears on the active column — an
 * indicator on every header is noise, since only one can be active.
 */
function SortHeader({ label, sortKey, sort, onSort, className, align = 'left', title }: {
  label: string
  sortKey: SortKey
  sort: SortState
  onSort: (key: SortKey) => void
  className?: string
  align?: 'left' | 'right'
  title?: string
}) {
  const active = sort.key === sortKey
  const Arrow = sort.dir === 'asc' ? ChevronUp : ChevronDown
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={twMerge('py-2 pr-4 font-semibold', className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        title={title ?? `Sort by ${SORT_LABEL[sortKey]}`}
        className={twMerge(
          'group inline-flex cursor-pointer items-center gap-1 uppercase tracking-wide transition-colors hover:text-white',
          align === 'right' && 'flex-row-reverse',
          active ? 'text-white' : 'text-white/85',
        )}
      >
        {label}
        <Arrow
          size={12}
          aria-hidden="true"
          className={active ? 'opacity-100' : 'opacity-0 transition-opacity group-hover:opacity-40'}
        />
      </button>
    </th>
  )
}

/**
 * Muted "no data" placeholder. Appears on most rows, so it stays quiet — but
 * /45 measured 4.35:1, just under the 4.5:1 text threshold. /50 is 5.04:1.
 */
function Dash() {
  return <span className="text-white/65">—</span>
}


/**
 * Sort control for every width where the column headers can't carry all eight
 * keys: the phone has no headers at all, and below `xl` the table folds Flags,
 * Chat and Sent away. Hidden from `xl` up, where every column is clickable.
 *
 * A native `<select>`: on Android it opens the OS picker — better than a custom
 * listbox on a touch screen, and accessible without extra work.
 */
function SortBar({ sort, onSort, className }: {
  sort: SortState
  onSort: (key: SortKey) => void
  className?: string
}) {
  const dirLabel = sort.dir === 'asc' ? 'ascending' : 'descending'
  return (
    <div className={twMerge('mb-3 flex flex-col gap-1.5', className)}>
      <label htmlFor="visitor-sort" className="text-[10px] font-semibold uppercase tracking-wide text-white/75">
        Sort by
      </label>
      {/* Capped rather than full-bleed: on a tablet a 900px-wide select for
          eight short labels reads like a mistake. */}
      <div className="flex max-w-sm items-stretch gap-2">
        <select
          id="visitor-sort"
          value={sort.key}
          onChange={e => onSort(e.target.value as SortKey)}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-2 text-sm text-white outline-none focus:border-accent/60"
        >
          {(Object.keys(SORT_LABEL) as SortKey[]).map(k => (
            // Native option lists can't be styled on Android, so give them an
            // explicit dark background rather than inheriting white-on-white.
            <option key={k} value={k} className="bg-blue-950 text-white">
              {SORT_LABEL[k]}
            </option>
          ))}
        </select>
        {/* Directional arrows, not a chevron. The native select draws its own
            chevron immediately to the left, and two chevrons side by side read
            as two dropdowns rather than a select plus a direction toggle. The
            word carries it too, so the control never depends on the glyph. */}
        <button
          type="button"
          onClick={() => onSort(sort.key)}
          aria-label={`Sorted ${dirLabel}. Activate to reverse.`}
          title={`Sorted ${dirLabel} — tap to reverse`}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 text-xs font-semibold text-white/90 transition-colors hover:bg-white/[0.09]"
        >
          {sort.dir === 'asc'
            ? <ArrowUpNarrowWide size={15} aria-hidden="true" />
            : <ArrowDownWideNarrow size={15} aria-hidden="true" />}
          {sort.dir === 'asc' ? 'Asc' : 'Desc'}
        </button>
      </div>
    </div>
  )
}

/**
 * Phone rendering of the visitor list.
 *
 * A horizontally scrolling table on a 412px screen means the reader never sees
 * a whole row, so each visitor becomes a self-contained card instead. Content
 * is shared with the table via LocationValue / EngagementValue so the two can't
 * drift. Sorting comes from the shared SortBar above.
 */
function MobileList({
  rows, selectedId, closingId, onSelect, locationFor, onVisitorDeleted, onSaved,
}: {
  rows: VisitorSummary[]
  selectedId: string | null
  /** Row on its way out — still mounted so it can animate closed. */
  closingId: string | null
  onSelect: (id: string | null) => void
  /** Same resolver the table uses, so the "corrected" marker stays truthful. */
  locationFor: (v: VisitorSummary) => ReturnType<typeof resolveLocation>
  onVisitorDeleted?: (id: string) => void
  onSaved: (id: string, override: string | null) => void
}) {
  return (
    <div className="md:hidden">
      <ul className="flex flex-col gap-2">
        {rows.map(v => {
          const isOpen = selectedId === v.id
          const location = locationFor(v)
          const tags = classifyVisitor(v)
          return (
            <li key={v.id}>
              {/* Whole card is the tap target — 44px+ tall by construction. */}
              <button
                type="button"
                onClick={() => onSelect(isOpen ? null : v.id)}
                aria-expanded={isOpen}
                className={twMerge(
                  'w-full cursor-pointer rounded-xl border border-white/10 p-3 text-left transition-colors',
                  isOpen ? 'rounded-b-none bg-black/[0.5]' : 'bg-white/[0.03] hover:bg-white/[0.06]',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-xs font-semibold text-white/95">{shortId(v.id)}</span>
                  <span className="shrink-0 text-xs text-white/85">{formatShort(v.last_activity_at)}</span>
                </div>
                {tags.length > 0 && <VisitorTags tags={tags} className="mt-1" />}

                <div className="mt-1.5 truncate text-sm text-white/90">
                  <LocationValue location={location} />
                </div>

                {(v.contact_name || v.contact_email) && (
                  <div className="mt-1.5 min-w-0">
                    {v.contact_name && (
                      <div className="truncate text-sm font-semibold text-white/95">{v.contact_name}</div>
                    )}
                    {v.contact_email && (
                      <div className="truncate text-xs text-white/75">{v.contact_email}</div>
                    )}
                  </div>
                )}

                <div className="mt-2 flex items-center gap-4 border-t border-white/5 pt-2 text-xs tabular-nums">
                  <span className="text-white/90"><EngagementValue v={v} align="left" /></span>
                  <span className="ml-auto flex items-center gap-1 text-white/90">
                    <MessageSquare size={12} className="text-white/70" aria-hidden="true" />
                    <span className="sr-only">Chat messages: </span>
                    {v.chat_message_count || 0}
                  </span>
                  <span className={twMerge('flex items-center gap-1', v.contact_count ? 'font-semibold text-green-400' : 'text-white/90')}>
                    <MailCheck size={12} aria-hidden="true" className={v.contact_count ? '' : 'text-white/70'} />
                    <span className="sr-only">Contact submissions: </span>
                    {v.contact_count || 0}
                  </span>
                </div>
              </button>

              {(isOpen || closingId === v.id) && (
                <DetailCollapse open={isOpen}>
                  <VisitorDetail
                    id={v.id}
                    onClose={() => onSelect(null)}
                    onDeleted={onVisitorDeleted}
                    onSaved={onSaved}
                  />
                </DetailCollapse>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * Columns the table is rendering at the current width — 5 below `lg`, 6 below
 * `xl`, 8 above (see the header row).
 *
 * The open-detail row spans them with `colSpan`, and the number has to be
 * exact. A table's column count is the MAX across its rows, so a span wider
 * than the rendered set doesn't clamp — it invents phantom columns, and under
 * `table-fixed` those take a share of the free width. A hardcoded 9 halved the
 * Location column the moment a row was opened (430px → 215px at 1440, 110px →
 * 22px at 768). Too small is no better: the panel would stop short of the right
 * edge. Hence matchMedia — the folded column sets are a layout fact the CSS
 * knows and `colSpan` can't read.
 */
const LG = '(min-width: 1024px)'
const XL = '(min-width: 1280px)'

function readColumnCount() {
  if (typeof window === 'undefined') return 8
  if (window.matchMedia(XL).matches) return 8
  return window.matchMedia(LG).matches ? 6 : 5
}

function useColumnCount() {
  const [count, setCount] = useState(readColumnCount)
  useEffect(() => {
    const queries = [window.matchMedia(LG), window.matchMedia(XL)]
    const sync = () => setCount(readColumnCount())
    // Re-read on mount too: the first paint can land before the breakpoint
    // queries settle on a restored window size.
    sync()
    queries.forEach(q => q.addEventListener('change', sync))
    return () => queries.forEach(q => q.removeEventListener('change', sync))
  }, [])
  return count
}

export default function VisitorList({ visitors, onVisitorDeleted }: VisitorListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get('v')
  )
  const [page, setPage] = useState(1)
  const columnCount = useColumnCount()
  // The row that was just closed. It stays rendered for COLLAPSE_MS so the
  // collapse can play; without it, clicking to close would unmount the panel
  // instantly and there would be nothing left to animate.
  const [closingId, setClosingId] = useState<string | null>(null)
  const didRestore = useRef(false)
  // Locally applied location corrections, so the cell updates on save without
  // refetching the whole list.
  const [savedOverrides, setSavedOverrides] = useState<Record<string, string | null>>({})
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)

  // Sort against the label the cell actually shows, override included, so the
  // Location column can never order by something different from what's on screen.
  const locationFor = useCallback(
    (v: VisitorSummary) => resolveLocation(
      v.id in savedOverrides ? { ...v, location_override: savedOverrides[v.id] } : v
    ),
    [savedOverrides],
  )
  const labelFor = useCallback(
    (v: VisitorSummary) => locationFor(v).label,
    [locationFor],
  )

  const sorted = useMemo(
    () => sortVisitors(visitors, sort, labelFor),
    [visitors, sort, labelFor],
  )

  /**
   * Open a row, close one, or swap between two.
   *
   * The outgoing row is handed to `closingId` rather than dropped, and a
   * re-open of a row still animating out reclaims it immediately — otherwise it
   * would be mounted twice, once opening and once fading away.
   */
  const handleSelect = useCallback((id: string | null) => {
    // Read `selectedId` directly rather than from a setState updater: updaters
    // must be pure, and React would run this one twice in StrictMode.
    setClosingId(selectedId && selectedId !== id ? selectedId : null)
    setSelectedId(id)
  }, [selectedId])

  // Drop the closing row once its animation is over. A timer rather than
  // `transitionend`: under `prefers-reduced-motion` there is no transition, so
  // no event ever fires and the row would sit invisible in the DOM forever.
  useEffect(() => {
    if (!closingId) return
    const timer = setTimeout(() => setClosingId(null), COLLAPSE_MS)
    return () => clearTimeout(timer)
  }, [closingId])

  // Mirror of `sorted` for the restore-from-URL effect below. That effect must
  // stay keyed on the `visitors` prop alone — depending on `sorted` would make
  // it re-run on every sort click and on every saved location override, which
  // would quietly reset pagination each time.
  // `useRef(sorted)` seeds it for the mount pass; the effect keeps it current
  // afterwards. Writing a ref during render is unsafe under concurrent
  // rendering, and the lint rule is right to reject it.
  const sortedRef = useRef(sorted)
  useEffect(() => { sortedRef.current = sorted }, [sorted])

  const handleSort = useCallback((key: SortKey) => {
    setSort(current => nextSort(current, key))
    // Back to the top: you asked for a new ordering, so page 3 of the old one is
    // meaningless. The selection survives in the URL either way.
    setPage(1)
  }, [])

  // On first visitors load: restore selectedId's page from URL. On subsequent
  // changes (search filtering): reset to page 1, close detail if no longer visible.
  useEffect(() => {
    if (!didRestore.current) {
      didRestore.current = true
      setSelectedId(current => {
        if (!current) return current
        const idx = sortedRef.current.findIndex(v => v.id === current)
        if (idx === -1) return null
        setPage(Math.floor(idx / PAGE_SIZE) + 1)
        return current
      })
    } else {
      setPage(1)
      setSelectedId(current => {
        if (current && !visitors.some(v => v.id === current)) return null
        return current
      })
    }
  }, [visitors])

  // Sync selectedId to URL query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (selectedId) {
      params.set('v', selectedId)
    } else {
      params.delete('v')
    }
    const qs = params.toString()
    history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }, [selectedId])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageVisitors = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const rangeStart = (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, sorted.length)

  return (
    <div>
      <SortBar sort={sort} onSort={handleSort} className="xl:hidden" />

      {/* Three column sets, one table.
          Below `md` the rows render as cards instead (see MobileList) — a
          horizontally scrolling table on a phone means never seeing a whole row.
          `md`–`lg`: five columns. The fixed widths of the full set sum to
          exactly the old 58rem min-width, so `table-fixed` gave Location — the
          only flexible column — zero width, and its cells drew on top of
          Contact. Flags fold into the Visitor cell and the three count columns
          fold into one, which leaves Location real width at every size.
          `lg`: Flags gets its column back. `xl`: the full eight.
          Nothing is dropped, only merged, and SortBar keeps the folded columns'
          sort keys reachable. */}
      <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[42rem] table-fixed text-sm xl:min-w-[66rem]">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/85">
            <SortHeader label="Visitor"  sortKey="visitor"  sort={sort} onSort={handleSort} className="px-4 w-36 lg:w-32" />
            <SortHeader
              label="Flags" sortKey="flags" sort={sort} onSort={handleSort} className="hidden w-44 lg:table-cell"
              title="Heuristic traffic-quality flags. Sorts by severity — possible spam first, then automated, then bounces."
            />
            {/* 8.5rem, not 8: the widest realistic value ("May 28, 10:01 AM")
                measures 114px, and w-32 left 112px inside the gutter — so the
                one row a month with a two-digit hour wrapped to two lines. */}
            <SortHeader label="Last seen" sortKey="lastSeen" sort={sort} onSort={handleSort} className="w-34 xl:w-36" />
            {/* Location takes the spare width, not Contact: most visitors are
                anonymous, so a flexible Contact column just grew whitespace,
                while a corrected location can be a long hand-typed string. */}
            <SortHeader label="Location" sortKey="location" sort={sort} onSort={handleSort} />
            <SortHeader label="Contact"  sortKey="contact"  sort={sort} onSort={handleSort} className="w-40 lg:w-48 xl:w-56" />
            {/* Merged below xl, split above it. Both carry the engagement sort
                key — it is the column's primary value either way. */}
            <SortHeader
              label="Activity" sortKey="engagement" sort={sort} onSort={handleSort}
              className="text-right w-36 xl:hidden" align="right"
              title="Page views and engaged time, with chat messages and submissions. Sorts by views, then engaged time."
            />
            <SortHeader
              label="Engagement" sortKey="engagement" sort={sort} onSort={handleSort}
              className="hidden text-right w-28 xl:table-cell" align="right"
              title="Page views and engaged time across all sessions. Sorts by views, then engaged time."
            />
            <SortHeader label="Chat" sortKey="chat" sort={sort} onSort={handleSort}
              className="hidden text-right w-16 xl:table-cell" align="right" title="Chat messages" />
            <SortHeader label="Sent" sortKey="sent" sort={sort} onSort={handleSort}
              className="hidden text-right w-20 xl:table-cell" align="right" title="Contact form submissions" />
          </tr>
        </thead>
        <tbody>
          {pageVisitors.map(v => {
            const isOpen = selectedId === v.id
            const location = locationFor(v)
            const tags = classifyVisitor(v)
            return (
              <Fragment key={v.id}>
                <tr
                  onClick={() => handleSelect(isOpen ? null : v.id)}
                  className={twMerge(
                    'cursor-pointer border-b border-white/5 transition-colors',
                    isOpen ? 'bg-black/[0.65]' : 'hover:bg-black/[0.15]'
                  )}
                >
                  <td className="py-3 px-4">
                    <div className="truncate font-mono text-xs font-semibold text-white/95">{shortId(v.id)}</div>
                    {/* Below `lg` the Flags column is folded away, so the badges
                        ride under the id — the same stacking the phone card uses. */}
                    {tags.length > 0 && <VisitorTags tags={tags} className="mt-1 lg:hidden" />}
                  </td>
                  <td className="hidden py-3 pr-4 lg:table-cell">
                    {tags.length > 0 ? <VisitorTags tags={tags} /> : <Dash />}
                  </td>
                  <td className="truncate py-3 pr-4 text-white/85">{formatShort(v.last_activity_at)}</td>
                  <td className="py-3 pr-4 text-white/90 truncate">
                    <LocationValue location={location} />
                  </td>
                  <td className="py-3 pr-4 truncate">
                    <ContactValue v={v} />
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums xl:hidden">
                    <ActivityValue v={v} />
                  </td>
                  <td className="hidden py-3 pr-4 text-right tabular-nums xl:table-cell">
                    <EngagementValue v={v} />
                  </td>
                  <td className="hidden py-3 pr-4 text-right text-white xl:table-cell">
                    {v.chat_message_count || <Dash />}
                  </td>
                  {/* Semantic color earns its place here: a submission is the
                      one real conversion signal in the table. Always paired with
                      an icon, never color alone. green-400 is 7.04:1 on the canvas. */}
                  <td className="hidden py-3 pr-4 text-right xl:table-cell">
                    {v.contact_count ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-green-400">
                        <MailCheck size={12} strokeWidth={2.5} aria-hidden="true" />
                        {v.contact_count}
                      </span>
                    ) : <Dash />}
                  </td>
                </tr>
                {(isOpen || closingId === v.id) && (
                  <tr>
                    {/* Exactly the columns on screen — see useColumnCount. The
                        cell carries no padding: it would survive the collapse
                        and leave a gap where the row used to be. */}
                    <td colSpan={columnCount} className="p-0">
                      <DetailCollapse open={isOpen}>
                        <div className="pb-3">
                          <VisitorDetail
                            id={v.id}
                            onClose={() => handleSelect(null)}
                            onDeleted={onVisitorDeleted}
                            onSaved={(id, override) =>
                              setSavedOverrides(prev => ({ ...prev, [id]: override }))
                            }
                          />
                        </div>
                      </DetailCollapse>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
      </div>

      <MobileList
        rows={pageVisitors}
        selectedId={selectedId}
        closingId={closingId}
        onSelect={handleSelect}
        locationFor={locationFor}
        onVisitorDeleted={onVisitorDeleted}
        onSaved={(id, override) => setSavedOverrides(prev => ({ ...prev, [id]: override }))}
      />

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-white/65">
            Showing {rangeStart}–{rangeEnd} of {visitors.length}
          </p>
          <div className="flex gap-1">
            <Button
              variant="raised-dark" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}
              leftIcon={<ChevronLeft aria-hidden="true" />}
            >
              Prev
            </Button>
            <Button
              variant="raised-dark" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
              rightIcon={<ChevronRight aria-hidden="true" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
