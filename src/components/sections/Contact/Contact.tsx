import { lazy, Suspense } from 'react'
import { CascadeGroup, CascadeItem, ContactForm, Eyebrow, H2 } from '../../ui'
import { useParallax } from '../../../hooks'

const ParticlesSmall = lazy(() => import('../Hero/ParticlesSmall'))
const ParticlesLarge = lazy(() => import('../Hero/ParticlesLarge'))

export default function Contact() {
  const { sectionRef, bgRef, gradientRef, handleMouseMove, handleMouseLeave } = useParallax({
    bgStrength: 15,
    gradientStrength: 8,
    subjectStrength: 0,
    lerpFactor: 0.08,
  })

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
              <Eyebrow size="lg" className="text-white text-shadow-md pb-2 block">Say What's up</Eyebrow>
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
          <CascadeItem index={0}>
            <ContactForm />
          </CascadeItem>
        </CascadeGroup>

      </div>
    </section>
  )
}
