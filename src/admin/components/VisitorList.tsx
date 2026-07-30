import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, MailCheck, MessageSquare } from 'lucide-react'
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
          quieter than marking the rule. */}
      {!location.approximate && (
        <Check size={11} className="ml-1 inline-block align-[-1px] text-white/80" aria-label="corrected" />
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
 * Phone rendering of the visitor list.
 *
 * A horizontally scrolling table on a 412px screen means the reader never sees
 * a whole row, so each visitor becomes a self-contained card instead. Content
 * is shared with the table via LocationValue / EngagementValue so the two can't
 * drift.
 *
 * Sorting moves to a native `<select>`: there are no column headers to click,
 * and on Android a native select opens the OS picker — better than a custom
 * listbox on a small touch screen, and accessible without extra work.
 */
function MobileList({
  rows, sort, onSort, selectedId, onSelect, locationFor, onVisitorDeleted, onSaved,
}: {
  rows: VisitorSummary[]
  sort: SortState
  onSort: (key: SortKey) => void
  selectedId: string | null
  onSelect: (id: string | null) => void
  /** Same resolver the table uses, so the "corrected" marker stays truthful. */
  locationFor: (v: VisitorSummary) => ReturnType<typeof resolveLocation>
  onVisitorDeleted?: (id: string) => void
  onSaved: (id: string, override: string | null) => void
}) {
  const dirLabel = sort.dir === 'asc' ? 'ascending' : 'descending'
  return (
    <div className="md:hidden">
      <div className="mb-3 flex items-center gap-2">
        <label htmlFor="visitor-sort" className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-white/75">
          Sort
        </label>
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
        <button
          type="button"
          onClick={() => onSort(sort.key)}
          aria-label={`Sort ${dirLabel}, tap to reverse`}
          title={`Sorted ${dirLabel}`}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/90 transition-colors hover:bg-white/[0.09]"
        >
          {sort.dir === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

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
                {tags.length > 0 && <VisitorTags tags={tags} />}

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

              {isOpen && (
                <VisitorDetail
                  id={v.id}
                  onClose={() => onSelect(null)}
                  onDeleted={onVisitorDeleted}
                  onSaved={onSaved}
                />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function VisitorList({ visitors, onVisitorDeleted }: VisitorListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get('v')
  )
  const [page, setPage] = useState(1)
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
      {/* Telemetry pushed this to nine columns, which blew the page out past the
          viewport below ~md. The table keeps a comfortable min-width and scrolls
          inside its own container instead of dragging the body wide. */}
      {/* The table needs 54rem to breathe. On a phone that is wider than the
          viewport, which made the browser zoom the whole page out. Below `md`
          the same rows render as cards instead — see MobileList. */}
      <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[54rem] table-fixed text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/85">
            <SortHeader label="Visitor"  sortKey="visitor"  sort={sort} onSort={handleSort} className="px-4 w-40" />
            <SortHeader label="Last seen" sortKey="lastSeen" sort={sort} onSort={handleSort} className="w-36" />
            {/* Location takes the spare width, not Contact: most visitors are
                anonymous, so a flexible Contact column just grew whitespace,
                while a corrected location can be a long hand-typed string. */}
            <SortHeader label="Location" sortKey="location" sort={sort} onSort={handleSort} />
            <SortHeader label="Contact"  sortKey="contact"  sort={sort} onSort={handleSort} className="w-56" />
            <SortHeader
              label="Engagement" sortKey="engagement" sort={sort} onSort={handleSort}
              className="text-right w-28" align="right"
              title="Page views and engaged time across all sessions. Sorts by views, then engaged time."
            />
            <SortHeader label="Chat" sortKey="chat" sort={sort} onSort={handleSort}
              className="text-right w-16" align="right" title="Chat messages" />
            <SortHeader label="Sent" sortKey="sent" sort={sort} onSort={handleSort}
              className="text-right w-20" align="right" title="Contact form submissions" />
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
                  onClick={() => setSelectedId(isOpen ? null : v.id)}
                  className={twMerge(
                    'cursor-pointer border-b border-white/5 transition-colors',
                    isOpen ? 'bg-black/[0.65]' : 'hover:bg-black/[0.15]'
                  )}
                >
                  <td className="py-3 px-4 align-top">
                    <div className="truncate font-mono text-xs font-semibold text-white/95">{shortId(v.id)}</div>
                    <VisitorTags tags={tags} />
                  </td>
                  <td className="py-3 pr-4 text-white/85">{formatShort(v.last_activity_at)}</td>
                  <td className="py-3 pr-4 text-white/90 truncate">
                    <LocationValue location={location} />
                  </td>
                  {/* Name over email in one column: most visitors are anonymous
                      readers now, and two separate columns of em-dashes wasted
                      the widest part of the table. */}
                  <td className="py-3 pr-4 truncate">
                    {v.contact_name || v.contact_email ? (
                      <div className="min-w-0">
                        {v.contact_name && (
                          <div className="truncate font-semibold text-white/95">{v.contact_name}</div>
                        )}
                        {v.contact_email && (
                          <div className="truncate text-xs text-white/75">{v.contact_email}</div>
                        )}
                      </div>
                    ) : <Dash />}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    <EngagementValue v={v} />
                  </td>
                  <td className="py-3 pr-4 text-right text-white">
                    {v.chat_message_count || <Dash />}
                  </td>
                  {/* Semantic color earns its place here: a submission is the
                      one real conversion signal in the table. Always paired with
                      an icon, never color alone. green-400 is 7.04:1 on the canvas. */}
                  <td className="py-3 pr-4 text-right">
                    {v.contact_count ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-green-400">
                        <MailCheck size={12} strokeWidth={2.5} aria-hidden="true" />
                        {v.contact_count}
                      </span>
                    ) : <Dash />}
                  </td>
                </tr>
                {isOpen && (
                  <tr>
                    <td colSpan={7} className="pb-3 pt-0">
                      <VisitorDetail
                        id={v.id}
                        onClose={() => setSelectedId(null)}
                        onDeleted={onVisitorDeleted}
                        onSaved={(id, override) =>
                          setSavedOverrides(prev => ({ ...prev, [id]: override }))
                        }
                      />
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
        sort={sort}
        onSort={handleSort}
        selectedId={selectedId}
        onSelect={setSelectedId}
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
