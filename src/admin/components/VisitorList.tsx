import { Fragment, useState } from 'react'
import VisitorDetail from './VisitorDetail'
import { twMerge } from 'tailwind-merge'

export interface VisitorSummary {
  id: string
  first_seen_at: string
  last_seen_at: string
  user_agent: string | null
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
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <table className="w-full table-fixed text-sm">
      <thead>
        <tr className="border-b border-blue-950/10 text-left text-xs uppercase tracking-wide text-blue-950/50">
          <th className="py-2 px-4 font-semibold w-28">Visitor</th>
          <th className="py-2 pr-4 font-semibold w-36">Last seen</th>
          <th className="py-2 pr-4 font-semibold w-36">Name</th>
          <th className="py-2 pr-4 font-semibold">Email</th>
          <th className="py-2 pr-4 font-semibold text-right w-16">Chat</th>
          <th className="py-2 pr-4 font-semibold text-right w-16">Contact</th>
        </tr>
      </thead>
      <tbody>
        {visitors.map(v => {
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
                <td className="py-3 px-4 font-mono text-xs text-blue-950">{shortId(v.id)}</td>
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
  )
}
