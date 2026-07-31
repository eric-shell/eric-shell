import { useState, useCallback, useEffect, useRef } from 'react'
import { Menu, X } from 'lucide-react'
import { CascadeGroup, CascadeItem, Button, Container } from '../../ui'
import { navLinks, homeLink } from '@/data'

const eAudio = new Audio('/audio/Eeeeeee.wav')
eAudio.volume = .4

export default function Header() {
  const [echoes, setEchoes] = useState<number[]>([])
  const [hidden, setHidden] = useState(false)
  const [atTop, setAtTop] = useState(true)
  const [activeSection, setActiveSection] = useState('hero')
  const [menuOpen, setMenuOpen] = useState(false)
  const lastScrollY = useRef(0)
  const isHomePage = window.location.pathname === '/'
  // /resume and /privacy get a Home link ahead of the section anchors; on the
  // home page itself the logo already scrolls to top, so it would be dead weight.
  const links = isHomePage ? navLinks : [homeLink, ...navLinks]

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
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

          <nav aria-label="Primary navigation" className="hidden lg:block">
            <ul className="flex items-center gap-6">
              {links.map(({ label, href, Icon }, i) => {
                const sectionId = href.split('#')[1]
                const isActive = isHomePage && !!sectionId && activeSection === sectionId
                return (
                  <CascadeItem key={label} as="li" index={i + 1}>
                    <Button
                      href={isActive ? undefined : href}
                      variant={isActive ? 'primary' : 'glass-light'}
                      size="sm"
                      leftIcon={<Icon size={14} />}
                      // className={isActive ? 'hover:from-white hover:to-blue-50 hover:text-blue-800 cursor-default' : ''}
                    >
                      {label}
                    </Button>
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
