import { lazy, Suspense, useEffect, useState } from 'react'
import { ArrowRight, Mail } from 'lucide-react'
import { Button, CascadeGroup, CascadeItem, Chat, Container, Eyebrow, RiseText } from '../../ui'
import { useChat, useParallax } from '@/hooks'
import { useHydrated } from '@/lib/hydration'
import type { RGB } from './particleSprite'

const ParticlesSmall = lazy(() => import('./ParticlesSmall'))
const ParticlesLarge = lazy(() => import('./ParticlesLarge'))

/**
 * Height of the chat panel with no conversation in it, in px.
 *
 * Measured, not designed: 394 from 1024 up, where the hero shows it beside
 * the copy and the three suggestions fit one row (471px of chips in a 534px
 * row; the column is 560px at every width from 1024). On narrower screens the
 * panel is below the fold and the suggestions may wrap. Longer suggestions
 * that wrap to a second row at 1024 change this number. The thread has a
 * fixed minimum height and the empty state never outgrows it. The
 * placeholder that stands in for the chat until hydration is this tall, so the
 * panel replaces it without moving anything. If the chat's resting layout
 * changes, re-measure `.genie-panel` and update this.
 */
const CHAT_RESTING_HEIGHT = 394

/**
 * A 1x1 transparent GIF, for the `<source>` that keeps the subject photo off
 * small screens. See the comment on that `<picture>`.
 */
const EMPTY_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/** The light motes, retinted cyan to sit in the blue duotone. Module-level: they are effect dependencies. */
const MOTES_SMALL: RGB[] = [[0.86, 0.97, 1.0], [1, 1, 1], [0.73, 0.93, 1.0], [0.62, 0.9, 1.0]]
const MOTES_LARGE: RGB = [0.78, 0.95, 1.0]

/**
 * The wordmark spans the content width. `ERIC SHELL` set by RiseText (the
 * font's kerning plus -0.02em tracking) measures 5.53em in the browser, so the
 * content width divided by a hair more than that fills the line. Container's
 * padding is 2 × 24px and it stops growing at 1440px.
 */
const WORDMARK_SIZE = 'text-[calc((min(100vw,1440px)-48px)/5.6)]'
const WORDMARK = `block whitespace-nowrap font-display font-bold uppercase leading-[0.8] ${WORDMARK_SIZE}`

/**
 * A duotone poster. The forest is pushed into Luminous Blue, "ERIC SHELL" runs
 * the full width behind the subject, and the subject stands in front of it in
 * full colour. An outlined copy of the wordmark is drawn over the subject so the
 * letters his head covers still read.
 *
 * Layering is the whole design, so z-order is explicit: photo 0, tint 1,
 * wordmark 8, subject 10, outline 11, motes 12, copy and chat 20, opening wipe
 * 40. The wordmark is deliberately NOT inside a CascadeItem: a CascadeItem's
 * transform makes it a stacking context, which would pin the wordmark to one
 * layer and lose the overlap. It animates its own letters from the group's
 * mount flag instead.
 */
/** Lifts (or settles) one wordmark letter in every copy inside `root`. */
function liftLetter(root: HTMLElement, target: EventTarget, lift: boolean) {
  const letter = (target as Element).closest?.('.rise-ch') as HTMLElement | null
  if (!letter) return
  root.querySelectorAll(`.rise-ch[data-i="${letter.dataset.i}"]`).forEach(el => el.classList.toggle('is-lifted', lift))
}

