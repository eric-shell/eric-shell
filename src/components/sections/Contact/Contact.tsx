import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button, CascadeGroup, CascadeItem, Eyebrow, H2 } from '../../ui'

type SubmitStatus = 'idle' | 'success' | 'error'

function InputField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  maxLength,
  disabled,
  required,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-sans text-sm font-semibold text-off-black">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        required={required}
        className="w-full rounded-lg border border-off-black/20 bg-transparent px-4 py-3 font-sans text-sm text-off-black placeholder:text-off-black/30 focus:border-off-black/60 focus:outline-none transition disabled:opacity-50"
      />
      {maxLength && (
        <span className="font-sans text-xs text-off-black/30 text-right">
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  )
}

function TextareaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
  maxLength,
  disabled,
  required,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  maxLength?: number
  disabled?: boolean
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-sans text-sm font-semibold text-off-black">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        required={required}
        className="w-full resize-none rounded-lg border border-off-black/20 bg-transparent px-4 py-3 font-sans text-sm text-off-black placeholder:text-off-black/30 focus:border-off-black/60 focus:outline-none transition disabled:opacity-50"
      />
      {maxLength && (
        <span className="font-sans text-xs text-off-black/30 text-right">
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  )
}

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  function validate(): boolean {
    if (!name.trim()) { setErrorMessage('Please enter your name.'); return false }
    if (name.length > 100) { setErrorMessage('Name must be 100 characters or less.'); return false }
    if (!email.trim()) { setErrorMessage('Please enter your email.'); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErrorMessage('Please enter a valid email address.'); return false }
    if (!message.trim()) { setErrorMessage('Please enter a message.'); return false }
    if (message.length < 10) { setErrorMessage('Message must be at least 10 characters.'); return false }
    if (message.length > 2000) { setErrorMessage('Message must be 2000 characters or less.'); return false }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitStatus('idle')
    setErrorMessage('')

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
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        setName('')
        setEmail('')
        setMessage('')
      } else {
        setSubmitStatus('error')
        setErrorMessage(data.error || 'Failed to send message. Please try again.')
      }
    } catch {
      setSubmitStatus('error')
      setErrorMessage('An unexpected error occurred. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="bg-white py-24">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">

          {/* Left: heading + copy */}
          <CascadeGroup className="flex flex-col gap-6" threshold={0.15}>
            <CascadeItem index={0}>
              <div>
                <Eyebrow className="text-off-black mb-4 block">Say Hello</Eyebrow>
                <H2 className="text-off-black">Get in Touch</H2>
              </div>
            </CascadeItem>
            <CascadeItem index={1}>
              <p className="font-sans text-base leading-relaxed text-off-black/60 max-w-sm">
                Have a project in mind, a role to fill, or just want to connect?
                Drop me a message and I'll get back to you.
              </p>
            </CascadeItem>
            <CascadeItem index={2}>
              <a
                href="mailto:ericjshell@gmail.com"
                className="font-sans text-sm font-semibold text-off-black hover:text-off-black/60 transition-colors"
              >
                ericjshell@gmail.com
              </a>
            </CascadeItem>
          </CascadeGroup>

          {/* Right: form */}
          <CascadeGroup className="flex flex-col gap-6" threshold={0.1}>

            {submitStatus === 'success' ? (
              <CascadeItem index={0}>
                <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-5">
                  <p className="font-sans text-sm font-semibold text-green-800">Message sent!</p>
                  <p className="font-sans text-sm text-green-700 mt-1">
                    Thanks for reaching out. I'll be in touch soon.
                  </p>
                </div>
              </CascadeItem>
            ) : (
              <CascadeItem index={0}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                  <InputField
                    id="contact-name"
                    label="Name"
                    value={name}
                    onChange={setName}
                    placeholder="Jane Smith"
                    maxLength={100}
                    disabled={isSubmitting}
                    required
                  />
                  <InputField
                    id="contact-email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="jane@example.com"
                    maxLength={100}
                    disabled={isSubmitting}
                    required
                  />
                  <TextareaField
                    id="contact-message"
                    label="Message"
                    value={message}
                    onChange={setMessage}
                    placeholder="Tell me what you're working on..."
                    rows={6}
                    maxLength={2000}
                    disabled={isSubmitting}
                    required
                  />

                  {errorMessage && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                      <p className="font-sans text-sm text-red-700">{errorMessage}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="self-start"
                    rightIcon={<Send size={14} aria-hidden="true" />}
                  >
                    {isSubmitting ? 'Sending…' : 'Send Message'}
                  </Button>
                </form>
              </CascadeItem>
            )}

          </CascadeGroup>

        </div>
      </div>
    </section>
  )
}
