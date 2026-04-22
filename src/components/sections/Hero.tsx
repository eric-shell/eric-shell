import { useState } from 'react'
import { Button, CascadeGroup, CascadeItem, Eyebrow } from '../ui'

export default function Hero() {
  const [message, setMessage] = useState('')

  const handleSubmit = () => {
    if (!message.trim()) return
    // TODO: wire up chat
    setMessage('')
  }

  return (
    <section className="relative min-h-screen bg-blue overflow-hidden flex items-center justify-center">
      <CascadeGroup mountOnly className="flex flex-col items-center gap-8 max-w-2xl w-full px-6 py-24 text-center">
        <CascadeItem index={0}>
          <Eyebrow className="text-white">AI Design Systems Engineer</Eyebrow>
        </CascadeItem>

        <CascadeItem index={1}>
          <h1 className="sr-only">Eric Shell | AI Design System Engineer and Software Developer</h1>
          <img src="/logo.svg" alt="" aria-hidden="true" className="w-64" />
        </CascadeItem>

        <CascadeItem index={2}>
          <p className="font-sans text-lg text-white max-w-prose leading-relaxed">
            I'm an AI Design Systems Engineer with over 15 years of professional experience, living on the bleeding edge of modern web and mobile development and passionate about crafting captivating digital experiences with the latest technologies.
          </p>
        </CascadeItem>

        <CascadeItem index={3} className="w-full">
          <div className="w-full flex flex-col gap-3">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit() }}
              placeholder="Ask me anything…"
              rows={3}
              className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-4 py-3 font-sans text-base resize-none focus:outline-none focus:border-white/60 focus:bg-white/15 transition"
            />
            <Button
              onClick={handleSubmit}
              size="md"
              className="self-end bg-white text-blue hover:bg-off-white"
            >
              Send
            </Button>
          </div>
        </CascadeItem>
      </CascadeGroup>
    </section>
  )
}
