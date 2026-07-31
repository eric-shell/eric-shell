import { useState, useCallback, useEffect, useRef } from 'react'
import { Menu, X } from 'lucide-react'
import { CascadeGroup, CascadeItem, Button, Container, Panel } from '../../ui'
import { navLinks, homeLink } from '@/data'

const eAudio = new Audio('/audio/Eeeeeee.wav')
eAudio.volume = .4

/**
 * Auto-dismiss window for the "already active" nav tooltip easter egg.
 */
const TOOLTIP_DISMISS_MS = 3000

/**
 * Fun, decorative aside shown below a nav item the visitor just clicked while
 * it was already the active section. Desktop nav only — see the note above
 * the desktop `<nav>` render below for why. `role="status"` + `aria-live`
 * rather than a tooltip role since it isn't describing the control, just
 * announcing itself. Fades/slides via `motion-safe:` only, so it appears
 * instantly with no transform under `prefers-reduced-motion`.
 */
function NavTooltip({ text, show, align }: { text: string; show: boolean; align: 'center' | 'end' }) {
  return (
    <div
      className={`absolute top-full z-20 mt-2 pointer-events-none motion-safe:transition motion-safe:duration-200 motion-safe:ease-out ${
        align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0'
      } ${
        show ? 'opacity-100 motion-safe:translate-y-0' : 'opacity-0 motion-safe:-translate-y-1'
      }`}
    >
      <div className="relative">
        <span
          aria-hidden="true"
          className={`absolute -top-1 h-2 w-2 rotate-45 bg-white ${align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-4'}`}
        />
        <Panel
          variant="secondary"
          role="status"
          aria-live="polite"
          className="relative rounded-lg px-3 py-1.5 shadow-lg font-sans text-xs font-medium whitespace-nowrap"
        >
          {show ? text : ''}
        </Panel>
      </div>
    </div>
  )
}

