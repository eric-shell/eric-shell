import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { instagramPosts, type InstagramPost } from '@/data'
import { lqip } from '@/data/lqip'
import { useHydrated } from '@/lib/hydration'
import { Button, CascadeGroup, CascadeItem, Container, SectionTitle, descDelay } from '../../ui'

function InstagramIcon({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

/** How long the open slice stays open before the accordion moves on, in ms. */
const SLICE_MS = 4500
/** Scroll progress through the pinned section by which the zoom has fully resolved into the accordion. */
const ZOOM_END = 0.62
/** Progress past which the accordion takes over (autoplay, hover, captions) and the header plays in. */
const RESOLVED_AT = 0.66
const HEAD_AT = 0.5

const ease = (x: number) => 1 - Math.pow(1 - x, 3)
const clamp = (v: number) => Math.max(0, Math.min(1, v))
/** "MK1 Volkswagen GTI photo by Eric Shell" → "MK1 Volkswagen GTI". */
const shortTitle = (post: InstagramPost) => post.altText.replace(/ photo by Eric Shell$/, '')

/** A post's responsive sources, the same ladder the Post tile uses. */
function PostPicture({ post, sizes, eager, className }: { post: InstagramPost; sizes: string; eager?: boolean; className?: string }) {
  const dot = post.imageUrl.lastIndexOf('.')
  const base = post.imageUrl.slice(0, dot)
  const ext = post.imageUrl.slice(dot + 1)
  const set = (type: string) => `${base}-320.${type} 320w, ${base}-640.${type} 640w, ${base}-960.${type} 960w`
  return (
    <picture>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
      <img
        src={`${base}-640.${ext}`}
        srcSet={set(ext)}
        sizes={sizes}
        alt={post.altText}
        loading={eager ? undefined : 'lazy'}
        decoding="async"
        className={className}
        style={lqip[post.imageUrl] ? { backgroundImage: `url(${lqip[post.imageUrl]})`, backgroundSize: 'cover' } : undefined}
      />
    </picture>
  )
}

/**
 * Six tall slices in a Luminous Blue duotone; the open one is in full colour
 * with its caption and a link to the post. The row moves on by itself (the open
 * slice's progress bar drives it, so hover pausing the bar pauses the row, and
 * reduced motion stops it), and hover, focus or a tap opens any slice.
 *
 * On wide screens with motion allowed the section is pinned and opens with a
 * zoom: the first photo fills the screen under a giant VISUALS, then shrinks
 * into the accordion's open slice while the other five slide in from the edges.
 * The accordion is held on its first slice (no autoplay, hover or captions)
 * until the zoom resolves, and the header plays its entrance only then.
 */
export default function Visuals() {
  const hydrated = useHydrated()
  const [pinned, setPinned] = useState(false)
  const [active, setActive] = useState(0)
  // Only meaningful while pinned; unpinned, the accordion is always live and the header always shown.
  const [zoomResolved, setResolved] = useState(false)
  const [zoomHeadShown, setHeadShown] = useState(false)
  const sectionRef = useRef<HTMLElement | null>(null)
  const pinRef = useRef<HTMLDivElement | null>(null)
  const coverRef = useRef<HTMLDivElement | null>(null)
  const sliceRefs = useRef<(HTMLDivElement | null)[]>([])

  const resolved = !pinned || zoomResolved
  const headShown = !pinned || zoomHeadShown
  const held = !resolved
  const open = useCallback((i: number) => { if (!held) setActive((i + instagramPosts.length) % instagramPosts.length) }, [held])

  // Pinning depends on the viewport and the motion preference, both browser
  // facts, so it is decided after hydration; the prerender is the plain accordion.
  useEffect(() => {
    if (!hydrated) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const decide = () => setPinned(!mq.matches && window.innerWidth >= 1024)
    decide()
    window.addEventListener('resize', decide)
    mq.addEventListener('change', decide)
    return () => {
      window.removeEventListener('resize', decide)
      mq.removeEventListener('change', decide)
    }
  }, [hydrated])

  // The zoom: one scroll-driven pass over the slices' measured resting layout.
  useEffect(() => {
    const section = sectionRef.current
    const pin = pinRef.current
    const cover = coverRef.current
    const slices = sliceRefs.current.filter((s): s is HTMLDivElement => !!s)
    if (!pinned || !section || !pin || !cover || slices.length === 0) return

    type Geo = { W: number; H: number; items: { el: HTMLDivElement; cx: number; cy: number; w: number; h: number }[] }
    let geo: Geo | null = null
    let raf = 0

    const reset = () => slices.forEach(el => { el.style.transform = ''; el.style.opacity = '' })
    const measure = () => {
      reset()
      const pr = pin.getBoundingClientRect()
      geo = {
        W: pr.width,
        H: pr.height,
        items: slices.map(el => {
          const r = el.getBoundingClientRect()
          return { el, cx: r.left - pr.left + r.width / 2, cy: r.top - pr.top + r.height / 2, w: r.width, h: r.height }
        }),
      }
    }
    const apply = () => {
      raf = 0
      if (!geo) return
      const r = section.getBoundingClientRect()
      const p = clamp(-r.top / Math.max(1, r.height - window.innerHeight))
      const e = ease(clamp(p / ZOOM_END))
      geo.items.forEach((g, i) => {
        const button = g.el.firstElementChild as HTMLElement | null
        if (i === 0) {
          const s0 = Math.max(geo!.W / g.w, geo!.H / g.h) * 1.02
          const s = s0 + (1 - s0) * e
          g.el.style.transform = `translate3d(${((geo!.W / 2 - g.cx) * (1 - e)).toFixed(1)}px,${((geo!.H / 2 - g.cy) * (1 - e)).toFixed(1)}px,0) scale(${s.toFixed(4)})`
          if (button) button.style.borderRadius = `${(24 * e / s).toFixed(2)}px`
        } else {
          const dx = g.cx - geo!.W / 2
          const dy = g.cy - geo!.H / 2
          const k = (1 - e) * 1.1
          g.el.style.transform = `translate3d(${(dx * k).toFixed(1)}px,${(dy * k).toFixed(1)}px,0) scale(${(0.7 + 0.3 * e).toFixed(3)}) rotate(${((1 - e) * (dx > 0 ? 8 : -8)).toFixed(2)}deg)`
          g.el.style.opacity = clamp(e * 1.4).toFixed(3)
        }
      })
      const c = clamp(p / 0.3)
      cover.style.opacity = (1 - c).toFixed(3)
      cover.style.transform = `scale(${(1 + c * 0.35).toFixed(3)})`
      setHeadShown(p > HEAD_AT)
      setResolved(p > RESOLVED_AT)
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(apply) }
    const remeasure = () => { measure(); kick() }

    remeasure()
    window.addEventListener('scroll', kick, { passive: true })
    window.addEventListener('resize', remeasure)
    document.fonts?.ready.then(remeasure)
    return () => {
      window.removeEventListener('scroll', kick)
      window.removeEventListener('resize', remeasure)
      if (raf) cancelAnimationFrame(raf)
      reset()
      slices.forEach(el => { const b = el.firstElementChild as HTMLElement | null; if (b) b.style.borderRadius = '' })
    }
  }, [pinned])

  // While the zoom is still playing, the open slice is the first one.
  const shownIndex = held ? 0 : active

  return (
    <section
      id="visuals"
      ref={sectionRef}
      className={`relative bg-ink text-white ${pinned ? 'h-[260vh]' : 'py-24 md:py-36'}`}
    >
      <div
        ref={pinRef}
        className={pinned ? 'sticky top-0 h-screen overflow-hidden flex flex-col justify-center gap-8 pt-24 pb-8' : ''}
      >
        <Container className="w-full">
          {/* Remounted when it is revealed, so its entrance plays once the zoom
              has resolved rather than unseen behind the full-screen photo. */}
          <div style={{ visibility: headShown ? 'visible' : 'hidden' }}>
            <SectionTitle
              key={headShown ? 'shown' : 'held'}
              eyebrow="Creative Supplements"
              title="Visuals"
              eyebrowClassName="text-glow"
              action={
                <Button
                  href="https://www.instagram.com/ericshell/"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="luminous"
                  leftIcon={<InstagramIcon size={15} />}
                >
                  Follow on Instagram
                </Button>
              }
            >
              <CascadeItem delayMs={descDelay(1)}>
                <p className="pt-6 font-sans text-base leading-relaxed text-white/85 max-w-3xl">
                  I studied Design at Lehigh University before my career turned to code, and I still shoot photo and video, mostly cars, bikes and the people I share them with. It keeps my eye sharp for the visual side of everything I build.
                </p>
              </CascadeItem>
            </SectionTitle>
          </div>
        </Container>

        <Container className={`w-full ${pinned ? '' : 'pt-12'}`}>
          <CascadeGroup
            as="ul"
            threshold={0.1}
            aria-label="Photos"
            className={`group/acc flex flex-col md:flex-row gap-2.5 ${pinned ? 'md:h-[clamp(260px,calc(100vh-490px),520px)]' : 'md:h-[clamp(420px,46vw,600px)]'}`}
          >
            {instagramPosts.map((post, i) => {
              const on = i === shownIndex
              const number = String(i + 1).padStart(2, '0')
              return (
                <li
                  key={post.id}
                  className={`relative min-w-0 ${i === 0 ? 'z-[3]' : ''} ${
                    on ? 'h-[400px] md:h-auto md:grow-[5.5]' : 'h-[76px] md:h-auto md:grow'
                  } md:basis-0 transition-[flex-grow,height] duration-[850ms] ease-[cubic-bezier(0.6,0,0.2,1)] motion-reduce:transition-none`}
                >
                  <CascadeItem index={i} className="h-full">
                    {/* The zoom's target. Separate from the CascadeItem, whose
                        entrance transition would otherwise smooth every
                        scroll-driven frame into a lag. */}
                    <div ref={el => { sliceRefs.current[i] = el }} className="relative h-full">
                      <button
                        type="button"
                        aria-pressed={on}
                        aria-label={`Show ${shortTitle(post)}`}
                        onClick={() => open(i)}
                        onFocus={() => open(i)}
                        onPointerEnter={(e) => { if (e.pointerType === 'mouse') open(i) }}
                        className="relative isolate block w-full h-full rounded-3xl overflow-hidden bg-blue-900 cursor-pointer"
                      >
                        <PostPicture
                          post={post}
                          eager={i === 0}
                          sizes={i === 0 ? '100vw' : '(max-width: 767px) 100vw, 40vw'}
                          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[1300ms] ease-out ${on ? 'scale-100' : 'scale-[1.14]'}`}
                        />
                        <span
                          aria-hidden="true"
                          className={`absolute inset-0 z-[1] bg-lum mix-blend-color transition-opacity duration-700 ${on ? 'opacity-0' : 'opacity-90'}`}
                        />
                        <span
                          aria-hidden="true"
                          className={`absolute z-[2] font-display font-bold text-2xl tracking-display text-white transition-opacity duration-300 left-5 top-1/2 -translate-y-1/2 md:left-1/2 md:top-auto md:bottom-5 md:-translate-x-1/2 md:translate-y-0 ${on ? 'opacity-0' : 'opacity-100'}`}
                        >
                          {number}
                        </span>
                        {on && !held && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-0 bottom-0 z-[3] h-1 bg-glow origin-left motion-reduce:hidden group-hover/acc:[animation-play-state:paused] group-focus-within/acc:[animation-play-state:paused]"
                            style={{ animation: `lu-progress ${SLICE_MS}ms linear forwards` }}
                            onAnimationEnd={() => open(i + 1)}
                          />
                        )}
                      </button>
                      <div
                        className={`absolute left-4 right-4 bottom-4 z-[4] flex items-end justify-between gap-3 rounded-2xl bg-ink/80 px-4 py-3.5 transition-[opacity,translate] duration-500 ${
                          on && !held ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 translate-y-4 pointer-events-none'
                        }`}
                        aria-hidden={!on || held}
                        inert={!on || held}
                      >
                        <span className="min-w-0">
                          <span className="block font-mono text-[11px] tracking-[0.1em] text-glow">{number} / {String(instagramPosts.length).padStart(2, '0')}</span>
                          <span className="block font-sans font-semibold truncate">{shortTitle(post)}</span>
                        </span>
                        <Button
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="white"
                          size="sm"
                          className="shrink-0 border-0"
                          rightIcon={<ArrowUpRight size={15} strokeWidth={2.5} aria-hidden="true" />}
                        >
                          View post
                        </Button>
                      </div>
                    </div>
                  </CascadeItem>
                </li>
              )
            })}
          </CascadeGroup>
        </Container>

        {pinned && (
          <div ref={coverRef} aria-hidden="true" className="absolute inset-0 z-[5] grid place-items-center pointer-events-none">
            <span className="font-display font-bold uppercase tracking-display leading-[0.8] text-white text-[min(calc((100vw-48px)/4.7),300px)] [text-shadow:0_12px_60px_rgba(5,10,40,0.5)]">
              Visuals
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
