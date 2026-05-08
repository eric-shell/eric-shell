export interface VisitorSummary {
  id: string
  first_seen_at: string
  last_seen_at: string
  user_agent: string | null
  chat_message_count: number
  contact_count: number
  last_activity_at: string
}

interface VisitorListProps {
  visitors: VisitorSummary[]
  onSelect: (id: string) => void
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

export default function VisitorList({ visitors, onSelect }: VisitorListProps) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-blue-950/10 text-left text-xs uppercase tracking-wide text-blue-950/50">
          <th className="py-2 pr-4 font-semibold">Visitor</th>
          <th className="py-2 pr-4 font-semibold">Last seen</th>
          <th className="py-2 pr-4 font-semibold text-right">Chat msgs</th>
          <th className="py-2 pr-4 font-semibold text-right">Contact</th>
          <th className="py-2 font-semibold">User agent</th>
        </tr>
      </thead>
      <tbody>
        {visitors.map(v => (
          <tr
            key={v.id}
            onClick={() => onSelect(v.id)}
            className="cursor-pointer border-b border-blue-950/5 hover:bg-blue-50"
          >
            <td className="py-3 pr-4 font-mono text-xs text-blue-950">{shortId(v.id)}</td>
            <td className="py-3 pr-4 text-blue-950/70">{formatDate(v.last_activity_at)}</td>
            <td className="py-3 pr-4 text-right text-blue-950">{v.chat_message_count}</td>
            <td className="py-3 pr-4 text-right text-blue-950">{v.contact_count}</td>
            <td className="py-3 max-w-xs truncate text-xs text-blue-950/50">{v.user_agent ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
