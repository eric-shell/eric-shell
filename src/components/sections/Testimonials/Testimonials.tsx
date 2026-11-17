import { useState, type CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from 'lucide-react'
import { testimonials } from '@/data'
import { Button, CascadeGroup, CascadeItem, Container, Section, SectionTitle, descDelay } from '../../ui'
import { useCarousel } from '@/hooks'

const INTERVAL_MS = 7000

/**
 * A review as words that rise in one after another, with its highlight phrase
 * wrapped in a <mark> the highlighter sweeps across once the words have landed.
 * Remounted per quote (keyed by index), so every change replays the entrance.
 */
function Quote({ review, highlight }: { review: string; highlight?: string }) {
  const at = highlight ? review.indexOf(highlight) : -1
  const parts: [string, boolean][] = at < 0
    ? [[review, false]]
    : [[review.slice(0, at), false], [highlight!, true], [review.slice(at + highlight!.length), false]]
  let n = 0
  const words = (text: string) => text.split(/(\s+)/).map((w, i) => (
    !w || /^\s+$/.test(w)
      ? w
      : <span key={i} className="inline-block motion-safe:animate-[lu-word_700ms_var(--ease-settle)_backwards]" style={{ animationDelay: `${n++ * 16}ms` }}>{w}</span>
  ))
  return (
    <>
      {parts.map(([text, hl], i) => hl
        ? (
          <mark
            key={i}
            className="text-inherit bg-transparent bg-linear-to-r from-lum/25 to-lum/25 bg-no-repeat [background-position:0_90%] [background-size:100%_42%] [box-decoration-break:clone] motion-safe:animate-[lu-mark_1s_var(--ease-settle)_550ms_backwards]"
          >
            {words(text)}
          </mark>
        )
        : <span key={i}>{words(text)}</span>)}
    </>
  )
}

export default function Testimonials() {
  const { index, visible, isPlaying, next, prev, togglePlaying } = useCarousel({
    length: testimonials.length,
    intervalMs: INTERVAL_MS,
    fadeMs: 250,
  })
  // Bumped whenever the carousel's interval restarts (resume, or a manual
  // step), so the active segment's fill restarts in step with it.
  const [cycle, setCycle] = useState(0)
  const step = (fn: () => void) => () => { fn(); setCycle(c => c + 1) }

  const { review, author, highlight } = testimonials[index]
  const [name, role] = author.split(' — ')

  return (
    <Section id="testimonials" tone="white">
      <Container>
        <SectionTitle eyebrow="Feedback from the Team" title="Testimonials" eyebrowClassName="text-lum-deep" />

        <CascadeGroup className="grid-split gap-12 lg:gap-20 pt-12">
          <CascadeItem delayMs={descDelay(0)} className="flex flex-col gap-5 font-sans text-base leading-relaxed text-ink-soft">
            <p>
              Written independently on LinkedIn by the team leads, product managers, designers and producers who worked alongside me, from QSR brands and federal agencies to banks and entertainment companies. This is how the people who depended on me describe the work.
            </p>

            <div className="flex items-center gap-2 pt-3" role="region" aria-label="Testimonial Controls">
              <Button shape="square" variant="outline" onClick={step(prev)} aria-label="Previous testimonial" className="rounded-full">
                <ArrowLeft size={18} strokeWidth={2.5} aria-hidden="true" />
              </Button>
              <Button
                shape="square"
                variant="outline"
                onClick={step(togglePlaying)}
                aria-label={isPlaying ? 'Pause testimonial slider' : 'Play testimonial slider'}
                className="rounded-full"
              >
                {isPlaying ? <Pause size={18} strokeWidth={2.5} aria-hidden="true" /> : <Play size={18} strokeWidth={2.5} aria-hidden="true" />}
              </Button>
              <Button shape="square" variant="outline" onClick={step(next)} aria-label="Next testimonial" className="rounded-full">
                <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
              </Button>
            </div>

            {/* One segment per review: past ones full, the current one filling
                over the interval (paused with the carousel), future ones empty. */}
            <div aria-hidden="true" className="flex gap-1.5 max-w-xs">
              {testimonials.map((t, i) => (
                <span key={t.author} className="flex-1 h-1 rounded-full bg-ice overflow-hidden">
                  <span
                    key={i === index ? `${index}-${cycle}` : undefined}
                    className="block h-full bg-lum origin-left"
                    style={{
                      transform: i < index ? 'none' : 'scaleX(0)',
                      ...(i === index
                        ? { animation: `lu-progress ${INTERVAL_MS + 250}ms linear forwards`, animationPlayState: isPlaying ? 'running' : 'paused' }
                        : {}),
                    } as CSSProperties}
                  />
                </span>
              ))}
            </div>

            <div>
              <Button
                href="https://www.linkedin.com/in/ericshell/details/recommendations/"
                target="_blank"
                rel="noopener noreferrer"
                variant="luminous"
                rightIcon={<ArrowUpRight size={15} strokeWidth={2.5} aria-hidden="true" />}
              >
                View Full Endorsements
              </Button>
            </div>
          </CascadeItem>

          <CascadeItem delayMs={descDelay(1)}>
            <div aria-live="polite" aria-atomic="true" className="min-h-[22rem]">
              <blockquote className={`transition-opacity duration-[250ms] ${visible ? 'opacity-100' : 'opacity-0'}`}>
                <p key={index} className="font-sans text-[clamp(20px,2.2vw,30px)] leading-[1.35] font-medium tracking-[-0.01em] text-pretty">
                  <Quote review={review} highlight={highlight} />
                </p>
                <footer className="flex items-center gap-3.5 mt-8 font-sans">
                  <span aria-hidden="true" className="grid place-items-center w-12 h-12 rounded-full bg-lum text-white font-display font-bold text-xl">
                    {name[0]}
                  </span>
                  <span>
                    <span className="block font-semibold text-ink">{name}</span>
                    <span className="block text-sm text-ink-soft">{role}</span>
                  </span>
                </footer>
              </blockquote>
            </div>
          </CascadeItem>
        </CascadeGroup>
      </Container>
    </Section>
  )
}
