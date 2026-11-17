import { useState, useCallback, useEffect, useRef } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { CascadeGroup, CascadeItem, Button, RiseText } from '../../ui'
import { navLinks, homeLink, connectLinks, socialLinks } from '@/data'

/**
 * The logo easter egg's sound, constructed on first play rather than on import.
 *
 * This used to be a module-scope `new Audio(...)`, which runs the moment the
 * module loads — so every visit to every route eagerly downloaded it. The file
 * was also a 2.67s 24-bit/48kHz stereo WAV: 750KB, the largest single asset on
 * the page, larger than every image and larger than all the JavaScript
 * combined, for a joke that fires when you click a nav item that is already
 * active. It is now 64kbps mono AAC (16KB) and costs nothing until triggered.
 *
 * `??=` means the fetch happens on the first click only. At this size that is
 * imperceptible, and every later play is instant.
 */
let eAudio: HTMLAudioElement | null = null

function playE() {
  eAudio ??= Object.assign(new Audio('/audio/e.m4a'), { volume: 0.4 })
  eAudio.currentTime = 0
  // Autoplay policy rejects this if the click wasn't user-initiated; a silent
  // easter egg is never worth an unhandled rejection.
  void eAudio.play().catch(() => {})
}

/**
 * Auto-dismiss window for the "already active" nav tooltip easter egg.
 */
const TOOLTIP_DISMISS_MS = 3000

/** Scroll depth past which the menu button names the current section. */
const SOLID_AFTER = 150

const FOCUSABLE = 'a[href], button:not([disabled])'

interface HeaderProps {
  /**
   * Whether this is the home route. `App` passes it from the route it resolved,
   * because the prerender has no `window.location` to ask and the two must
   * agree anyway. Left out (Storybook), it falls back to the URL.
   */
  isHome?: boolean
}

/**
 * A small floating capsule, 24px in from the viewport's top left corner,
 * never full width and never hidden: the logo tile (back to top, plus the
 * icon-echo easter egg) and a menu button that names the section you're
 * scrolled into. A cyan reading-progress line runs along its bottom edge.
 *
 * Navigation lives in a sidebar at every width: the menu button slides a
 * Luminous Blue panel in from the left with everything the footer links to:
 * the sections, the other pages (Resume among them), and the social profiles.
 */
