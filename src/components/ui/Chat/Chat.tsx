import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUp, MessagesSquare, Trash2, X } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import ReactMarkdown from 'react-markdown'
import Button from '../Button'
import Panel from '../Panel'
import type { ChatMessage } from '@/hooks/useChat'
import { getVisitorId } from '@/lib/visitorId'
import { chatMdComponents, linkifyEmail } from '@/lib/markdown'
import { GENIE_OUT_MS } from './timings'

interface ChatProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  messages?: ChatMessage[]
  isLoading?: boolean
  onClose?: () => void
  onClear?: () => void
  placeholder?: string
  welcomeMessage?: string
  className?: string
}

const TEXTAREA_MAX_HEIGHT = 160
const TYPE_SPEED_MS = 28

function useTypewriter(text: string, enabled: boolean): string {
  const [count, setCount] = useState(() => (enabled ? 0 : text.length))
  const [prevKey, setPrevKey] = useState<[string, boolean]>([text, enabled])
  if (prevKey[0] !== text || prevKey[1] !== enabled) {
    // Adjust state during render (not in an effect) so the reset applies
    // before the browser paints the new text.
    setPrevKey([text, enabled])
    setCount(enabled ? 0 : text.length)
  }
  useEffect(() => {
    if (!enabled || !text) return
    const interval = setInterval(() => {
      setCount(c => {
        if (c >= text.length) {
          clearInterval(interval)
          return c
        }
        return c + 1
      })
    }, TYPE_SPEED_MS)
    return () => clearInterval(interval)
  }, [text, enabled])
  return text.slice(0, count)
}

