import { lazy, Suspense, useState } from 'react'
import { Send } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { Button, CascadeGroup, CascadeItem, Eyebrow, H2, Input, Panel, Textarea } from '../../ui'
import { useParallax } from '../../../hooks'

const ParticlesSmall = lazy(() => import('../Hero/ParticlesSmall'))
const ParticlesLarge = lazy(() => import('../Hero/ParticlesLarge'))

type SubmitStatus = 'idle' | 'success' | 'error'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isWhite, setIsWhite] = useState(false)

  const { sectionRef, bgRef, gradientRef, handleMouseMove, handleMouseLeave } = useParallax({
    bgStrength: 15,
    gradientStrength: 8,
    subjectStrength: 0,
    lerpFactor: 0.08,
  })

  const nameValid = name.trim().length > 0 && name.length <= 100
  const emailValid = EMAIL_RE.test(email.trim()) && email.length <= 100
  const messageValid = message.trim().length >= 10 && message.length <= 2000

  function validate(): boolean {
    if (!name.trim()) { setErrorMessage('Please enter your name.'); return false }
    if (name.length > 100) { setErrorMessage('Name must be 100 characters or less.'); return false }
    if (!email.trim()) { setErrorMessage('Please enter your email.'); return false }
    if (!emailValid) { setErrorMessage('Please enter a valid email address.'); return false }
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
          website,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        setName('')
        setEmail('')
        setMessage('')
        setWebsite('')
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
    <section
      id="contact"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen overflow-hidden flex items-center"
    >
      <picture>
        <source
          type="image/avif"
          srcSet="/contact/EJS01845-640.avif 640w, /contact/EJS01845-1280.avif 1280w, /contact/EJS01845-1920.avif 1920w, /contact/EJS01845-2560.avif 2560w"
          sizes="100vw"
        />
        <source
          type="image/webp"
          srcSet="/contact/EJS01845-640.webp 640w, /contact/EJS01845-1280.webp 1280w, /contact/EJS01845-1920.webp 1920w, /contact/EJS01845-2560.webp 2560w"
          sizes="100vw"
        />
        <img
          ref={bgRef}
          src="/contact/EJS01845-1920.jpg"
          srcSet="/contact/EJS01845-640.jpg 640w, /contact/EJS01845-1280.jpg 1280w, /contact/EJS01845-1920.jpg 1920w, /contact/EJS01845-2560.jpg 2560w"
          sizes="100vw"
          alt="Eric looking up toward the sky"
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          style={{ transform: 'scale(1.04) translate(0px, 0px)' }}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      </picture>

      <Suspense fallback={null}><ParticlesSmall mode="fall-toward" /></Suspense>

      <div
        ref={gradientRef}
        className="absolute inset-0 z-[5] pointer-events-none mix-blend-multiply"
        style={{ background: 'radial-gradient(ellipse 45% 70% at 25% 50%, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 50%, transparent 80%)' }}
      />

      <Suspense fallback={null}><ParticlesLarge mode="fall-toward" /></Suspense>

      <div className="relative z-20 w-full max-w-[1440px] mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

        {/* Left: heading + copy */}
        <CascadeGroup className="flex flex-col gap-6" threshold={0.15}>
          <CascadeItem index={0}>
            <div>
              <Eyebrow size="lg" className="text-white text-shadow-md pb-2 block">Say Hello</Eyebrow>
              <H2 className="text-white text-shadow-lg">Get in Touch</H2>
            </div>
          </CascadeItem>
          <CascadeItem index={1}>
            <p className="font-sans text-lg leading-relaxed text-white text-shadow-md max-w-lg">
              Have a project in mind, a role to fill, or just want to connect?
              Drop me a message and I'll get back to you.
            </p>
          </CascadeItem>
          <CascadeItem index={2}>
            <p className="font-sans text-base leading-relaxed text-white/80 text-shadow-md max-w-sm">
              I read every message and usually reply within a day or two.
              A little context goes a long way — the more you share, the better I can respond.
            </p>
          </CascadeItem>
          <CascadeItem index={3}>
            <p className="font-sans text-base leading-relaxed text-white/80 text-shadow-md max-w-sm">
              Prefer to skip the form? Email works just as well — you'll find the address in the footer.
            </p>
          </CascadeItem>
        </CascadeGroup>

        {/* Right: form */}
        <CascadeGroup className="flex flex-col gap-6" threshold={0.1}>

          {submitStatus === 'success' ? (
            <CascadeItem index={0}>
              <Panel variant="glass-light" className="rounded-2xl px-6 py-5 border border-emerald-300/40">
                <p className="font-sans text-sm font-semibold text-emerald-100 text-shadow-md">Message sent!</p>
                <p className="font-sans text-sm text-white/80 text-shadow-md mt-1">
                  Thanks for reaching out. I'll be in touch soon.
                </p>
              </Panel>
            </CascadeItem>
          ) : (
            <CascadeItem index={0}>
              <Panel variant={isWhite ? 'white' : 'glass-light'} className="relative rounded-2xl p-8">
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
                    'relative inline-flex h-4 w-7 items-center rounded-full transition-colors',
                    isWhite ? 'bg-blue-700' : 'bg-white/30'
                  )}>
                    <span className={twMerge(
                      'inline-block h-2.5 w-2.5 rounded-full bg-white shadow transition-transform',
                      isWhite ? 'translate-x-3.5' : 'translate-x-0.5'
                    )} />
                  </span>
                  <span className="font-sans text-xs font-semibold tracking-wide">AA</span>
                </button>
                <form onSubmit={handleSubmit} className="flex flex-col gap-2" noValidate>
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
                    onChange={setName}
                    placeholder="Jane Smith"
                    maxLength={100}
                    disabled={isSubmitting}
                    required
                    valid={nameValid}
                    autoComplete="name"
                  />
                  <Input
                    id="contact-email"
                    label="Email"
                    theme={isWhite ? 'white' : 'dark'}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="jane@example.com"
                    maxLength={100}
                    disabled={isSubmitting}
                    required
                    valid={emailValid}
                    autoComplete="email"
                    inputMode="email"
                  />
                  <Textarea
                    id="contact-message"
                    label="Message"
                    theme={isWhite ? 'white' : 'dark'}
                    value={message}
                    onChange={setMessage}
                    placeholder="Tell me what you're working on..."
                    rows={6}
                    maxLength={2000}
                    disabled={isSubmitting}
                    required
                    valid={messageValid}
                  />

                  {errorMessage && (
                    <div className="rounded-lg border border-red-300/40 bg-red-500/15 px-4 py-3">
                      <p className={twMerge('font-sans text-sm', isWhite ? 'text-red-700' : 'text-red-100 text-shadow-md')}>{errorMessage}</p>
                    </div>
                  )}

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
            </CascadeItem>
          )}

        </CascadeGroup>

      </div>
    </section>
  )
}
