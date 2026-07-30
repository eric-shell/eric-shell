import { Fragment, useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, MailCheck } from 'lucide-react'
import VisitorDetail from './VisitorDetail'
import { Button } from '../../components/ui'
import { twMerge } from 'tailwind-merge'
import type { VisitorSummary } from '@/../api/_lib/types'
import { formatDuration, formatShort } from '../lib/dateFormat'
import { resolveLocation } from '../lib/location'

export type { VisitorSummary }

const PAGE_SIZE = 25

interface VisitorListProps {
  visitors: VisitorSummary[]
  onVisitorDeleted?: (id: string) => void
}

function shortId(id: string) {
  return id.slice(0, 8)
}

/** Muted placeholder. Most rows are anonymous readers, so this appears a lot. */
function Dash() {
  return <span className="text-blue-950/25">—</span>
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

  // On first visitors load: restore selectedId's page from URL. On subsequent
  // changes (search filtering): reset to page 1, close detail if no longer visible.
  useEffect(() => {
    if (!didRestore.current) {
      didRestore.current = true
      setSelectedId(current => {
        if (!current) return current
        const idx = visitors.findIndex(v => v.id === current)
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

  const totalPages = Math.ceil(visitors.length / PAGE_SIZE)
  const pageVisitors = visitors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const rangeStart = (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, visitors.length)

  return (
    <div>
      {/* Telemetry pushed this to nine columns, which blew the page out past the
          viewport below ~md. The table keeps a comfortable min-width and scrolls
          inside its own container instead of dragging the body wide. */}
      <div className="overflow-x-auto">
      <table className="w-full min-w-[54rem] table-fixed text-sm">
        <thead>
          <tr className="border-b border-blue-950/10 text-left text-xs uppercase tracking-wide text-blue-950/70">
            <th className="py-2 px-4 font-semibold w-28">Visitor</th>
            <th className="py-2 pr-4 font-semibold w-36">Last seen</th>
            {/* Location takes the spare width, not Contact: most visitors are
                anonymous, so a flexible Contact column just grew whitespace,
                while a corrected location can be a long hand-typed string. */}
            <th className="py-2 pr-4 font-semibold">Location</th>
            <th className="py-2 pr-4 font-semibold w-56">Contact</th>
            <th className="py-2 pr-4 font-semibold text-right w-28" title="Page views and engaged time across all sessions">Engagement</th>
            <th className="py-2 pr-4 font-semibold text-right w-16" title="Chat messages">Chat</th>
            <th className="py-2 pr-4 font-semibold text-right w-20" title="Contact form submissions">Sent</th>
          </tr>
        </thead>
        <tbody>
          {pageVisitors.map(v => {
            const isOpen = selectedId === v.id
            const location = resolveLocation(
              v.id in savedOverrides ? { ...v, location_override: savedOverrides[v.id] } : v
            )
            return (
              <Fragment key={v.id}>
                <tr
                  onClick={() => setSelectedId(isOpen ? null : v.id)}
                  className={twMerge(
                    'cursor-pointer border-b border-blue-950/5 transition-colors',
                    isOpen ? 'bg-blue-50' : 'hover:bg-blue-50/60'
                  )}
                >
                  <td className="py-3 px-4 text-blue-950/90 font-mono text-xs font-semibold truncate">{shortId(v.id)}</td>
                  <td className="py-3 pr-4 text-blue-950/70">{formatShort(v.last_activity_at)}</td>
                  <td className="py-3 pr-4 text-blue-950/80 truncate">
                    {location.label
                      ? <span title={location.approximate
                          ? 'Approximate — from IP geolocation'
                          : 'Manually corrected'}>
                          {location.label}
                          {/* Nearly every location is IP-derived, so marking the
                              exception reads far quieter than marking the rule. */}
                          {!location.approximate && (
                            <Check size={11} className="ml-1 inline-block align-[-1px] text-blue-950/40" aria-label="corrected" />
                          )}
                        </span>
                      : <Dash />}
                  </td>
                  {/* Name over email in one column: most visitors are anonymous
                      readers now, and two separate columns of em-dashes wasted
                      the widest part of the table. */}
                  <td className="py-3 pr-4 truncate">
                    {v.contact_name || v.contact_email ? (
                      <div className="min-w-0">
                        {v.contact_name && (
                          <div className="truncate font-semibold text-blue-950/90">{v.contact_name}</div>
                        )}
                        {v.contact_email && (
                          <div className="truncate text-xs text-blue-950/60">{v.contact_email}</div>
                        )}
                      </div>
                    ) : <Dash />}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {v.page_view_count > 0 || v.total_engaged_ms > 0 ? (
                      <div>
                        <div className="text-blue-950">
                          {v.page_view_count} {v.page_view_count === 1 ? 'view' : 'views'}
                        </div>
                        {v.total_engaged_ms > 0 && (
                          <div className="text-xs text-blue-950/60">{formatDuration(v.total_engaged_ms)}</div>
                        )}
                      </div>
                    ) : <Dash />}
                  </td>
                  <td className="py-3 pr-4 text-right text-blue-950">
                    {v.chat_message_count || <Dash />}
                  </td>
                  {/* Semantic color earns its place here: a submission is the
                      one real conversion signal in the table. Always paired with
                      an icon, never color alone. green-700 is 5.96:1 on white. */}
                  <td className="py-3 pr-4 text-right">
                    {v.contact_count ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-green-700">
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

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-blue-950/50">
            Showing {rangeStart}–{rangeEnd} of {visitors.length}
          </p>
          <div className="flex gap-1">
            <Button variant="white" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              <ChevronLeft size={14} />Prev
            </Button>
            <Button variant="white" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
              Next<ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
