import { useState } from 'react'
import { Send } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import Button from '../Button'
import Input from '../Input'
import Panel from '../Panel'
import Textarea from '../Textarea'
import { toast } from '../Toast'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type ErrorField = 'name' | 'email' | 'message' | null

interface ContactFormProps {
  className?: string
  defaultTheme?: 'white' | 'dark'
  showThemeToggle?: boolean
  onSuccess?: () => void
}

export default function ContactForm({
  className,
  defaultTheme = 'dark',
  showThemeToggle = true,
  onSuccess,
}: ContactFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorField, setErrorField] = useState<ErrorField>(null)
  const [isWhite, setIsWhite] = useState(defaultTheme === 'white')

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
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <Panel variant={isWhite ? 'white' : 'glass-light'} className={twMerge('relative rounded-2xl p-8', className)}>
      {showThemeToggle && (
        <button
          role="switch"
          aria-checked={isWhite}
          aria-label="Toggle high-contrast mode"
          onClick={() => setIsWhite(v => !v)}
          className={twMerge(
            'absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors',
            isWhite ? 'text-blue-950' : 'text-white'
          )}
        >
          <span className={twMerge(
            'relative inline-flex h-4 w-7 items-center rounded-full cursor-pointer transition-colors',
            isWhite ? 'bg-blue-700 hover:bg-blue-800' : 'bg-black/20 hover:bg-black/50'
          )}>
            <span className={twMerge(
              'inline-block h-2.5 w-2.5 rounded-full bg-white shadow transition-transform',
              isWhite ? 'translate-x-3.5' : 'translate-x-0.5'
            )} />
          </span>
          <span className="font-sans text-xs font-semibold tracking-wide">WCAG</span>
        </button>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col pt-5 gap-2" noValidate>
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
        <Input
          id="contact-name"
          label="Name"
          theme={isWhite ? 'white' : 'dark'}
          value={name}
          onChange={handleFieldChange('name', setName)}
          placeholder="Jane Smith"
          maxLength={100}
          disabled={isSubmitting}
          required
          valid={nameValid}
          error={errorField === 'name'}
          autoComplete="name"
        />
        <Input
          id="contact-email"
          label="Email"
          theme={isWhite ? 'white' : 'dark'}
          type="email"
          value={email}
          onChange={handleFieldChange('email', setEmail)}
          placeholder="jane@example.com"
          maxLength={100}
          disabled={isSubmitting}
          required
          valid={emailValid}
          error={errorField === 'email'}
          autoComplete="email"
          inputMode="email"
        />
        <Textarea
          id="contact-message"
          label="Message"
          theme={isWhite ? 'white' : 'dark'}
          value={message}
          onChange={handleFieldChange('message', setMessage)}
          placeholder="Tell me what you're working on..."
          rows={6}
          maxLength={2000}
          disabled={isSubmitting}
          required
          valid={messageValid}
          error={errorField === 'message'}
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          className="shadow-md self-end"
          rightIcon={<Send size={14} strokeWidth={2.5} aria-hidden="true" />}
        >
          {isSubmitting ? 'Sending…' : 'Send Message'}
        </Button>
      </form>
    </Panel>
  )
}
