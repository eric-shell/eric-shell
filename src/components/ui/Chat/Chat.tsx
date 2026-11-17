import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, MessagesSquare, Mic, Square, Trash2, X } from 'lucide-react'
import { cn } from '../cn'
import Button from '../Button'
import Panel from '../Panel'
import { toast } from '../Toast'
import type { ChatMessage } from '@/hooks/useChat'
import { useSpeechInput, useTypedPlaceholder } from '@/hooks'
import { sendEvent } from '@/lib/telemetry'
import Markdown from '../Markdown'
import { chatMdComponents, prefetchMarkdown } from '@/lib/markdown'
import { GENIE_LAUNCH_MS, GENIE_OUT_MS } from './timings'

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
   * launches the button up and away and scrolls the page back to the top, where
   * the panel opens in its home. There is no second, fixed copy of the panel.
   * When the home comes back into view, a panel that was tucked away by docking
   * returns to it. One the visitor closed themselves stays closed until the
   * button is pressed.
   */
  docked?: boolean
}

/** Rules between the header, the thread and the composer. */
const RULE = 'border-ink/10'

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
  // The button is mid-launch: flying off while the page scrolls up to the hero.
  const [launching, setLaunching] = useState(false)
  if (docked !== prevDocked) {
    setPrevDocked(docked)
    if (docked && isOpen && !isClosing) {
      setIsOpen(false)
      setAutoDocked(true)
    } else if (!docked && autoDocked) {
      setIsOpen(true)
      setAutoDocked(false)
      setLaunching(false)
    }
  }
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
    } else if (wasClosedRef.current && !onTouchDevice()) {
      // Not on touch: the panel can reopen mid-scroll, and focusing the field
      // there would raise the keyboard over the page as it moves.
      textareaRef.current?.focus({ preventScroll: true })
    }
  }, [isOpen])

  // The launch outlives the click: a timer to open an undocked panel, and a
  // listener that brings the button back if the scroll home was interrupted.
  const launchCleanupRef = useRef<() => void>(undefined)
  useEffect(() => () => launchCleanupRef.current?.(), [])

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

  /**
   * The button flies up and away while the page scrolls back to the top, and
   * the panel opens in its home in the hero. Docked, the reopen is left to the
   * `docked` adjustment above (the hero coming back into view), so the panel
   * never opens off screen; undocked, the home is already near, and it opens
   * once the launch has played.
   */
  const handleLaunch = () => {
    if (launching) return
    launchCleanupRef.current?.()
    setLaunching(true)
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })

    if (!docked) {
      const t = setTimeout(() => {
        setIsOpen(true)
        setLaunching(false)
      }, reduced ? 0 : GENIE_LAUNCH_MS)
      launchCleanupRef.current = () => clearTimeout(t)
      return
    }

    setAutoDocked(true)
    // If the scroll ends (or is cut short by the visitor) with the hero still
    // out of view, the button comes back rather than leaving nothing on screen.
    // `scrollend` where it exists; the timer covers browsers without it.
    const settle = () => {
      cleanup()
      setLaunching(false)
    }
    const t = setTimeout(settle, 2500)
    window.addEventListener('scrollend', settle, { once: true })
    const cleanup = () => {
      clearTimeout(t)
      window.removeEventListener('scrollend', settle)
    }
    launchCleanupRef.current = cleanup
  }

  const mdComponents = chatMdComponents(handleClose)

  if (!isOpen) {
    return createPortal(
      <Button
        onClick={handleLaunch}
        variant="luminous"
        size="md"
        aria-disabled={launching || undefined}
        className={cn(
          'genie-button fixed bottom-6 right-6 shadow-float z-[900]',
          launching ? 'animate-genie-launch pointer-events-none' : 'animate-genie-button-in'
        )}
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

  const assistantBubbleClass = 'self-start max-w-[85%] rounded-2xl px-4 py-2.5 font-sans text-sm text-ink bg-ice'

  // One white card. It used to be two layers, a frosted-glass surface and the
  // chrome fading in beside it, because an element fading over a backdrop blur
  // makes the blur snap. With no blur anywhere there is nothing to keep apart.
  const panel = (
    <Panel
      variant="outline"
      className={cn(
        'genie-panel focus-on-paper relative flex flex-col rounded-2xl overflow-hidden',
        isClosing ? 'animate-genie-out pointer-events-none' : 'animate-panel-in',
        className
      )}
    >
      <header className={cn('relative z-10 flex items-center justify-between gap-2 pl-2.5 pr-3 py-2.5 border-b', RULE)}>
        <span className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
          <span aria-hidden="true" className="grid place-items-center w-7 h-7 squircle bg-lum">
            <img src="/icon.svg" alt="" className="w-3.5" />
          </span>
          Ask me anything
        </span>
        <div className="flex items-center gap-1.5">
          {hasMessages && onClear && (
            <Button
              onClick={handleClear}
              variant="white"
              shape="square"
              size="sm"
              aria-label="Clear conversation"
            >
              <Trash2 size={16} strokeWidth={2.5} aria-hidden="true" />
            </Button>
          )}
          <Button
            onClick={handleClose}
            variant="white"
            shape="square"
            size="sm"
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
            <span className="inline-flex gap-1 items-center text-lg leading-none text-ink-soft">
              <span className="animate-bounce">·</span>
              <span className="animate-bounce [animation-delay:120ms]">·</span>
              <span className="animate-bounce [animation-delay:240ms]">·</span>
            </span>
          </div>
        )}
      </div>
      <div className={cn('relative z-10 border-t px-3 py-3', RULE)}>
        {/* Suggestions sit directly above the composer they fill in. */}
        {onPrompt && suggestions.length > 0 && !hasMessages && (
          <div
            className={cn(
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
            className={cn(
              'block w-full rounded-composer border border-ink/20 bg-white text-ink placeholder:text-ink-mute focus:border-lum pl-5 py-4 font-sans text-base leading-6 resize-none overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] transition-[height] duration-150 ease-out focus:outline-none read-only:opacity-60',
              // Right inset clears the control cluster: COMPOSER_INSET +
              // buttons + the gap between them, plus room for the text to
              // stop short of the first one.
              speech.supported ? 'pr-26' : 'pr-16',
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
                variant={speech.listening ? 'error' : 'outline'}
                shape="square"
                size="md"
                className={cn(
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
              className="rounded-full shadow-raised [--icon-size:1.125rem] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isLoading ? 'Sending' : 'Send message'}
            >
              <ArrowRight size={20} strokeWidth={2.5} aria-hidden="true" />
            </Button>
          </div>
        </div>
        {/* Two disclosures, one row: pushed apart on a wide composer, reduced
            to the bare links either side of a divider where the prose would
            wrap. */}
        <div className="mt-2 px-1 font-sans text-[11px] leading-none flex items-center justify-center gap-2 text-ink-mute">
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
      {/* The one live region in the panel — see `announcement`. Always mounted,
          and empty until there is something to say: a live region has to exist
          before its content changes for the change to be announced. */}
      <div role="status" className="sr-only">{announcement}</div>
    </Panel>
  )

  return panel
}
