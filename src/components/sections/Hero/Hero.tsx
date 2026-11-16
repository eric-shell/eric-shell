import { lazy, Suspense } from 'react'
import { ChevronDown } from 'lucide-react'
import { Backdrop, Button, CascadeGroup, CascadeItem, Chat, Container, Eyebrow } from '../../ui'
import { useChat, useParallax } from '@/hooks'
import { useHydrated } from '@/lib/hydration'

const ParticlesSmall = lazy(() => import('./ParticlesSmall'))
const ParticlesLarge = lazy(() => import('./ParticlesLarge'))

/**
 * Height of the chat panel with no conversation in it, in px.
 *
 * Measured, not designed: 430 at every width from 320 to 1920, because the
 * thread has a fixed minimum height and the empty state never outgrows it. The
 * placeholder that stands in for the chat until hydration is this tall, so the
 * panel replaces it without moving anything. If the chat's resting layout
 * changes, re-measure `.genie-panel` and update this.
 */
const CHAT_RESTING_HEIGHT = 430

/**
 * A 1x1 transparent GIF, for the `<source>` that keeps the subject photo off
 * small screens. See the comment on that `<picture>`.
 */
const EMPTY_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

export default function Hero() {
  const { messages, input, setInput, send, isLoading, reset } = useChat()
  const hydrated = useHydrated()
  const { sectionRef, bgRef, gradientRef, subjectRef, handleMouseMove, handleMouseLeave } = useParallax({
    bgStrength: 15,
    gradientStrength: 8,
    subjectStrength: 25,
    lerpFactor: 0.08,
  })

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
      {/* Mounted after hydration, never prerendered. A canvas has nothing to
          show until its effect draws on it, so there is no markup worth
          shipping — and a prerendered one would sit behind a Suspense boundary
          that this component re-renders past (the `hydrated` flip itself),
          which makes React discard and rebuild it with a logged error. */}
      {hydrated && <Suspense fallback={null}><ParticlesSmall /></Suspense>}
      <picture>
        {/* The subject is `hidden lg:block`, and `display: none` does not stop
            an `<img>` downloading: every phone was fetching a 101KB cutout it
            never showed, at high priority, alongside the real LCP image. A
            source that matches first below `lg` and resolves to an inline
            pixel gives the browser something else to pick, so no request is
            made. Keep the breakpoint in step with the `lg:block` below. */}
        <source media="(max-width: 1023.98px)" srcSet={EMPTY_IMAGE} />
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
          className="hidden lg:block absolute right-0 h-[85vh] max-h-[900px] w-auto object-bottom object-contain pointer-events-none select-none z-10"
        />
      </picture>
      {hydrated && <Suspense fallback={null}><ParticlesLarge /></Suspense>}
      <div
        ref={gradientRef}
        className="absolute inset-0 z-[5] pointer-events-none mix-blend-multiply"
        style={{ background: 'radial-gradient(ellipse 65% 85% at 28% 55%, rgba(0,0,0,0.8) 0%, transparent 70%)' }}
      />
      <Backdrop tone="photo" className="z-6" />
      <Container className="relative z-20 w-full py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left: text content */}
        <CascadeGroup mountOnly className="flex flex-col gap-6">
          <CascadeItem index={0}>
            <Eyebrow size="lg" className="text-white text-shadow-md pb-2">What's up! My name is <span className="sr-only">Eric Shell.</span></Eyebrow>
          </CascadeItem>

          <CascadeItem index={1}>
            <h1 className="sr-only">Eric Shell | AI Design Systems Engineer and Software Developer</h1>
            {/* width/height are the SVG's own viewBox, rounded. The class sets
                the rendered width; these give the browser the aspect ratio
                before the file arrives, so the line below it does not jump
                down when it does. */}
            <img src="/logo.svg" alt="" aria-hidden="true" width={563} height={308} className="w-125 hover:scale-[105%] hover:rotate-2 transition" />
          </CascadeItem>

          <CascadeItem index={2}>
            <p className="font-sans text-2xl md:text-3xl text-white leading-relaxed text-shadow-lg pt-3">
              I'm an AI Design Systems Engineer with over 15 years of professional experience developing modern web and mobile applications.
            </p>
          </CascadeItem>
        </CascadeGroup>

        {/* Right: chat interface */}
        <CascadeGroup mountOnly>
          {/* slideOnly: the panel's glass fades itself (animate-glass-in) — an
              opacity fade out here would break its backdrop-filter. */}
          <CascadeItem index={0} slideOnly>
            {/* The one part of the page that is not prerendered. What the chat
                first shows depends on things only the browser knows (a thread
                saved in localStorage, reduced motion, whether there is speech
                recognition), so its build-time markup could not match and
                React would throw the whole hero away to recover. It mounts in
                the first render after hydration instead; until then an empty
                box holds its place so the column beside it does not move. */}
            {!hydrated ? <div aria-hidden="true" style={{ height: CHAT_RESTING_HEIGHT }} /> : (
            <Chat
              value={input}
              onChange={setInput}
              onSubmit={send}
              onPrompt={send}
              suggestions={[
                'What is your experience with design systems?',
                'Have you led teams?',
                'What stack do you work in?',
              ]}
              placeholders={[
                'Ask me anything…',
                'What are you working on now?',
                'How do you use AI day to day?',
                'Tell me about your design system work.',
                'Are you available for contract work?',
              ]}
              messages={messages}
              isLoading={isLoading}
              onClear={reset}
              welcomeMessage="Ask me anything about my work, skills, or experience!"
            />
            )}
          </CascadeItem>
        </CascadeGroup>

      </Container>

      <CascadeGroup mountOnly className="hidden lg:block absolute bottom-24 left-1/2 -translate-x-1/2 z-30">
        <CascadeItem index={0}>
          <Button
            href="#work"
            variant="glass-light"
            shape="square"
            aria-label="Scroll to work"
            className="rounded-full shadow-md animate-bounce"
          >
            <ChevronDown size={20} strokeWidth={2.5} aria-hidden="true" />
          </Button>
        </CascadeItem>
      </CascadeGroup>
    </section>
  )
}
