import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import { twMerge } from 'tailwind-merge'
import { type LucideIcon, CalendarDays, Clock, Eye, Fingerprint, Mail, Monitor, RotateCcw, User, X } from 'lucide-react'
import { Button, Panel, toast } from '../../components/ui'
import { Skeleton } from './Skeleton'

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 flex gap-8 border-b border-blue-950/10 pb-2.5">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex justify-end"><Skeleton className="h-9 w-48 rounded-2xl" /></div>
        <div className="flex justify-start"><Skeleton className="h-16 w-64 rounded-2xl" /></div>
        <div className="flex justify-end"><Skeleton className="h-9 w-36 rounded-2xl" /></div>
        <div className="flex justify-start"><Skeleton className="h-12 w-52 rounded-2xl" /></div>
      </div>
    </div>
  )
}

const EMAIL_RE = /(?<!\]\(mailto:)(?<!\[)([\w.+-]+@[\w-]+\.[\w.-]+)(?!\w)(?!\]\(mailto:)/g
const linkifyEmail = (text: string) => text.replace(EMAIL_RE, '[$1](mailto:$1)')

const mdComponents: Components = {
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
      {...props}
    >
      {children}
    </a>
  ),
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 last:mb-0 [&_li>p]:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 last:mb-0 [&_li>p]:mb-0">{children}</ol>,
  li: ({ children }) => <li className="mb-1.5 last:mb-0">{children}</li>,
  code: ({ children }) => <code className="px-1 py-0.5 rounded bg-blue-100 font-mono text-xs">{children}</code>,
  strong: ({ children }) => <span className="font-semibold">{children}</span>,
}

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
  events: Record<string, number>
  clearEvents: { created_at: string }[]
}

type Tab = 'chat' | 'contact'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function MetaField({ icon: Icon, label, value, mono = false }: {
  icon: LucideIcon
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-blue-950/10">
        <Icon size={13} className="text-blue-950/70" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-blue-950/70 mb-0.5">{label}</p>
        <p className={twMerge('text-xs font-semibold text-blue-950/80', mono && 'font-mono')}>{value}</p>
      </div>
    </div>
  )
}

type TimelineItem =
  | { kind: 'message'; data: ChatMessage }
  | { kind: 'cleared'; created_at: string }

function ConversationDivider({ timestamp }: { timestamp: string }) {
  return (
    <li className="flex flex-col items-center gap-1.5 py-1 select-none" aria-label="Conversation cleared">
      <div className="w-full text-blue-950/20" aria-hidden="true">
        <svg width="100%" height="14" viewBox="0 0 300 14" preserveAspectRatio="none" fill="none">
          <path
            d="M0 7 Q15 1 30 7 Q45 13 60 7 Q75 1 90 7 Q105 13 120 7 Q135 1 150 7 Q165 13 180 7 Q195 1 210 7 Q225 13 240 7 Q255 1 270 7 Q285 13 300 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="text-[10px] uppercase tracking-wide text-blue-950/35">
        Conversation cleared · {formatDate(timestamp)}
      </span>
    </li>
  )
}