export default function Header({ isHome }: HeaderProps) {
  const [echoes, setEchoes] = useState<number[]>([])
  const [atTop, setAtTop] = useState(true)
  const [activeSection, setActiveSection] = useState('hero')
  const [menuOpen, setMenuOpen] = useState(false)
  const [tooltip, setTooltip] = useState<{ sectionId: string; text: string } | null>(null)
  const tooltipTimerRef = useRef<number | null>(null)
  const progressRef = useRef<HTMLSpanElement | null>(null)
  const toggleRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  // Mirrors `tooltip` so the scroll handler (registered once, outside React's
  // render cycle) can read the current value without going stale or having to
  // rebind the listener on every open/close.
  const tooltipStateRef = useRef<{ sectionId: string; text: string } | null>(null)
  const isHomePage = isHome ?? (typeof window !== 'undefined' && window.location.pathname === '/')
  // /resume and /privacy get a Home link ahead of the section anchors; on the
  // home page itself the logo already scrolls to top, so it would be dead weight.
  const sections = isHomePage ? navLinks : [homeLink, ...navLinks]
  // What the menu button says: the section you're in, or "Menu" at the top
  // of the page and on routes without sections.
  const sectionLabel = isHomePage && !atTop
    ? navLinks.find(l => l.href.endsWith(`#${activeSection}`))?.label ?? 'Menu'
    : 'Menu'

  const dismissTooltip = useCallback(() => {
    if (tooltipTimerRef.current !== null) {
      window.clearTimeout(tooltipTimerRef.current)
      tooltipTimerRef.current = null
    }
    tooltipStateRef.current = null
    setTooltip(null)
  }, [])

  // Re-clicking the same active item resets the timer without unmounting the
  // note, so rapid re-clicks stay steady instead of flickering off/on.
  const triggerTooltip = useCallback((sectionId: string, text: string) => {
    if (tooltipTimerRef.current !== null) window.clearTimeout(tooltipTimerRef.current)
    const next = { sectionId, text }
    tooltipStateRef.current = next
    setTooltip(next)
    tooltipTimerRef.current = window.setTimeout(() => {
      tooltipStateRef.current = null
      setTooltip(null)
    }, TOOLTIP_DISMISS_MS)
  }, [])

  useEffect(() => {
    const sectionIds = navLinks.filter(l => l.href.includes('#')).map(l => l.href.split('#')[1])

    const handleScroll = () => {
      const currentY = window.scrollY
      setAtTop(currentY < SOLID_AFTER)

      // Written straight to the element: this runs on every scroll frame and
      // nothing else renders from it.
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, currentY / max) : 0})`

      let active = sectionIds[0]
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 80) active = id
      }
      setActiveSection(active)

      if (tooltipStateRef.current && tooltipStateRef.current.sectionId !== active) dismissTooltip()
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [dismissTooltip])

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  // While the sidebar is open: the page behind it doesn't scroll, focus moves
  // into the panel and Tab stays there, and Escape closes it. On close, focus
  // goes back to the button that opened it.
  useEffect(() => {
    if (!menuOpen) return
    const root = document.documentElement
    const previousOverflow = root.style.overflow
    root.style.overflow = 'hidden'
    closeRef.current?.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenuOpen(false); return }
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey)
    const toggle = toggleRef.current
    const panel = panelRef.current
    return () => {
      window.removeEventListener('keydown', onKey)
      root.style.overflow = previousOverflow
      if (panel?.contains(document.activeElement)) toggle?.focus({ preventScroll: true })
    }
  }, [menuOpen])

  useEffect(() => () => {
    if (tooltipTimerRef.current !== null) window.clearTimeout(tooltipTimerRef.current)
  }, [])

  const handleLogo = useCallback(() => {
    playE()

    const id = Date.now()
    setEchoes(prev => [...prev, id])
    setTimeout(() => setEchoes(prev => prev.filter(e => e !== id)), 2000)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <>
      {/* A floating capsule, not a bar: the logo and the menu, pinned 24px
          from the viewport's corner, the same inset as the "Start a chat"
          launcher diagonally opposite (Chat.tsx, bottom-6 right-6). Always
          visible; at this size it covers little, and the menu stays one tap
          away. The cyan line along its bottom edge is reading progress. */}
      <header className="site-header fixed z-850 top-6 left-6">
        <CascadeGroup mountOnly>
          <div className="relative flex items-center gap-1 overflow-hidden rounded-2xl bg-ink p-1.5 ring-1 ring-inset ring-white/12 shadow-[0_14px_34px_-14px_rgba(5,10,40,0.7)]">
            <CascadeItem index={0}>
              <button
                type="button"
                onClick={handleLogo}
                aria-label="Eric Shell, back to top"
                className="group grid place-items-center text-white cursor-pointer"
              >
                <span className="relative grid place-items-center w-9 h-9 rounded-[10px] bg-lum transition-transform duration-500 ease-[cubic-bezier(0.3,1.45,0.5,1)] group-hover:-rotate-12 group-hover:scale-110">
                  {echoes.map(id => (
                    <img
                      key={id}
                      src="/icon.svg"
                      alt=""
                      aria-hidden
                      className="absolute w-4 pointer-events-none origin-center"
                      style={{ animation: 'icon-echo 2s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                    />
                  ))}
                  <img src="/icon.svg" alt="" aria-hidden className="w-4" />
                </span>
              </button>
            </CascadeItem>

            <CascadeItem index={1}>
              <button
                ref={toggleRef}
                type="button"
                aria-label={sectionLabel === 'Menu' ? 'Open menu' : `Open menu (you're in ${sectionLabel})`}
                aria-expanded={menuOpen}
                aria-controls="site-menu"
                onClick={() => setMenuOpen(o => !o)}
                className="group flex items-center gap-2.5 h-9 pl-2.5 pr-3.5 rounded-[10px] text-white cursor-pointer transition-colors hover:bg-white/10"
              >
                <Menu size={18} strokeWidth={2.5} aria-hidden="true" className="transition-transform duration-300 group-hover:scale-110" />
                {/* Keyed by label, so each change replays the rise. Fixed width
                    (the longest label, TESTIMONIALS) so the capsule doesn't
                    resize as you scroll between sections. */}
                <span className="relative block w-[7.75rem] h-4 overflow-hidden text-left">
                  <span
                    key={sectionLabel}
                    className="absolute inset-0 font-sans text-xs font-bold uppercase leading-4 tracking-[0.14em] motion-safe:animate-[lu-word_450ms_cubic-bezier(0.2,0.8,0.2,1)_backwards]"
                  >
                    {sectionLabel}
                  </span>
                </span>
              </button>
            </CascadeItem>

            <span
              ref={progressRef}
              aria-hidden="true"
              className="absolute left-0 right-0 bottom-0 h-0.5 bg-glow origin-left"
              style={{ transform: 'scaleX(0)' }}
            />
          </div>
        </CascadeGroup>
      </header>

      {/* A sibling of the header, not a child: the header's hide-on-scroll
          `translate` makes it the containing block for `fixed` descendants,
          which would size this to the header's 64px. */}
      <div
        aria-hidden="true"
        onClick={closeMenu}
        className={`fixed inset-0 z-[940] bg-ink/60 transition-opacity duration-300 motion-reduce:transition-none ${
          menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <div
        id="site-menu"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!menuOpen}
        // `aria-hidden` alone only hides it from the accessibility tree; `inert`
        // also takes the links out of the tab order and find-in-page while closed.
        inert={!menuOpen}
        className={`fixed inset-y-0 left-0 z-[950] w-[min(440px,100vw)] overflow-y-auto bg-lum text-white flex flex-col transition-transform duration-[450ms] ease-[cubic-bezier(0.7,0,0.2,1)] motion-reduce:transition-none ${
          menuOpen ? 'translate-x-0 shadow-[30px_0_80px_-30px_rgba(5,10,60,0.6)]' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 pt-5 pb-2">
          <Button
            ref={closeRef}
            variant="glass-dark"
            shape="square"
            size="sm"
            aria-label="Close menu"
            onClick={closeMenu}
            className="rounded-[10px] w-9 h-9"
          >
            <X size={18} strokeWidth={2.5} />
          </Button>
          <span className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-glow">Menu</span>
        </div>

        <nav aria-label="Site" className="flex flex-col gap-10 px-6 pt-6 pb-10">
          <div>
            <p className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.16em] text-glow">Sections</p>
            <ul className="flex flex-col">
              {sections.map(({ label, href, tooltip: note }, i) => {
                const sectionId = href.split('#')[1]
                const isActive = isHomePage && !!sectionId && activeSection === sectionId
                return (
                  <li key={label}>
                    <a
                      href={href}
                      aria-current={isActive ? 'location' : undefined}
                      onClick={(e) => {
                        // The easter egg: the section you're already in answers back.
                        if (isActive && note) { e.preventDefault(); triggerTooltip(sectionId as string, note); return }
                        closeMenu()
                      }}
                      className={`group flex items-baseline gap-4 py-1 transition-colors ${isActive ? 'text-white' : 'text-white/80 hover:text-white'}`}
                    >
                      <span aria-hidden="true" className="w-5 font-mono text-xs text-glow">{String(i + 1).padStart(2, '0')}</span>
                      <RiseText
                        text={label}
                        inView={menuOpen}
                        delayMs={120 + i * 60}
                        stagger={28}
                        // 44px max: TESTIMONIALS (7.6em) plus the index column has to fit the
                        // 440px panel with its 24px gutters.
                        className="font-display font-bold uppercase tracking-display text-[clamp(32px,9vw,44px)] leading-[1]"
                      />
                      {isActive && (
                        <span aria-hidden="true" className="self-center w-2 h-2 rounded-full bg-glow shadow-[0_0_12px_2px_rgba(143,232,255,0.7)]" />
                      )}
                    </a>
                    {isActive && note && (
                      <p
                        role="status"
                        aria-live="polite"
                        className={`ml-9 font-sans text-sm text-glow transition-opacity duration-200 ${tooltip?.sectionId === sectionId ? 'opacity-100' : 'opacity-0'}`}
                      >
                        {tooltip?.sectionId === sectionId ? tooltip.text : ''}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <p className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.16em] text-glow">More</p>
            <ul className="flex flex-col gap-1">
              {connectLinks.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    onClick={closeMenu}
                    className="group inline-flex items-center gap-2 font-display font-bold uppercase tracking-display text-2xl leading-[1.15] text-white/80 hover:text-white transition-colors"
                  >
                    {label}
                    <ArrowUpRight
                      size={18}
                      strokeWidth={2.75}
                      aria-hidden="true"
                      className="text-glow opacity-0 -translate-x-2 transition-[opacity,translate] duration-300 ease-[cubic-bezier(0.3,1.45,0.5,1)] group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="mt-auto flex flex-col gap-4 px-6 pb-8">
          <div className="flex gap-2.5">
            {socialLinks.map(({ label, href, path }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-11 h-11 rounded-full border border-white/35 flex items-center justify-center text-white hover:bg-white hover:text-lum hover:border-white hover:-translate-y-1 transition-[color,background-color,border-color,translate] duration-300 ease-[cubic-bezier(0.3,1.45,0.5,1)]"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path d={path} />
                </svg>
              </a>
            ))}
          </div>
          <p className="font-sans text-sm text-white/75">AI Design Systems Engineer</p>
        </div>
      </div>
    </>
  )
}
