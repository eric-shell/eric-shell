import { useEffect, useState } from 'react'
import { Button, H3, Panel, toast } from '../../components/ui'

interface VisitorDetailProps {
  id: string
  onClose: () => void
}

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface ContactSubmission {
  id: number
  name: string
  email: string
  message: string
  created_at: string
}

interface Visitor {
  id: string
  first_seen_at: string
  last_seen_at: string
  user_agent: string | null
}

interface DetailPayload {
  visitor: Visitor
  messages: ChatMessage[]
  submissions: ContactSubmission[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString()
}

export default function VisitorDetail({ id, onClose }: VisitorDetailProps) {
  const [data, setData] = useState<DetailPayload | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/admin/visitors/${id}`)
        if (!res.ok) {
          toast.error('Failed to load visitor.')
          return
        }
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch {
        toast.error('Network error.')
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  return (
    <Panel variant="white" className="rounded-2xl p-6">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <H3 className="text-blue-950">Visitor</H3>
          <p className="font-mono text-xs text-blue-950/60">{id}</p>
          {data?.visitor && (
            <p className="mt-1 text-xs text-blue-950/50">
              First seen {formatDate(data.visitor.first_seen_at)} · Last seen {formatDate(data.visitor.last_seen_at)}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </header>

      {data === null ? (
        <p className="text-sm text-blue-950/50">Loading…</p>
      ) : (
        <div className="flex flex-col gap-6">
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-950/50">
              Chat ({data.messages.length})
            </h4>
            {data.messages.length === 0 ? (
              <p className="text-sm text-blue-950/50">No chat messages.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.messages.map(m => (
                  <li
                    key={m.id}
                    className={
                      m.role === 'user'
                        ? 'rounded-lg bg-blue-100 p-3 text-sm text-blue-950'
                        : 'rounded-lg bg-blue-50 p-3 text-sm text-blue-950/80'
                    }
                  >
                    <div className="mb-1 flex items-center justify-between text-xs text-blue-950/50">
                      <span className="font-semibold uppercase tracking-wide">{m.role}</span>
                      <span>{formatDate(m.created_at)}</span>
                    </div>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-950/50">
              Contact submissions ({data.submissions.length})
            </h4>
            {data.submissions.length === 0 ? (
              <p className="text-sm text-blue-950/50">No contact submissions.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {data.submissions.map(s => (
                  <li key={s.id} className="rounded-lg border border-blue-950/10 p-3 text-sm">
                    <div className="mb-1 flex items-center justify-between text-xs text-blue-950/50">
                      <span><span className="font-semibold text-blue-950">{s.name}</span> · {s.email}</span>
                      <span>{formatDate(s.created_at)}</span>
                    </div>
                    <div className="whitespace-pre-wrap text-blue-950/80">{s.message}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Panel>
  )
}