export default function VisitorDetail({ id, onClose }: VisitorDetailProps) {
  const [data, setData] = useState<DetailPayload | null>(null)
  const [tab, setTab] = useState<Tab>('chat')

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

  const contact = data?.submissions[0]

  return (
    <Panel variant="white" className="rounded-b-xl rounded-t-none p-5">
      {/* Meta grid */}
      <div className="mb-5 flex items-start justify-between gap-6">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 flex-1 min-w-0">
          <MetaField icon={Fingerprint} label="Visitor ID" value={id} mono />
          {data === null ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 min-w-0 animate-pulse">
                <Skeleton className="shrink-0 w-7 h-7 rounded-full" />
                <div className="min-w-0 space-y-1.5">
                  <Skeleton className="h-2 w-10" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))
          ) : (
            <>
              {contact?.name   && <MetaField icon={User}  label="Name"  value={contact.name} />}
              {contact?.email  && <MetaField icon={Mail}  label="Email" value={contact.email} />}
              {data.visitor && (
                <>
                  <MetaField icon={CalendarDays} label="First seen" value={formatDate(data.visitor.first_seen_at)} />
                  <MetaField icon={Clock}        label="Last seen"  value={formatDate(data.visitor.last_seen_at)} />
                </>
              )}
              {data.visitor?.user_agent && (
                <MetaField icon={Monitor} label="User agent" value={data.visitor.user_agent} />
              )}
              {(data.events.ada_toggle ?? 0) > 0 && (
                <MetaField icon={Eye} label="High-contrast" value={`${data.events.ada_toggle}×`} />
              )}
              {(data.events.chat_cleared ?? 0) > 0 && (
                <MetaField icon={RotateCcw} label="Chats cleared" value={`${data.events.chat_cleared}×`} />
              )}
            </>
          )}
        </div>
        <Button variant="white" size="sm" shape="square" className="rounded-full" onClick={onClose}>
          <X size={13} />
        </Button>
      </div>

      {data === null ? (
        <DetailSkeleton />
      ) : (
        <>
          {/* Tabs */}
          <div className="mb-4 flex border-b border-blue-950/10">
            {([
              ['chat', `Chat (${data.messages.length})`],
              ['contact', `Contact (${data.submissions.length})`],
            ] as [Tab, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={twMerge(
                  'cursor-pointer px-4 py-2 text-xs font-semibold uppercase tracking-wide border-b-2 -mb-px transition-colors',
                  tab === key
                    ? 'border-blue-950 text-blue-950'
                    : 'border-transparent text-blue-950/40 hover:text-blue-950/70'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab panels */}
          {tab === 'chat' && (() => {
            if (data.messages.length === 0) {
              return <p className="text-sm text-blue-950/50">No chat messages.</p>
            }
            const timeline: TimelineItem[] = []
            let ci = 0
            for (const msg of data.messages) {
              while (ci < data.clearEvents.length && data.clearEvents[ci].created_at <= msg.created_at) {
                timeline.push({ kind: 'cleared', created_at: data.clearEvents[ci].created_at })
                ci++
              }
              timeline.push({ kind: 'message', data: msg })
            }
            while (ci < data.clearEvents.length) {
              timeline.push({ kind: 'cleared', created_at: data.clearEvents[ci++].created_at })
            }
            return (
              <ul className="flex flex-col gap-3">
                {timeline.map((item, i) =>
                  item.kind === 'cleared' ? (
                    <ConversationDivider key={`clear-${i}`} timestamp={item.created_at} />
                  ) : (
                    <li
                      key={item.data.id}
                      className={twMerge('flex flex-col', item.data.role === 'user' ? 'items-end' : 'items-start')}
                    >
                      <Panel
                        variant={item.data.role === 'user' ? 'primary' : 'white'}
                        className={twMerge(
                          'max-w-[85%] rounded-2xl px-4 py-2.5 font-sans text-sm',
                          item.data.role === 'user' ? 'whitespace-pre-wrap shadow-sm' : 'shadow-sm'
                        )}
                      >
                        {item.data.role === 'user'
                          ? item.data.content
                          : <ReactMarkdown components={mdComponents}>{linkifyEmail(item.data.content)}</ReactMarkdown>}
                      </Panel>
                      <span className="mt-1.5 px-2 text-[10px] uppercase tracking-wide text-blue-950/70">
                        {formatDate(item.data.created_at)}
                      </span>
                    </li>
                  )
                )}
              </ul>
            )
          })()}

          {tab === 'contact' && (
            data.submissions.length === 0 ? (
              <p className="text-sm text-blue-950/50">No contact submissions.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {data.submissions.map(s => (
                  <li key={s.id} className="rounded-lg border border-blue-950/10 bg-white p-3 text-sm">
                    <div className="mb-1 flex items-center justify-between text-[10px] text-blue-950/50">
                      <span><span className="font-semibold text-blue-950">{s.name}</span> · {s.email}</span>
                      <span className="text-blue-950/70">{formatDate(s.created_at)}</span>
                    </div>
                    <div className="whitespace-pre-wrap text-blue-950/80">{s.message}</div>
                  </li>
                ))}
              </ul>
            )
          )}
        </>
      )}
    </Panel>
  )
}
