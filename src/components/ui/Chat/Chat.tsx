import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, MessagesSquare, Mic, Square, Trash2, X } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import ReactMarkdown from 'react-markdown'
import Button from '../Button'
import Panel from '../Panel'
import { toast } from '../Toast'
import type { ChatMessage } from '@/hooks/useChat'
import { useSpeechInput, useTypedPlaceholder } from '@/hooks'
import { sendEvent } from '@/lib/telemetry'
import { chatMdComponents, linkifyEmail } from '@/lib/markdown'
import { GENIE_OUT_MS } from './timings'

interface ChatProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  /** Sends a suggested prompt directly (bypasses the textarea). Chips render only when this and `suggestions` are set. */
  onPrompt?: (text: string) => void
  suggestions?: string[]
  messages?: ChatMessage[]
  isLoading?: boolean
  onClose?: () => void
  onClear?: () => void
  placeholder?: string
  /**
   * Prompts typed and erased in the composer, one after another, in place of a
   * static placeholder. Falls back to `placeholder` when empty, under
   * `prefers-reduced-motion`, and once the conversation is under way.
   */
  placeholders?: string[]
  welcomeMessage?: string
  className?: string
}

const TEXTAREA_MAX_HEIGHT = 160
const TYPE_SPEED_MS = 28

/**
 * Composer control geometry, in px. The textarea is `py-4` around a 24px line
 * box, so it rests at 56px; each control is `size="md"` (`p-2.5`) around an
 * 18px icon plus the 1px border every variant carries, so it is 40px.
 * Insetting the cluster by half the difference is what leaves the send button
 * sitting in an even 8px of air on the top, bottom, and right — derived here
 * rather than written as a `right-*` class so the inputs to it stay visible.
 *
 * The border is load-bearing in that sum: dropping it from one control (the
 * mic's `glass-dark` fill would happily go borderless) makes that control 2px
 * shorter than its neighbour and the row stops lining up.
 */
