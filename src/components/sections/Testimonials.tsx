import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react'
import { testimonials } from '../../data/testimonials'
import { Button, Eyebrow, H2 } from '../ui'

const INTERVAL_MS = 6000
const FADE_MS = 250

export default function Testimonials() {
  const [current, setCurrent] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [visible, setVisible] = useState(true)
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentRef = useRef(current)

  useEffect(() => { currentRef.current = current }, [current])

  const goTo = useCallback((index: number) => {
    if (fadeTimer.current) clearTimeout(fadeTimer.current)
    setVisible(false)
    fadeTimer.current = setTimeout(() => {
      setCurrent(index)
      setVisible(true)
    }, FADE_MS)
  }, [])

  const prev = useCallback(() => {
    goTo((currentRef.current - 1 + testimonials.length) % testimonials.length)
  }, [goTo])

  const next = useCallback(() => {
    goTo((currentRef.current + 1) % testimonials.length)
  }, [goTo])

  useEffect(() => {
    if (!isPlaying) return
    const id = setInterval(() => {
      goTo((currentRef.current + 1) % testimonials.length)
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [isPlaying, goTo])

  useEffect(() => {
    return () => { if (fadeTimer.current) clearTimeout(fadeTimer.current) }
  }, [])

  const { review, author } = testimonials[current]

  return (
    <section className="bg-off-black text-white py-24">
      <div className="max-w-[1440px] mx-auto px-6">

        <div className="flex items-start justify-between gap-4 pb-10">
          <div>
            <Eyebrow className="text-white mb-4 block">Feedback from the Team</Eyebrow>
            <H2 className="italic">Testimonials</H2>
          </div>
          <Button
            href="https://www.linkedin.com/in/ericshell/details/recommendations/"
            target="_blank"
            rel="noopener noreferrer"
            size="md"
            className="shrink-0 bg-white text-off-black"
          >
            View Full Endorsements
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">

          {/* Left: context copy */}
          <div className="flex flex-col gap-5 font-sans text-base leading-relaxed text-white">
            <p>
              Every piece of feedback comes directly from the architects, product managers, designers, and producers who worked alongside me. Each statement was written and submitted independently on Linkedin, reflecting firsthand experience on massive projects with real deadlines.
            </p>
            <p>
              These team members span internal and external members from QSR brands, federal agencies, financial institutions, and entertainment platforms and more. Each context demanded a different kind of technical and interpersonal leadership, and these are the people who witnessed it directly.
            </p>
            <p>
              I take deep pride in every deliverable I put my name on, and I hold myself accountable to the people depending on me to get it right. These statements reflect that standard as seen from the outside and how I intend to contribute as a member of any future team.
            </p>
          </div>

          {/* Right: carousel */}
          <div>
            <div aria-live="polite" aria-atomic="true" className="min-h-56">
              <blockquote
                className={`transition-opacity duration-[400ms] ${visible ? 'opacity-100' : 'opacity-0'}`}
              >
                <span aria-hidden="true" className="font-display text-5xl text-cyan leading-none block mb-2">&ldquo;</span>
                <p className="font-sans text-xl leading-relaxed text-white">
                  {review}
                </p>
                <footer className="mt-6 font-sans text-sm font-semibold text-white/70 uppercase tracking-wider">
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
                size="icon"
                variant="outline"
                onClick={prev}
                aria-label="Previous testimonial"
                className="border-white/20 text-white/70 hover:text-white hover:border-white/50"
              >
                <ArrowLeft size={18} aria-hidden="true" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setIsPlaying(p => !p)}
                aria-label={isPlaying ? 'Pause testimonial slider' : 'Play testimonial slider'}
                className="border-white/20 text-white/70 hover:text-white hover:border-white/50"
              >
                {isPlaying ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={next}
                aria-label="Next testimonial"
                className="border-white/20 text-white/70 hover:text-white hover:border-white/50"
              >
                <ArrowRight size={18} aria-hidden="true" />
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
