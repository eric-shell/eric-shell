import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from 'lucide-react'
import { testimonials } from '@/data'
import { Backdrop, Button, CascadeGroup, CascadeItem, Container, SectionHeader } from '../../ui'
import { useCarousel } from '@/hooks'

export default function Testimonials() {
  const { index, visible, isPlaying, next, prev, togglePlaying } = useCarousel({
    length: testimonials.length,
    intervalMs: 6000,
    fadeMs: 250,
  })

  const { review, author } = testimonials[index]

  return (
    <section id="testimonials" className="relative bg-gradient-to-br from-blue-950 to-blue-900 text-white skew-section">
      <Backdrop tone="dark" />
      <Container className="unskew-inner">

        <CascadeGroup className="flex items-start justify-between gap-4 pb-10">
          <CascadeItem index={0}>
            <SectionHeader
              eyebrow="Feedback from the Team"
              title="Testimonials"
              eyebrowClassName="text-blue-50"
            />
          </CascadeItem>
          <CascadeItem index={1} className="hidden md:block">
            <Button
              href="https://www.linkedin.com/in/ericshell/details/recommendations/"
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="md"
              className="shrink-0"
              rightIcon={<ArrowUpRight size={15} strokeWidth={2.5} aria-hidden="true" />}
            >
              View Full Endorsements
            </Button>
          </CascadeItem>
        </CascadeGroup>

        <CascadeGroup className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">

          {/* Left: context copy */}
          <CascadeItem index={0} className="flex flex-col gap-5 font-sans text-base leading-relaxed text-white">
            <p>
              Every piece of feedback comes directly from the team leads, product managers, designers, producers and department heads who worked directly with me. Each statement was written and submitted independently on Linkedin, reflecting firsthand experience on massive projects with challenging deadlines and complex deliverables.
            </p>
            <p>
              These team members include internal and external members from household QSR brands, federal agencies, regional DMOs, financial institutions, entertainment enterprises and more. Each project's context demanded a different kind of technical and interpersonal leadership. These excerpts are from the people who witnessed it directly.
            </p>
            <p>
              I take deep pride in every project that I put my name on, and I hold myself accountable to the people depending on me to get it right. These statements reflect that standard as seen from the outside and how I intend to contribute as a member of any future team.
            </p>
            <Button
              href="https://www.linkedin.com/in/ericshell/details/recommendations/"
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="md"
              className="md:hidden self-start"
              rightIcon={<ArrowUpRight size={15} strokeWidth={2.5} aria-hidden="true" />}
            >
              View Full Endorsements
            </Button>
          </CascadeItem>

          {/* Right: carousel */}
          <CascadeItem index={1}>
            <div aria-live="polite" aria-atomic="true" className="min-h-56">
              <blockquote
                className={`transition-opacity duration-[400ms] ${visible ? 'opacity-100' : 'opacity-0'}`}
              >
                <p className="font-sans text-xl leading-relaxed text-white">
                  "{review}"
                </p>
                <footer className="mt-6 font-sans text-sm font-semibold text-blue-100 uppercase tracking-wider">
                  {author}
                </footer>
              </blockquote>
            </div>

            <div
              className="flex items-center gap-2 mt-10"
              role="region"
              aria-label="Testimonial Controls"
            >
              <Button
                shape="square"
                variant="secondary"
                onClick={prev}
                aria-label="Previous testimonial"
              >
                <ArrowLeft size={18} strokeWidth={2.5} aria-hidden="true" />
              </Button>
              <Button
                shape="square"
                variant="secondary"
                onClick={togglePlaying}
                aria-label={isPlaying ? 'Pause testimonial slider' : 'Play testimonial slider'}
              >
                {isPlaying ? <Pause size={18} strokeWidth={2.5} aria-hidden="true" /> : <Play size={18} strokeWidth={2.5} aria-hidden="true" />}
              </Button>
              <Button
                shape="square"
                variant="secondary"
                onClick={next}
                aria-label="Next testimonial"
              >
                <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
              </Button>
            </div>
          </CascadeItem>

        </CascadeGroup>
      </Container>
    </section>
  )
}
