import { Fragment, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import VisitorDetail from './VisitorDetail'
import { Button } from '../../components/ui'
import { twMerge } from 'tailwind-merge'

const PAGE_SIZE = 25

export interface VisitorSummary {
  id: string
  first_seen_at: string
  last_seen_at: string
  user_agent: string | null
  country: string | null
  city: string | null
  referrer: string | null
  chat_message_count: number
  contact_count: number
  last_activity_at: string
  contact_name: string | null
  contact_email: string | null
}

interface VisitorListProps {
  visitors: VisitorSummary[]
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function shortId(id: string) {
  return id.slice(0, 8)
}

export default function VisitorList({ visitors }: VisitorListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get('v')
  )
  const [page, setPage] = useState(1)
  const didRestore = useRef(false)

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
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="border-b border-blue-950/10 text-left text-xs uppercase tracking-wide text-blue-950/70">
            <th className="py-2 px-4 font-semibold w-28">Visitor</th>
            <th className="py-2 pr-4 font-semibold w-36">Last seen</th>
            <th className="py-2 pr-4 font-semibold w-36">Name</th>
            <th className="py-2 pr-4 font-semibold">Email</th>
            <th className="py-2 pr-4 font-semibold text-right w-16">Chat</th>
            <th className="py-2 pr-4 font-semibold text-right w-24">Contact</th>
          </tr>
        </thead>
        <tbody>
          {pageVisitors.map(v => {
            const isOpen = selectedId === v.id
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
                  <td className="py-3 pr-4 text-blue-950/70">{formatDate(v.last_activity_at)}</td>
                  <td className="py-3 pr-4 text-blue-950/80 truncate">{v.contact_name ?? <span className="text-blue-950/25">—</span>}</td>
                  <td className="py-3 pr-4 text-blue-950/80 truncate">{v.contact_email ?? <span className="text-blue-950/25">—</span>}</td>
                  <td className="py-3 pr-4 text-right text-blue-950">{v.chat_message_count}</td>
                  <td className="py-3 pr-4 text-right text-blue-950">{v.contact_count}</td>
                </tr>
                {isOpen && (
                  <tr>
                    <td colSpan={6} className="pb-3 pt-0">
                      <VisitorDetail id={v.id} onClose={() => setSelectedId(null)} />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>

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
