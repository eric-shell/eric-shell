import { useState } from 'react'
import { MessagesSquare } from 'lucide-react'
import { Button, CascadeGroup, CascadeItem, Eyebrow } from '../../ui'
import { useParallax } from '../../../hooks'
import ParticlesSmall from './ParticlesSmall'
import ParticlesLarge from './ParticlesLarge'

export default function Hero() {
  const [message, setMessage] = useState('')
  const { sectionRef, bgRef, gradientRef, subjectRef, handleMouseMove, handleMouseLeave } = useParallax({
    bgStrength: 15,
    gradientStrength: 8,
    subjectStrength: 25,
    lerpFactor: 0.08,
  })

  const handleSubmit = () => {
    if (!message.trim()) return
    // TODO: wire up chat
    setMessage('')
  }

  return (
    <section
      id="hero"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen overflow-hidden flex items-center"
    >
      <img
        ref={bgRef}
        src="/hero/background.jpg"
        alt="Sequoia National Forest background"
        aria-hidden="true"
        style={{ transform: 'scale(1.04) translate(0px, 0px)' }}
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <ParticlesSmall />
      <img
        ref={subjectRef}
        src="/hero/subject.png"
        alt="Eric Shell looking up at a Redwood Tree"
        aria-hidden="true"
        style={{ bottom: '-30px' }}
        className="absolute right-0 h-[85vh] max-h-[900px] w-auto object-bottom object-contain pointer-events-none select-none z-10"
      />
      <ParticlesLarge />
      <div
        ref={gradientRef}
        className="absolute inset-0 z-[5] pointer-events-none mix-blend-multiply"
        style={{ background: 'radial-gradient(ellipse 65% 85% at 28% 55%, rgba(0,0,0,0.8) 0%, transparent 70%)' }}
      />
      <div className="relative z-20 w-full max-w-[1440px] mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left: text content */}
        <CascadeGroup mountOnly className="flex flex-col gap-6">
          <CascadeItem index={0}>
            <Eyebrow size="lg" className="text-white pb-2">What's up! My name is <span className="sr-only">Eric Shell.</span></Eyebrow>
          </CascadeItem>

          <CascadeItem index={1}>
            <h1 className="sr-only">Eric Shell | AI Design System Engineer and Software Developer</h1>
            <img src="/logo.svg" alt="" aria-hidden="true" className="w-125" />
          </CascadeItem>

          <CascadeItem index={2}>
            <p className="font-sans text-3xl text-white leading-relaxed pt-3">
              I'm an AI Design Systems Engineer with over 15 years of professional experience developing modern web and mobile applications.
            </p>
          </CascadeItem>
        </CascadeGroup>

        {/* Right: chat interface */}
        <CascadeGroup mountOnly>
          <CascadeItem index={0}>
            <div className="relative flex flex-col rounded-2xl border border-white/20 overflow-hidden">
              <div className="hero-glass-blur absolute inset-0 bg-white/10 [animation:blur-in_1s_cubic-bezier(0.16,1,0.3,1)_0.3s_both]" />
              <div className="relative flex-1 min-h-[320px] p-6 flex items-end">
                <p className="font-sans text-sm text-white">
                  Ask me anything about my work, skills, or experience.
                </p>
              </div>
              <div className="relative border-t border-white/20 p-4 flex flex-col gap-3">
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
                  rightIcon={<MessagesSquare size={15} aria-hidden="true" />}
                >
                  Start a Chat
                </Button>
              </div>
            </div>
          </CascadeItem>
        </CascadeGroup>

      </div>
    </section>
  )
}
