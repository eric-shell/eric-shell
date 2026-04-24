import { lazy, Suspense, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button, CascadeGroup, CascadeItem, Chat, Eyebrow } from '../../ui'
import { useParallax } from '../../../hooks'

const ParticlesSmall = lazy(() => import('./ParticlesSmall'))
const ParticlesLarge = lazy(() => import('./ParticlesLarge'))

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
      <picture>
        <source
          type="image/avif"
          srcSet="/hero/background-640.avif 640w, /hero/background-1280.avif 1280w, /hero/background-1920.avif 1920w"
          sizes="100vw"
        />
        <source
          type="image/webp"
          srcSet="/hero/background-640.webp 640w, /hero/background-1280.webp 1280w, /hero/background-1920.webp 1920w"
          sizes="100vw"
        />
        <img
          ref={bgRef}
          src="/hero/background-1280.jpg"
          srcSet="/hero/background-640.jpg 640w, /hero/background-1280.jpg 1280w, /hero/background-1920.jpg 1920w"
          sizes="100vw"
          alt="Sequoia National Forest background"
          aria-hidden="true"
          fetchPriority="high"
          style={{ transform: 'scale(1.04) translate(0px, 0px)' }}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      </picture>
      <Suspense fallback={null}><ParticlesSmall /></Suspense>
      <picture>
        <source
          type="image/avif"
          srcSet="/hero/subject-512.avif 512w, /hero/subject-1024.avif 1024w"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <source
          type="image/webp"
          srcSet="/hero/subject-512.webp 512w, /hero/subject-1024.webp 1024w"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <img
          ref={subjectRef}
          src="/hero/subject-1024.png"
          srcSet="/hero/subject-512.png 512w, /hero/subject-1024.png 1024w"
          sizes="(max-width: 1024px) 100vw, 50vw"
          alt="Eric Shell looking up at a Redwood Tree"
          aria-hidden="true"
          fetchPriority="high"
          style={{ bottom: '-30px' }}
          className="absolute right-0 h-[85vh] max-h-[900px] w-auto object-bottom object-contain pointer-events-none select-none z-10"
        />
      </picture>
      <Suspense fallback={null}><ParticlesLarge /></Suspense>
      <div
        ref={gradientRef}
        className="absolute inset-0 z-[5] pointer-events-none mix-blend-multiply"
        style={{ background: 'radial-gradient(ellipse 65% 85% at 28% 55%, rgba(0,0,0,0.8) 0%, transparent 70%)' }}
      />
      <div className="relative z-20 w-full max-w-[1440px] mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left: text content */}
        <CascadeGroup mountOnly className="flex flex-col gap-6">
          <CascadeItem index={0}>
            <Eyebrow size="lg" className="text-white text-shadow-md pb-2">What's up! My name is <span className="sr-only">Eric Shell.</span></Eyebrow>
          </CascadeItem>

          <CascadeItem index={1}>
            <h1 className="sr-only">Eric Shell | AI Design System Engineer and Software Developer</h1>
            <img src="/logo.svg" alt="" aria-hidden="true" className="w-125" />
          </CascadeItem>

          <CascadeItem index={2}>
            <p className="font-sans text-3xl text-white leading-relaxed text-shadow-lg pt-3">
              I'm an AI Design Systems Engineer with over 15 years of professional experience developing modern web and mobile applications.
            </p>
          </CascadeItem>
        </CascadeGroup>

        {/* Right: chat interface */}
        <CascadeGroup mountOnly>
          <CascadeItem index={0}>
            <Chat
              value={message}
              onChange={setMessage}
              onSubmit={handleSubmit}
            >
              <p className="font-sans text-sm text-white">
                Ask me anything about my work, skills, or experience.
              </p>
            </Chat>
          </CascadeItem>
        </CascadeGroup>

      </div>

      <CascadeGroup mountOnly className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
        <CascadeItem index={0}>
          <Button
            href="#work"
            variant="glass-light"
            shape="square"
            aria-label="Scroll to work"
            className="rounded-full animate-bounce"
          >
            <ChevronDown size={20} aria-hidden="true" />
          </Button>
        </CascadeItem>
      </CascadeGroup>
    </section>
  )
}