export default function Hero() {
  const { messages, input, setInput, send, isLoading, reset } = useChat()
  const hydrated = useHydrated()
  const { sectionRef, bgRef, gradientRef, subjectRef, handleMouseMove, handleMouseLeave } = useParallax({
    bgStrength: 15,
    gradientStrength: 8,
    subjectStrength: 25,
    lerpFactor: 0.08,
  })

  // Once the whole hero has scrolled away above, the chat docks to a floating
  // button at the bottom right (see Chat's `docked`), so it is always one click
  // away. Below the hero only: a hero not yet scrolled to doesn't count.
  const [docked, setDocked] = useState(false)
  useEffect(() => {
    const el = sectionRef.current
    if (!el || !hydrated) return
    const io = new IntersectionObserver(([entry]) => {
      setDocked(!entry.isIntersecting && entry.boundingClientRect.top < 0)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [sectionRef, hydrated])

  return (
    <section
      id="hero"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="hero-timeline relative isolate min-h-screen overflow-hidden bg-ink text-white"
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
          className="absolute inset-0 w-full h-full object-cover z-0 duotone-lum"
        />
      </picture>
      <div
        ref={gradientRef}
        aria-hidden="true"
        className="absolute -inset-4 z-[1] pointer-events-none bg-[radial-gradient(60%_55%_at_72%_28%,rgba(143,232,255,0.28),transparent_70%),linear-gradient(180deg,rgba(10,16,51,0.5)_0%,transparent_26%,transparent_52%,rgba(10,16,51,0.82)_100%)]"
      />
      {/* Mounted after hydration, never prerendered. A canvas has nothing to
          show until its effect draws on it, so there is no markup worth
          shipping — and a prerendered one would sit behind a Suspense boundary
          that this component re-renders past (the `hydrated` flip itself),
          which makes React discard and rebuild it with a logged error. */}
      {hydrated && <Suspense fallback={null}><ParticlesSmall palette={MOTES_SMALL} /></Suspense>}
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
          className="hidden lg:block absolute right-[3%] h-[90vh] max-h-[880px] w-auto object-bottom object-contain pointer-events-none select-none z-10 lu-wipe-in"
        />
      </picture>
      {hydrated && <Suspense fallback={null}><ParticlesLarge color={MOTES_LARGE} /></Suspense>}

      <Container className="relative min-h-screen flex flex-col pt-28 pb-20">
        <h1 className="sr-only">Eric Shell | AI Design Systems Engineer and Software Developer</h1>
        <CascadeGroup mountOnly className="flex flex-col flex-1">
          <CascadeItem index={6} className="relative z-[21]">
            <Eyebrow size="lg" className="text-white text-shadow-md ml-6">What's up! My name is</Eyebrow>
          </CascadeItem>

          {/* The drift is on each copy, not this wrapper: a transform here would
              make it a stacking context and put both copies on one side of the subject. */}
          {/* Letters lift under the pointer. The handler lifts the same letter in
              both copies (matched by RiseText's `data-i`), so the outline over the
              subject stays in register with the solid letter behind him. */}
          <div
            aria-hidden="true"
            className="relative self-start mt-3 -ml-[0.03em] text-white"
            onPointerOver={(e) => liftLetter(e.currentTarget, e.target, true)}
            onPointerOut={(e) => liftLetter(e.currentTarget, e.target, false)}
          >
            <RiseText
              text="Eric Shell"
              delayMs={550}
              stagger={45}
              className={`${WORDMARK} hero-exit-drift relative z-[8] [text-shadow:0_18px_60px_rgba(5,10,60,0.35)]`}
            />
            <RiseText
              text="Eric Shell"
              delayMs={550}
              stagger={45}
              className={`${WORDMARK} hero-exit-drift absolute left-0 top-0 z-[11] text-transparent [-webkit-text-stroke:2px_rgba(255,255,255,0.92)] pointer-events-none`}
            />
          </div>

          <div className="relative z-20 mt-auto pt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] gap-8 lg:gap-16 items-end">
            <CascadeItem index={7} className="flex flex-col gap-6">
              <p className="font-sans text-xl md:text-2xl leading-relaxed text-white text-shadow-xl max-w-[450px]">
                I'm an AI Design Systems Engineer with over 15 years of professional experience leading and developing modern web and mobile applications.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <Button href="#work" variant="white" className="border-0" rightIcon={<ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />}>
                  See the work
                </Button>
                <Button href="#contact" variant="luminous" rightIcon={<Mail size={15} strokeWidth={2.5} aria-hidden="true" />}>
                  Get in touch
                </Button>
              </div>
            </CascadeItem>

            {/* Holds its resting height while the panel is docked away, so the
                hero above the visitor doesn't shrink under them. */}
            <CascadeItem index={6} className="lg:justify-self-end w-full lg:max-w-[560px]" style={docked ? { minHeight: CHAT_RESTING_HEIGHT } : undefined}>
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
                  "What's your stack?",
                  'What AI have you built?',
                  'What do colleagues say?',
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
                docked={docked}
              />
              )}
            </CascadeItem>
          </div>
        </CascadeGroup>
      </Container>

      {/* Dims the photo and wordmark (not the copy) as Work rises over the hero. */}
      <div aria-hidden="true" className="hero-exit-dim absolute inset-0 z-[19] bg-ink pointer-events-none" />

      {/* The opening wipe: a solid Luminous Blue field that lifts off the photo.
          Pure CSS, so it plays on the prerendered page before hydration; hidden
          entirely under reduced motion and with scripts off. */}
      <div aria-hidden="true" className="lu-flash absolute inset-0 z-40 bg-lum pointer-events-none" />
    </section>
  )
}
