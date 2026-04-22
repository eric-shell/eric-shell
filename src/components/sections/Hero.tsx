import { useState } from 'react'

export default function Hero() {
  const [message, setMessage] = useState('')

  const handleSubmit = () => {
    if (!message.trim()) return
    // TODO: wire up chat
    setMessage('')
  }

  return (
    <section className="relative min-h-screen bg-blue overflow-hidden flex items-center justify-center">
      <div className="flex flex-col items-center gap-8 max-w-2xl w-full px-6 py-24 text-center">

        <p
          className="font-sans font-bold uppercase tracking-wider text-sm text-white"
          style={{ fontVariationSettings: "'GRAD' 150" }}
        >
          AI Design System Engineer
        </p>

        <h1 className="sr-only">Eric Shell - AI Design System Engineer and Software Developer</h1>
        <img src="/logo.svg" alt="" aria-hidden="true" className="w-64" />

        <p className="font-sans text-lg text-white max-w-prose leading-relaxed">
          I am a Lead Front End Developer and Acquia Certified Drupal Specialist
          with a passion for creating visually captivating, highly responsive,
          fully accessible and efficient digital experiences.
        </p>

        <div className="w-full flex flex-col gap-3">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit() }}
            placeholder="Ask me anything…"
            rows={3}
            className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-4 py-3 font-sans text-base resize-none focus:outline-none focus:border-white/60 focus:bg-white/15 transition"
          />
          <button
            onClick={handleSubmit}
            className="self-end px-6 py-2.5 rounded-lg bg-white text-blue font-sans font-semibold text-sm hover:bg-off-white transition cursor-pointer"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  )
}
