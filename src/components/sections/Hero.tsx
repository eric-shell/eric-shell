import { useRef, useEffect, useState } from 'react'

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!canvas.getContext('2d')) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => ro.disconnect()
    // TODO: TV/glitch/channel-warp animation loop
  }, [])

  const handleSubmit = () => {
    if (!message.trim()) return
    // TODO: wire up chat
    setMessage('')
  }

  return (
    <section className="relative min-h-screen bg-blue overflow-hidden flex items-center justify-center">
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-2xl w-full px-6 py-24 text-center">

        <p className="font-display uppercase tracking-widest text-sm text-white/70">
          Lead Front End Developer
        </p>

        <img src="/logo.svg" alt="Eric Shell" className="w-64" />

        <p className="font-sans text-lg text-white/90 max-w-prose leading-relaxed">
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

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
        aria-hidden="true"
      />
    </section>
  )
}