export default function Header() {
  const [echoes, setEchoes] = useState<number[]>([])
  const [hidden, setHidden] = useState(false)
  const [atTop, setAtTop] = useState(true)
  const [activeSection, setActiveSection] = useState('hero')
  const [menuOpen, setMenuOpen] = useState(false)
  const [tooltip, setTooltip] = useState<{ sectionId: string; text: string } | null>(null)
  const lastScrollY = useRef(0)
  const tooltipTimerRef = useRef<number | null>(null)
  const tooltipAnchorRef = useRef<HTMLDivElement | null>(null)
  // Mirrors `tooltip` so the scroll handler (registered once, outside React's
  // render cycle) can read the current value without going stale or having to
  // rebind the listener on every open/close.
  const tooltipStateRef = useRef<{ sectionId: string; text: string } | null>(null)
  const isHomePage = window.location.pathname === '/'
  // /resume and /privacy get a Home link ahead of the section anchors; on the
  // home page itself the logo already scrolls to top, so it would be dead weight.
  const links = isHomePage ? navLinks : [homeLink, ...navLinks]

  const dismissTooltip = useCallback(() => {
    if (tooltipTimerRef.current !== null) {
      window.clearTimeout(tooltipTimerRef.current)
      tooltipTimerRef.current = null
    }
    tooltipStateRef.current = null
    setTooltip(null)
  }, [])

  // Re-clicking the same active item resets the timer without unmounting the
  // tooltip, so rapid re-clicks stay steady instead of flickering off/on.
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
      setAtTop(currentY < 150)
      setHidden(currentY > lastScrollY.current && currentY > 80)
      lastScrollY.current = currentY

      let active = sectionIds[0]
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 80) active = id
      }
      setActiveSection(active)

      // Scrolling to a different section counts as "navigating away" — drop
      // the tooltip rather than let it linger over content it no longer refers to.
      if (tooltipStateRef.current && tooltipStateRef.current.sectionId !== active) dismissTooltip()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [dismissTooltip])

  useEffect(() => {
    if (!menuOpen) return
    const close = () => setMenuOpen(false)
    window.addEventListener('scroll', close, { passive: true, once: true })
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  // Dismiss the tooltip on outside click / Escape while it's showing.
  useEffect(() => {
    if (!tooltip) return
    const onPointerDown = (e: PointerEvent) => {
      if (tooltipAnchorRef.current && !tooltipAnchorRef.current.contains(e.target as Node)) dismissTooltip()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismissTooltip() }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [tooltip, dismissTooltip])

  useEffect(() => () => {
    if (tooltipTimerRef.current !== null) window.clearTimeout(tooltipTimerRef.current)
  }, [])

  const handleClick = useCallback(() => {
    eAudio.currentTime = 0
    eAudio.play()

    const id = Date.now()
    setEchoes(prev => [...prev, id])
    setTimeout(() => setEchoes(prev => prev.filter(e => e !== id)), 2000)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <header className={`site-header fixed top-0 inset-x-0 z-850 transition-all duration-300 ease-out border-b ${
      hidden ? '-translate-y-full' : 'translate-y-0'
    } ${
      atTop && !menuOpen ? 'bg-transparent border-transparent' : 'bg-blue-950/90 backdrop-blur-md border-white/10'
    }`}>
      <CascadeGroup mountOnly>
        <Container className={`flex items-center justify-between transition-all duration-300 ease-out ${atTop ? 'py-6' : 'py-3'}`}>

          <CascadeItem index={0}>
            <div className="relative">
              {echoes.map(id => (
                <img
                  key={id}
                  src="/icon.svg"
                  alt=""
                  aria-hidden
                  className="absolute top-0 left-0 w-6 pointer-events-none origin-center"
                  style={{ animation: 'icon-echo 2s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                />
              ))}
              <img
                src="/icon.svg"
                alt="Eric Shell"
                className="w-6 cursor-pointer relative hover:scale-[120%] hover:rotate-5 transition"
                onClick={handleClick}
              />
            </div>
          </CascadeItem>

          {/* Nav-item easter egg (NavTooltip) is desktop-only: the mobile menu
              stacks items full-width and closes on scroll/click already, so a
              floating tooltip below one row would either clip against the
              next item or just restate what closing the menu already tells
              you. Not worth a second interaction model there. */}
          <nav aria-label="Primary navigation" className="hidden lg:block">
            <ul className="flex items-center gap-6">
              {links.map(({ label, href, Icon, tooltip: tooltipText }, i) => {
                const sectionId = href.split('#')[1]
                const isActive = isHomePage && !!sectionId && activeSection === sectionId
                const isLast = i === links.length - 1
                return (
                  <CascadeItem key={label} as="li" index={i + 1}>
                    <div className="relative inline-flex" ref={isActive ? tooltipAnchorRef : undefined}>
                      <Button
                        href={isActive ? undefined : href}
                        variant={isActive ? 'primary' : 'glass-light'}
                        size="sm"
                        leftIcon={<Icon size={14} />}
                        onClick={isActive && tooltipText ? () => triggerTooltip(sectionId as string, tooltipText) : undefined}
                        // className={isActive ? 'hover:from-white hover:to-blue-50 hover:text-blue-800 cursor-default' : ''}
                      >
                        {label}
                      </Button>
                      {isActive && tooltipText && (
                        <NavTooltip
                          text={tooltipText}
                          show={tooltip?.sectionId === sectionId}
                          align={isLast ? 'end' : 'center'}
                        />
                      )}
                    </div>
                  </CascadeItem>
                )
              })}
            </ul>
          </nav>

          <CascadeItem index={links.length + 1} className="lg:hidden">
            <button
              className="text-white hover:text-white cursor-pointer transition-colors p-1 -mr-1"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(o => !o)}
            >
              {menuOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
            </button>
          </CascadeItem>

        </Container>
      </CascadeGroup>

      <div
        className={`lg:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
          menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Mobile navigation">
          <ul className="px-6 pb-6 pt-1 flex flex-col gap-2">
            {links.map(({ label, href, Icon }) => {
              const sectionId = href.split('#')[1]
              const isActive = isHomePage && !!sectionId && activeSection === sectionId
              return (
                <li key={label}>
                  <Button
                    href={isActive ? undefined : href}
                    variant={isActive ? 'secondary' : 'glass-light'}
                    size="sm"
                    leftIcon={<Icon size={14} />}
                    className={`w-full justify-start ${isActive ? 'hover:from-white hover:to-blue-50 hover:text-blue-800 cursor-default' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </Button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </header>
  )
}
