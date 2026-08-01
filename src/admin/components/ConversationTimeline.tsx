import { useEffect, useRef } from 'react'
import { twMerge } from 'tailwind-merge'
import { Markdown, Panel } from '../../components/ui'
import { adminMdComponents } from '../../lib/markdown'
import { formatLong } from '../lib/dateFormat'
import type { ChatMessage } from '@/../api/_lib/types'

interface Props {
  messages: ChatMessage[]
  clearEvents: { created_at: string }[]
  scrollDep?: unknown
}

type TimelineItem =
  | { kind: 'message'; data: ChatMessage }
  | { kind: 'cleared'; created_at: string }

function buildTimeline(messages: ChatMessage[], clearEvents: { created_at: string }[]): TimelineItem[] {
  const timeline: TimelineItem[] = []
  let ci = 0
  for (const msg of messages) {
    while (ci < clearEvents.length && clearEvents[ci].created_at <= msg.created_at) {
      timeline.push({ kind: 'cleared', created_at: clearEvents[ci].created_at })
      ci++
    }
    timeline.push({ kind: 'message', data: msg })
  }
  while (ci < clearEvents.length) {
    timeline.push({ kind: 'cleared', created_at: clearEvents[ci++].created_at })
  }
  return timeline
}

function ConversationDivider({ timestamp }: { timestamp: string }) {
  return (
    <li className="flex flex-col items-center gap-1.5 py-1 select-none" aria-label="Conversation cleared">
      <div className="w-full text-white/40" aria-hidden="true">
        <svg width="100%" height="30" viewBox="0 0 300 30" preserveAspectRatio="none" fill="none">
          <path
            d="M0 15 Q5 1 10 15 Q15 29 20 15 Q25 1 30 15 Q35 29 40 15 Q45 1 50 15 Q55 29 60 15 Q65 1 70 15 Q75 29 80 15 Q85 1 90 15 Q95 29 100 15 Q105 1 110 15 Q115 29 120 15 Q125 1 130 15 Q135 29 140 15 Q145 1 150 15 Q155 29 160 15 Q165 1 170 15 Q175 29 180 15 Q185 1 190 15 Q195 29 200 15 Q205 1 210 15 Q215 29 220 15 Q225 1 230 15 Q235 29 240 15 Q245 1 250 15 Q255 29 260 15 Q265 1 270 15 Q275 29 280 15 Q285 1 290 15 Q295 29 300 15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <span className="text-[10px] uppercase tracking-wide text-white/75">
        Conversation cleared · {formatLong(timestamp)}
      </span>
    </li>
  )
}

export default function ConversationTimeline({ messages, clearEvents, scrollDep }: Props) {
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [scrollDep])

  if (messages.length === 0) {
    return <p className="text-sm text-white/65">No chat messages.</p>
  }

  const timeline = buildTimeline(messages, clearEvents)

  return (
    <ul ref={listRef} className="flex flex-col gap-3 max-h-[28rem] overflow-y-auto pr-1">
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
                'max-w-[85%] rounded-2xl px-4 py-2.5 font-sans text-sm shadow-sm',
                item.data.role === 'user' && 'whitespace-pre-wrap'
              )}
            >
              {item.data.role === 'user'
                ? item.data.content
                : <Markdown components={adminMdComponents}>{item.data.content}</Markdown>}
            </Panel>
            <span className="mt-1.5 px-2 text-[10px] uppercase tracking-wide text-white/85">
              {formatLong(item.data.created_at)}
            </span>
          </li>
        )
      )}
    </ul>
  )
}
