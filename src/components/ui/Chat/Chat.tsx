import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, MessagesSquare, Mic, Square, Trash2, X } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import Button from '../Button'
import Panel from '../Panel'
import { toast } from '../Toast'
import type { ChatMessage } from '@/hooks/useChat'
import { useSpeechInput, useTypedPlaceholder } from '@/hooks'
import { sendEvent } from '@/lib/telemetry'
import Markdown from '../Markdown'
import { chatMdComponents, prefetchMarkdown } from '@/lib/markdown'
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
  /**
   * The panel's home (the hero) is scrolled out of view. The panel tucks itself
   * into the floating "Start a Chat" button at the bottom right; clicking that
   * opens the panel right there, fixed, rather than scrolling back. When the
   * home comes back into view, a panel that was tucked away by docking returns
   * to it. One the visitor closed themselves stays closed.
   */
  docked?: boolean
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

/**
 * Markdown source, flattened to roughly what it reads as.
 *
 * For the screen-reader announcement of a reply, which is plain text: read
 * aloud, the raw source is "asterisk asterisk design systems asterisk asterisk"
 * and a link is its whole URL. Deliberately rough — it only has to cover what
 * the prompt lets the model produce (bold, inline code, links, list markers).
 */
function spokenText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]+/g, '')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** True where the primary input is touch, i.e. where focus means a keyboard on screen. */
function onTouchDevice(): boolean {
  return window.matchMedia?.('(pointer: coarse)').matches === true
}

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
  docked = false,
}: ChatProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  // Docking, adjusted during render (not in an effect) so the panel and the
  // button never both show for a frame. `autoDocked` remembers that it was the
  // scroll, not the visitor, that put the panel away.
  const [prevDocked, setPrevDocked] = useState(docked)
  const [autoDocked, setAutoDocked] = useState(false)
  if (docked !== prevDocked) {
    setPrevDocked(docked)
    if (docked && isOpen && !isClosing) {
      setIsOpen(false)
      setAutoDocked(true)
    } else if (!docked && autoDocked) {
      setIsOpen(true)
      setAutoDocked(false)
    }
  }
  // The panel is always the solid white card. It used to default to frosted
  // glass with an "ADA / WCAG" switch to this high-contrast surface; with
  // glass gone from the site the high-contrast surface is simply the surface.
  // (The `ada_toggle` event type is kept so the CRM can still show past counts.)
  const isWhite = true
  const threadRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const wasClosedRef = useRef(false)

  // Pull the markdown parser down on idle rather than at first paint. See
  // prefetchMarkdown — it is kept out of the initial bundle, and this is what
  // makes sure it has landed before there is anything worth parsing.
  useEffect(() => { prefetchMarkdown() }, [])

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

  /**
   * What a screen reader is told about the conversation, via the `role="status"`
   * region at the bottom of the panel.
   *
   * The thread itself is not a live region and must not become one. A reply
   * streams in a few characters at a time and the greeting is typed out letter
   * by letter; announced as they change, both come out as a stutter of
   * fragments. So the region carries two whole messages instead: that the
   * question was sent, and then the complete reply, once, when the stream ends.
   *
   * State adjusted during render, keyed on `isLoading` flipping, rather than an
   * effect — the announcement then lands in the same commit as the reply it
   * describes.
   *
   * `sentAt` is the thread length when the request went out. A reply is only
   * announced if the thread is longer than that afterwards: on a failed request
   * the hook rolls the question back, and without the check the region would
   * fall back to the previous reply and read it out a second time.
   */
  const [announcement, setAnnouncement] = useState('')
  const [wasLoading, setWasLoading] = useState(isLoading)
  const [sentAt, setSentAt] = useState(0)
  if (wasLoading !== isLoading) {
    setWasLoading(isLoading)
    if (isLoading) {
      setSentAt(messages.length)
      setAnnouncement('Message sent. Waiting for a reply.')
    } else {
      const reply = messages[messages.length - 1]
      setAnnouncement(
        messages.length > sentAt && reply?.role === 'assistant'
          ? `Reply: ${spokenText(reply.content)}`
          : ''
      )
    }
  }

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
    // The Clear button only exists while there is a thread, so it unmounts as
    // a result of its own click and takes focus with it. Hand it to the
    // composer, which is where a cleared conversation continues from. Not on
    // touch, where focusing a field raises the keyboard over the panel.
    if (!onTouchDevice()) textareaRef.current?.focus({ preventScroll: true })
  }

  /** Same reasoning for a suggestion chip: the chips vanish once one is sent. */
  const handlePrompt = (text: string) => {
    onPrompt?.(text)
    if (!onTouchDevice()) textareaRef.current?.focus({ preventScroll: true })
  }

  const mdComponents = chatMdComponents(handleClose)

  if (!isOpen) {
    return createPortal(
      <Button
        onClick={() => {
          setIsOpen(true)
          setAutoDocked(false)
          // Docked, the panel opens where the button is. Otherwise its home is
          // on screen or nearby, so take the visitor to it.
          if (!docked) document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })
        }}
        variant="luminous"
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

  const assistantBubbleClass = 'self-start max-w-[85%] rounded-2xl px-4 py-2.5 font-sans text-sm text-blue-950 bg-ice'
  const borderClass = isWhite ? 'border-blue-950/10' : 'border-white/20'

  const panel = (
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
          <span className="flex items-center gap-2 pl-1 font-sans text-sm font-semibold text-blue-950">
            <span aria-hidden="true" className="grid place-items-center w-7 h-7 rounded-lg bg-lum">
              <img src="/icon.svg" alt="" className="w-3.5" />
            </span>
            Ask me anything
          </span>
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
          className="relative z-0 flex-1 min-h-[200px] max-h-[400px] overflow-y-auto p-3 flex flex-col gap-3"
        >
          {welcomeMessage && !hasMessages && (
            <div className={assistantBubbleClass} aria-label="Welcome message">
              <Markdown components={mdComponents}>{typedWelcome}</Markdown>
            </div>
          )}
          {hasMessages && messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === 'user'
                  ? 'self-end max-w-[85%] rounded-2xl px-4 py-2.5 font-sans text-sm whitespace-pre-wrap text-white bg-lum'
                  : assistantBubbleClass
              }
            >
              {m.role === 'assistant'
                ? <Markdown components={mdComponents}>{m.content}</Markdown>
                : m.content}
            </div>
          ))}
          {showTypingDots && (
            // Decoration, as far as assistive tech is concerned. It used to carry
            // `aria-live`, which did nothing: a live region announces CHANGES to
            // content it already holds, and this one mounts with its content and
            // unmounts with it. The status region below is what speaks.
            <div className={assistantBubbleClass} aria-hidden="true">
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
          {/* Suggestions sit directly above the composer they fill in. */}
          {onPrompt && suggestions.length > 0 && !hasMessages && (
            <div
              className={twMerge(
                'flex flex-wrap gap-2 pb-3 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
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
                  variant="luminous"
                  className="rounded-full"
                  disabled={isLoading || !welcomeDone}
                  onClick={() => handlePrompt(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          )}
          <div className="relative">
            <textarea
              ref={textareaRef}
              // Without this the field's accessible name is its placeholder,
              // and the placeholder is an animation: a screen reader landed on
              // whichever half-typed prompt happened to be showing.
              aria-label="Ask a question"
              value={value}
              onChange={e => onChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSubmit()
                  // On a phone, sending should put the keyboard away so the
                  // reply is not arriving underneath it. `disabled` used to do
                  // that as a side effect; `readOnly` (below) does not.
                  if (onTouchDevice()) e.currentTarget.blur()
                }
              }}
              placeholder={typedPlaceholder ?? placeholder}
              rows={1}
              // `readOnly`, not `disabled`, while a reply is in flight. A
              // disabled element cannot hold focus, so every send threw
              // keyboard focus to <body> and never gave it back: the next Tab
              // started again from the top of the page. Read-only blocks typing
              // just the same and keeps the caret where it was.
              readOnly={isLoading}
              style={{ maxHeight: TEXTAREA_MAX_HEIGHT }}
              className={twMerge(
                'block w-full rounded-[28px] border pl-5 py-4 font-sans text-base leading-6 resize-none overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] transition-[height] duration-150 ease-out focus:outline-none read-only:opacity-60',
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
                // Wrapped, not passed bare: the hook behind `onSubmit` takes an
                // optional prompt string, and a bare handler hands it the click
                // event instead, which it then tries to `.trim()`.
                onClick={e => {
                  onSubmit()
                  // This button disables itself the moment it is pressed. For a
                  // keyboard press (`detail` is 0: no mouse clicks) that would
                  // strand focus on a dead control, so it goes back to the
                  // composer. A pointer press is left alone — on a phone,
                  // refocusing the field would raise the keyboard again.
                  if (e.detail === 0) textareaRef.current?.focus({ preventScroll: true })
                }}
                disabled={submitDisabled}
                variant="luminous"
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
      {/* The one live region in the panel — see `announcement`. Always mounted,
          and empty until there is something to say: a live region has to exist
          before its content changes for the change to be announced. */}
      <div role="status" className="sr-only">{announcement}</div>
    </div>
  )

  // Docked and opened from the button: the same panel, fixed at the bottom
  // right over whatever the visitor is reading. Portalled because the panel's
  // home sits inside transformed ancestors (the hero's CascadeItems), which
  // would otherwise be what `fixed` positions it against.
  if (docked) {
    return createPortal(
      <div className="fixed bottom-5 right-5 z-[900] w-[min(420px,calc(100vw-40px))] origin-bottom-right animate-dock-in shadow-[0_30px_80px_-30px_rgba(5,10,60,0.6)] rounded-2xl">
        {panel}
      </div>,
      document.body,
    )
  }

  return panel
}
