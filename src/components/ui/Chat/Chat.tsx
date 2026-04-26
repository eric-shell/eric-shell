import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUp, MessagesSquare, Trash2, X } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import Button from '../Button'
import Panel from '../Panel'
import type { ChatMessage } from '../../../hooks/useChat'

const EMAIL_RE = /(?<!\]\(mailto:)([\w.+-]+@[\w-]+\.[\w.-]+)(?!\w)/g

function linkifyEmail(text: string): string {
  return text.replace(EMAIL_RE, '[$1](mailto:$1)')
}

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

const GENIE_DURATION_MS = 480
const TEXTAREA_MAX_HEIGHT = 160
const TYPE_SPEED_MS = 28

function useTypewriter(text: string, enabled: boolean): string {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    if (!text) {
      setDisplayed('')
      return
    }
    if (!enabled) {
      setDisplayed(text)
      return
    }
    setDisplayed('')
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(interval)
    }, TYPE_SPEED_MS)
    return () => clearInterval(interval)
  }, [text, enabled])
  return displayed
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

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
      onClose?.()
    }, GENIE_DURATION_MS)
  }

  const mdComponents: Components = {
    a: ({ href, children, ...props }) => {
      if (!href) return <>{children}</>
      if (href.startsWith('#')) {
        return (
          <a
            href={href}
            onClick={() => handleClose()}
            className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
            {...props}
          >
            {children}
          </a>
        )
      }
      const isExternal = /^https?:/.test(href)
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
          {...props}
        >
          {children}
        </a>
      )
    },
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-5 mb-2 last:mb-0">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 last:mb-0">{children}</ol>,
    li: ({ children }) => <li className="mb-0.5">{children}</li>,
    code: ({ children }) => <code className="px-1 py-0.5 rounded bg-blue-100 font-mono text-xs">{children}</code>,
    strong: ({ children }) => <span className="font-semibold">{children}</span>,
  }

  if (!isOpen) {
    return createPortal(
      <Button
        onClick={() => {
          setIsOpen(true)
          document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })
        }}
        variant="primary"
        size="md"
        className="genie-button fixed bottom-6 right-6 z-50 shadow-xl [animation:genie-button-in_350ms_cubic-bezier(0.34,1.56,0.64,1)_both] z-[900]"
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

  const assistantBubbleClass = 'self-start max-w-[85%] rounded-2xl px-4 py-2.5 font-sans text-sm whitespace-pre-wrap text-blue-800 bg-gradient-to-br from-white to-blue-50 shadow-md'
  const borderClass = isWhite ? 'border-blue-950/10' : 'border-white/20'

  return (
    <div
      className={twMerge(
        'genie-panel relative flex flex-col rounded-2xl overflow-hidden border',
        borderClass,
        isClosing && '[animation:genie-out_480ms_cubic-bezier(0.4,0,0.9,0.6)_both]',
        isClosing && 'pointer-events-none',
        className
      )}
    >
      <Panel
        variant={isWhite ? 'white' : 'glass-light'}
        className="absolute inset-0 border-0 [animation:blur-in_1s_cubic-bezier(0.16,1,0.3,1)_0.3s_both]"
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
          <span className="font-sans text-xs font-semibold tracking-wide">WCAG</span>
        </button>
        <div className="flex items-center gap-1.5">
          {hasMessages && onClear && (
            <Button
              onClick={onClear}
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
              'block w-full rounded-full border pl-4 pr-16 py-4 font-sans text-base leading-6 resize-none overflow-y-auto transition-[height] duration-150 ease-out focus:outline-none disabled:opacity-60',
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
            className="absolute bottom-2 right-2 rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isLoading ? 'Sending' : 'Send message'}
          >
            <ArrowUp size={20} strokeWidth={2.5} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
