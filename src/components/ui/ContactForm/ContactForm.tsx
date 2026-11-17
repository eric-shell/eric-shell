import { useState } from 'react'
import { Send } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import Button from '../Button'
import Input from '../Input'
import Panel from '../Panel'
import Textarea from '../Textarea'
import { toast } from '../Toast'
import { useIntersectionObserver, useTypedPlaceholder } from '@/hooks'
import { identityHeaders } from '@/lib/telemetry'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Typed and erased in the message field in place of a static placeholder — the
 * same treatment as the chat composer. Each one models a message worth sending,
 * because "Tell me what you're working on" alone left people staring at an
 * empty box. Kept short: this field is half-width on desktop and the phrase
 * must not wrap.
 */
const MESSAGE_PLACEHOLDERS = [
  "Tell me what you're working on…",
  'Hiring for a role? Tell me about the team.',
  'Have a project that needs design and code?',
  'Want to talk design systems? Same.',
  'Just saying hi works too.',
]

const MESSAGE_PLACEHOLDER_FALLBACK = "Tell me what you're working on..."

type ErrorField = 'name' | 'email' | 'message' | null

interface ContactFormProps {
  className?: string
  defaultTheme?: 'white' | 'dark'
  showThemeToggle?: boolean
  onSuccess?: () => void
}