// border + p-2.5 + icon + p-2.5 + border, under Tailwind's border-box sizing.
const COMPOSER_CONTROL = 1 + 10 + 18 + 10 + 1
const COMPOSER_INSET = (56 - COMPOSER_CONTROL) / 2

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
  onPrompt,
  suggestions = [],
  messages = [],
  isLoading = false,
  onClose,
  onClear,
  placeholder = 'Ask me anything…',
  placeholders = [],
  welcomeMessage,
  className,
}: ChatProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [isWhite, setIsWhite] = useState(false)
  const threadRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const adaFirstMount = useRef(true)
  const wasClosedRef = useRef(false)

  // Keyboard users shouldn't lose their place when the genie collapses:
  // closing hands focus to the floating reopen button, reopening hands it
  // back to the textarea. Skipped on initial mount so page load never
  // steals focus.
  useEffect(() => {
    if (!isOpen) {
      wasClosedRef.current = true
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('.genie-button')?.focus()
      })
    } else if (wasClosedRef.current) {
      textareaRef.current?.focus({ preventScroll: true })
    }
  }, [isOpen])

  const hasMessages = messages.length > 0
  const animateWelcome =
    !hasMessages &&
    typeof window !== 'undefined' &&
    !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const typedWelcome = useTypewriter(welcomeMessage ?? '', animateWelcome)
  // Suggestion chips wait for the welcome message to finish typing. With no
  // welcome message — or under reduced motion, where the typewriter resolves
  // instantly — this is true on the first render and they never fade.
  const welcomeDone = !welcomeMessage || typedWelcome.length >= welcomeMessage.length

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
    sendEvent('ada_toggle', { enabled: isWhite })
  }, [isWhite])

  // Dictation composes onto whatever is already in the field — see the hook,
  // which keeps these callbacks in a ref so a session started mid-sentence
  // still reads the current text.
  const speech = useSpeechInput({
    onTranscript: onChange,
    getValue: () => value,
    onStart: () => sendEvent('speech_input'),
    onError: code => {
      // `no-speech` (heard nothing) and `aborted` (the visitor stopped it) are
      // normal exits, not failures worth a toast.
      if (code === 'no-speech' || code === 'aborted') return
      toast.error(
        code === 'not-allowed' || code === 'service-not-allowed'
          ? 'Microphone access was blocked. Enable it in your browser settings to dictate.'
          : "Couldn't hear that — try again, or type your message."
      )
    },
  })

  // Only animates while the composer is genuinely empty and idle: a visible
  // placeholder behind no text. Every other state falls back to the static one.
  const typedPlaceholder = useTypedPlaceholder(
    placeholders,
    !value && !hasMessages && !isLoading && !speech.listening
  )

  const handleClose = () => {
    // The panel collapses to a floating button but this component stays
    // mounted, so an open mic would otherwise keep listening with no UI.
    speech.stop()
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
      onClose?.()
    }, GENIE_OUT_MS)
  }

  const handleClear = () => {
    sendEvent('chat_cleared')
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
        className="absolute inset-0 border-0 rounded-2xl animate-glass-in noise-overlay"
      />
      {/* Chrome fades as a *sibling* of the glass, never as its ancestor: an
          ancestor mid-fade would form a backdrop root and the blur would snap
          when the fade resolved. Same timing, so they read as one motion.
          Repeats the parent's rounding because the fade promotes this to its own
          composited layer, and the parent's overflow clip then applies as a
          rectangle — leaving the header/composer borders to square off the
          corners. Clipping to the same radius here keeps them inside it. */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0 rounded-2xl overflow-hidden animate-glass-in">
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
            {/* On = the semantic `success` fill, not primary blue: the switch
                reports a state that is now satisfied, and green separates it
                from the blue CTAs sharing the panel. */}
            <span className={twMerge(
              'relative inline-flex h-4 w-7 items-center rounded-full transition-all',
              isWhite ? 'bg-success hover:bg-success-hover' : 'bg-black/20 hover:bg-black/50'
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
          {onPrompt && suggestions.length > 0 && !hasMessages && (
            <div
              className={twMerge(
                'flex flex-wrap gap-2 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
                welcomeDone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[6px]'
              )}
              role="group"
              aria-label="Suggested questions"
            >
              {suggestions.map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={'primary'}
                  className="rounded-full"
                  disabled={isLoading || !welcomeDone}
                  onClick={() => onPrompt(s)}
                >
                  {s}
                </Button>
              ))}
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
              placeholder={typedPlaceholder ?? placeholder}
              rows={1}
              disabled={isLoading}
              style={{ maxHeight: TEXTAREA_MAX_HEIGHT }}
              className={twMerge(
                'block w-full rounded-[28px] border pl-5 py-4 font-sans text-base leading-6 resize-none overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] transition-[height] duration-150 ease-out focus:outline-none disabled:opacity-60',
                // Right inset clears the control cluster: COMPOSER_INSET +
                // buttons + the gap between them, plus room for the text to
                // stop short of the first one.
                speech.supported ? 'pr-26' : 'pr-16',
                isWhite
                  ? 'bg-white border-blue-950/20 text-blue-950 placeholder:text-blue-950/70 focus:border-blue-700'
                  : 'bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:border-white/60 focus:bg-white/15'
              )}
            />
            {/* The cluster is inset by COMPOSER_INSET on the right, and the
                buttons are COMPOSER_CONTROL px tall inside a 56px composer —
                so the same 9px of air surrounds them on all three sides.
                Changing the icon size or the textarea's py breaks that; the
                two constants at the top of the file are where to redo the
                arithmetic. */}
            <div
              className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5"
              style={{ right: COMPOSER_INSET }}
            >
              {speech.supported && (
                <Button
                  onClick={speech.toggle}
                  disabled={isLoading}
                  variant={speech.listening ? 'error' : isWhite ? 'white' : 'glass-dark'}
                  shape="square"
                  size="md"
                  className={twMerge(
                    'rounded-full [--icon-size:1.125rem]',
                    speech.listening && 'motion-safe:animate-pulse'
                  )}
                  aria-label={speech.listening ? 'Stop dictation' : 'Dictate your message'}
                  aria-pressed={speech.listening}
                >
                  {speech.listening
                    ? <Square size={18} strokeWidth={2.5} fill="currentColor" aria-hidden="true" />
                    : <Mic size={18} strokeWidth={2.5} aria-hidden="true" />}
                </Button>
              )}
              <Button
                onClick={onSubmit}
                disabled={submitDisabled}
                variant="primary"
                shape="square"
                size="md"
                className="rounded-full shadow-md [--icon-size:1.125rem] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isLoading ? 'Sending' : 'Send message'}
              >
                <ArrowRight size={20} strokeWidth={2.5} aria-hidden="true" />
              </Button>
            </div>
          </div>
          {/* Two disclosures, one row: pushed apart on a wide composer, reduced
              to the bare links either side of a divider where the prose would
              wrap. */}
          <div className={twMerge(
            'mt-2 px-1 font-sans text-[11px] leading-none flex items-center justify-center gap-2',
            isWhite ? 'text-blue-950/50' : 'text-white/60'
          )}>
            <p>
              <span className="hidden sm:inline">Contact me directly. </span>
              <a
                href="mailto:ericjshell@gmail.com"
                className="underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                Email
              </a>
            </p>
            <span aria-hidden="true" className="h-3 w-px bg-current opacity-40" />
            <p>
              <span className="hidden sm:inline">Chats are saved so I can follow up. </span>
              <a
                href="/privacy"
                className="underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                Privacy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