export default function Chat({
  value,
  onChange,
  onSubmit,
  messages = [],
  isLoading = false,
  onClose,
  onClear,
  placeholder = 'Ask me anything…',
  welcomeMessage,
  className,
}: ChatProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [isWhite, setIsWhite] = useState(false)
  const threadRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const adaFirstMount = useRef(true)

  const hasMessages = messages.length > 0
  const animateWelcome =
    !hasMessages &&
    typeof window !== 'undefined' &&
    !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const typedWelcome = useTypewriter(welcomeMessage ?? '', animateWelcome)

  useEffect(() => {
    const el = threadRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, isLoading])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT) + 'px'
  }, [value])

  useEffect(() => {
    if (adaFirstMount.current) { adaFirstMount.current = false; return }
    const vid = getVisitorId()
    if (!vid) return
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Visitor-Id': vid, 'X-Referrer': document.referrer },
      body: JSON.stringify({ visitorId: vid, type: 'ada_toggle', metadata: { enabled: isWhite } }),
    }).catch(err => {
      if (import.meta.env.DEV) console.warn('ada_toggle event failed:', err)
    })
  }, [isWhite])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
      onClose?.()
    }, GENIE_OUT_MS)
  }

  const handleClear = () => {
    const vid = getVisitorId()
    if (vid) {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Visitor-Id': vid, 'X-Referrer': document.referrer },
        body: JSON.stringify({ visitorId: vid, type: 'chat_cleared' }),
      }).catch(err => {
        if (import.meta.env.DEV) console.warn('chat_cleared event failed:', err)
      })
    }
    onClear?.()
  }

  const mdComponents = chatMdComponents(handleClose)

  if (!isOpen) {
    return createPortal(
      <Button
        onClick={() => {
          setIsOpen(true)
          document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })
        }}
        variant="primary"
        size="md"
        className="genie-button fixed bottom-6 right-6 z-50 shadow-xl animate-genie-button-in z-[900]"
        rightIcon={<MessagesSquare size={15} strokeWidth={2.5} aria-hidden="true" />}
      >
        Start a Chat
      </Button>,
      document.body
    )
  }

  const lastMessage = messages[messages.length - 1]
  const showTypingDots = isLoading && (!lastMessage || lastMessage.role === 'user')
  const submitDisabled = isLoading || !value.trim()

  const assistantBubbleClass = 'self-start max-w-[85%] rounded-2xl px-4 py-2.5 font-sans text-sm text-blue-800 bg-gradient-to-br from-white to-blue-50 shadow-md'
  const borderClass = isWhite ? 'border-blue-950/10' : 'border-white/20'

  return (
    <div
      className={twMerge(
        'genie-panel relative flex flex-col rounded-2xl overflow-hidden border',
        borderClass,
        isClosing && 'animate-genie-out',
        isClosing && 'pointer-events-none',
        className
      )}
    >
      <Panel
        variant={isWhite ? 'white' : 'glass-light'}
        className="absolute inset-0 border-0 animate-blur-in"
      />
      <header
        className={twMerge(
          'relative z-10 flex items-center justify-between gap-2 px-3 py-2.5 border-b',
          borderClass
        )}
      >
        <button
          role="switch"
          aria-checked={isWhite}
          aria-label="Toggle high-contrast mode"
          onClick={() => setIsWhite(v => !v)}
          className={twMerge(
            'flex items-center gap-1.5 rounded-full px-2 py-1 cursor-pointer transition-colors',
            isWhite ? 'text-blue-950' : 'text-white'
          )}
        >
          <span className={twMerge(
            'relative inline-flex h-4 w-7 items-center rounded-full transition-all',
            isWhite ? 'bg-blue-700 hover:bg-blue-800' : 'bg-black/20 hover:bg-black/50'
          )}>
            <span className={twMerge(
              'inline-block h-2.5 w-2.5 rounded-full bg-white shadow transition-transform',
              isWhite ? 'translate-x-3.5' : 'translate-x-0.5'
            )} />
          </span>
          <span className="font-sans text-xs font-semibold tracking-wide">ADA / WCAG</span>
        </button>
        <div className="flex items-center gap-1.5">
          {hasMessages && onClear && (
            <Button
              onClick={handleClear}
              variant={isWhite ? 'white' : 'glass-dark'}
              shape="square"
              size="sm"
              className="border-0"
              aria-label="Clear conversation"
            >
              <Trash2 size={16} strokeWidth={2.5} aria-hidden="true" />
            </Button>
          )}
          <Button
            onClick={handleClose}
            variant={isWhite ? 'white' : 'glass-dark'}
            shape="square"
            size="sm"
            className="border-0"
            aria-label="Close chat"
          >
            <X size={16} strokeWidth={2.5} aria-hidden="true" />
          </Button>
        </div>
      </header>
      <div
        ref={threadRef}
        className="relative z-0 flex-1 min-h-[280px] max-h-[400px] overflow-y-auto p-3 flex flex-col gap-3"
      >
        {welcomeMessage && !hasMessages && (
          <div className={assistantBubbleClass} aria-label="Welcome message">
            <ReactMarkdown components={mdComponents}>{linkifyEmail(typedWelcome)}</ReactMarkdown>
          </div>
        )}
        {hasMessages && messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'self-end max-w-[85%] rounded-2xl px-4 py-2.5 font-sans text-sm whitespace-pre-wrap text-white bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm'
                : assistantBubbleClass
            }
          >
            {m.role === 'assistant'
              ? <ReactMarkdown components={mdComponents}>{linkifyEmail(m.content)}</ReactMarkdown>
              : m.content}
          </div>
        ))}
        {showTypingDots && (
          <div
            className={assistantBubbleClass}
            aria-live="polite"
            aria-label="Assistant is typing"
          >
            <span className="inline-flex gap-1 items-center text-lg leading-none text-blue-800">
              <span className="animate-bounce">·</span>
              <span className="animate-bounce [animation-delay:120ms]">·</span>
              <span className="animate-bounce [animation-delay:240ms]">·</span>
            </span>
          </div>
        )}
      </div>
      <div className={twMerge(
        'relative z-10 border-t px-3 py-3',
        borderClass
      )}>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSubmit()
              }
            }}
            placeholder={placeholder}
            rows={1}
            disabled={isLoading}
            style={{ maxHeight: TEXTAREA_MAX_HEIGHT }}
            className={twMerge(
              'block w-full rounded-[28px] border pl-5 pr-16 py-4 font-sans text-base leading-6 resize-none overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] transition-[height] duration-150 ease-out focus:outline-none disabled:opacity-60',
              isWhite
                ? 'bg-white border-blue-950/20 text-blue-950 placeholder:text-blue-950/30 focus:border-blue-700'
                : 'bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/60 focus:bg-white/15'
            )}
          />
          <Button
            onClick={onSubmit}
            disabled={submitDisabled}
            variant="primary"
            shape="square"
            size="md"
            className="absolute top-1/2 -translate-y-1/2 right-2 rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isLoading ? 'Sending' : 'Send message'}
          >
            <ArrowUp size={20} strokeWidth={2.5} aria-hidden="true" />
          </Button>
        </div>
        <p className={twMerge(
          'mt-2 px-1 font-sans text-[11px] leading-none text-center',
          isWhite ? 'text-blue-950/50' : 'text-white/60'
        )}>
          Conversations are recorded.{' '}
          <a
            href="/privacy"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            Privacy
          </a>
        </p>
      </div>
    </div>
  )
}
