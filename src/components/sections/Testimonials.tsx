import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react'
import { testimonials } from '../../data/testimonials'

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
        <div className="flex items-start justify-between gap-4 mb-12">
          <div>
            <p
              className="font-sans font-bold uppercase tracking-wider text-sm text-white mb-4"
              style={{ fontVariationSettings: "'GRAD' 150" }}
            >
              Feedback from the Team
            </p>
            <h2 className="font-display text-6xl font-bold uppercase">
              Testimonials
            </h2>
          </div>
          <a
            href="https://www.linkedin.com/in/ericshell/details/recommendations/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-5 py-2.5 rounded-lg bg-white text-off-black font-sans font-semibold text-sm hover:bg-off-white transition"
          >
            View Full Endorsements
          </a>
        </div>

        <div aria-live="polite" aria-atomic="true" className="min-h-56">
          <blockquote
            className={`transition-opacity duration-[250ms] ${visible ? 'opacity-100' : 'opacity-0'}`}
          >
            <span aria-hidden="true" className="font-display text-5xl text-cyan leading-none block mb-2">&ldquo;</span>
            <p className="font-sans text-lg leading-relaxed text-white/90">
              {review}
            </p>
            <footer className="mt-6 font-sans text-sm font-semibold text-white/50 uppercase tracking-wider">
              {author}
            </footer>
          </blockquote>
        </div>

        <div
          className="flex items-center gap-2 mt-10"
          role="region"
          aria-label="Testimonial Controls"
        >
          <button
            onClick={prev}
            aria-label="Previous testimonial"
            className="p-2.5 rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/50 transition cursor-pointer"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <button
            onClick={() => setIsPlaying(p => !p)}
            aria-label={isPlaying ? 'Pause testimonial slider' : 'Play testimonial slider'}
            className="p-2.5 rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/50 transition cursor-pointer"
          >
            {isPlaying
              ? <Pause size={18} aria-hidden="true" />
              : <Play size={18} aria-hidden="true" />
            }
          </button>
          <button
            onClick={next}
            aria-label="Next testimonial"
            className="p-2.5 rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/50 transition cursor-pointer"
          >
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