export default function ContactForm({
  className,
  // White and no switch by default: the frosted-glass form this toggled away
  // from is gone with the rest of the site's glass. `dark` remains for the
  // flat tint on a dark canvas (Storybook covers it).
  defaultTheme = 'white',
  showThemeToggle = false,
  onSuccess,
}: ContactFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorField, setErrorField] = useState<ErrorField>(null)
  const [isWhite, setIsWhite] = useState(defaultTheme === 'white')

  // The form sits at the bottom of a long page, and the animation re-renders
  // this component ~20×/s. Gate it on the form actually being on screen so a
  // visitor reading the hero isn't paying for a placeholder nobody can see.
  const { ref: formRef, inView } = useIntersectionObserver<HTMLFormElement>({ threshold: 0.2 })
  const typedPlaceholder = useTypedPlaceholder(
    MESSAGE_PLACEHOLDERS,
    inView && !message && !isSubmitting
  )

  const nameValid = name.trim().length > 0 && name.length <= 100
  const emailValid = EMAIL_RE.test(email.trim()) && email.length <= 100
  const messageValid = message.trim().length >= 10 && message.length <= 2000

  const fail = (field: ErrorField, msg: string) => {
    setErrorField(field)
    toast.error(msg)
    return false
  }

  function validate(): boolean {
    if (!name.trim()) return fail('name', 'Please enter your name.')
    if (name.length > 100) return fail('name', 'Name must be 100 characters or less.')
    if (!email.trim()) return fail('email', 'Please enter your email.')
    if (!emailValid) return fail('email', 'Please enter a valid email address.')
    if (!message.trim()) return fail('message', 'Please enter a message.')
    if (message.length < 10) return fail('message', 'Message must be at least 10 characters.')
    if (message.length > 2000) return fail('message', 'Message must be 2000 characters or less.')
    return true
  }

  const handleFieldChange = (field: Exclude<ErrorField, null>, setter: (v: string) => void) => (v: string) => {
    setter(v)
    if (errorField === field) setErrorField(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorField(null)
    if (!validate()) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...identityHeaders(),
          'X-Referrer': document.referrer,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          website,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Message sent! I'll be in touch soon.")
        setName('')
        setEmail('')
        setMessage('')
        setWebsite('')
        onSuccess?.()
      } else {
        toast.error(data.error || 'Failed to send message. Please try again.')
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const borderClass = isWhite ? 'border-blue-950/10' : 'border-white/20'
  const mutedClass = isWhite ? 'text-blue-950/50' : 'text-white/60'

  // Same chrome as the hero's chat panel, so the page opens and closes on one
  // object: a header strip with the icon tile, a body, and a footer bar holding
  // the action and a one-line disclosure. Fields are the chat composer's pill.
  return (
    <Panel
      variant={isWhite ? 'white' : 'glass-light'}
      className={twMerge('relative flex flex-col rounded-2xl border overflow-hidden', borderClass, className)}
    >
      <header className={twMerge('flex items-center justify-between gap-2 px-3 py-2.5 border-b', borderClass)}>
        <span className={twMerge('flex items-center gap-2 pl-1 font-sans text-sm font-semibold', isWhite ? 'text-blue-950' : 'text-white')}>
          <span aria-hidden="true" className="grid place-items-center w-7 h-7 rounded-lg bg-lum">
            <img src="/icon.svg" alt="" className="w-3.5" />
          </span>
          Send me a message
        </span>
        {showThemeToggle ? (
          <button
            type="button"
            role="switch"
            aria-checked={isWhite}
            aria-label="Toggle high-contrast mode"
            onClick={() => setIsWhite(v => !v)}
            className={twMerge(
              'flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors',
              isWhite ? 'text-blue-950' : 'text-white'
            )}
          >
            <span className={twMerge(
              'relative inline-flex h-4 w-7 items-center rounded-full cursor-pointer transition-colors',
              isWhite ? 'bg-success hover:bg-success-hover' : 'bg-black/20 hover:bg-black/50'
            )}>
              <span className={twMerge(
                'inline-block h-2.5 w-2.5 rounded-full bg-white shadow transition-transform',
                isWhite ? 'translate-x-3.5' : 'translate-x-0.5'
              )} />
            </span>
            <span className="font-sans text-xs font-semibold tracking-wide">ADA / WCAG</span>
          </button>
        ) : (
          <span className={twMerge('pr-1 font-sans text-xs', mutedClass)}>Replies within a day or two</span>
        )}
      </header>
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col" noValidate>
        <div aria-hidden="true" className="sr-only">
          <label htmlFor="contact-website">Website</label>
          <input
            id="contact-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={e => setWebsite(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 px-4 pt-4 pb-2">
          <Input
            id="contact-name"
            label="Name"
            theme={isWhite ? 'white' : 'dark'}
            value={name}
            onChange={handleFieldChange('name', setName)}
            placeholder="Sam Miller"
            maxLength={100}
            disabled={isSubmitting}
            required
            valid={nameValid}
            error={errorField === 'name'}
            autoComplete="name"
            className="rounded-full px-5 py-3.5 text-base"
          />
          <Input
            id="contact-email"
            label="Email"
            theme={isWhite ? 'white' : 'dark'}
            type="email"
            value={email}
            onChange={handleFieldChange('email', setEmail)}
            placeholder="smiller@example.com"
            maxLength={100}
            disabled={isSubmitting}
            required
            valid={emailValid}
            error={errorField === 'email'}
            autoComplete="email"
            inputMode="email"
            className="rounded-full px-5 py-3.5 text-base"
          />
          <Textarea
            id="contact-message"
            label="Message"
            theme={isWhite ? 'white' : 'dark'}
            value={message}
            onChange={handleFieldChange('message', setMessage)}
            placeholder={typedPlaceholder ?? MESSAGE_PLACEHOLDER_FALLBACK}
            rows={5}
            maxLength={2000}
            disabled={isSubmitting}
            required
            valid={messageValid}
            error={errorField === 'message'}
            className="rounded-[24px] px-5 py-4 text-base"
          />
        </div>
        {/* Disclosure on the left, the action on the right; on a phone the action sits above it. */}
        <div className={twMerge('flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between', borderClass)}>
          <Button
            type="submit"
            disabled={isSubmitting}
            variant={isWhite ? 'luminous' : 'primary'}
            className="self-end sm:order-last"
            rightIcon={<Send size={14} strokeWidth={2.5} aria-hidden="true" />}
          >
            {isSubmitting ? 'Sending…' : 'Send Message'}
          </Button>
          <div className={twMerge('px-1 font-sans text-[11px] leading-none flex items-center justify-center sm:justify-start gap-2', mutedClass)}>
            <p>
              <span className="hidden sm:inline">Prefer email? </span>
              <a href="mailto:ericjshell@gmail.com" className="underline underline-offset-2 hover:opacity-80 transition-opacity">Email</a>
            </p>
            <span aria-hidden="true" className="h-3 w-px bg-current opacity-40" />
            <p>
              <span className="hidden sm:inline">Messages are saved so I can reply. </span>
              <a href="/privacy" className="underline underline-offset-2 hover:opacity-80 transition-opacity">Privacy</a>
            </p>
          </div>
        </div>
      </form>
    </Panel>
  )
}
