import { useState, useCallback, useEffect, useRef } from 'react'
import { Briefcase, Quote, Camera, UserRound } from 'lucide-react'
import { CascadeGroup, CascadeItem, Button } from '../../ui'

const ericAudio = new Audio('/audio/Eeeeeee.wav')

const NAV_LINKS = [
  { label: 'Work',         href: '#contributions', Icon: Briefcase },
  { label: 'Testimonials', href: '#testimonials',  Icon: Quote     },
  { label: 'Creative',     href: '#creative',      Icon: Camera    },
  { label: 'Contact',      href: '#contact',       Icon: UserRound },
]

export default function Header() {
  const [echoes, setEchoes] = useState<number[]>([])
  const [hidden, setHidden] = useState(false)
  const [atTop, setAtTop] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      setAtTop(currentY < 150)
      setHidden(currentY > lastScrollY.current && currentY > 80)
      lastScrollY.current = currentY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleClick = useCallback(() => {
    ericAudio.currentTime = 0
    ericAudio.play()

    const id = Date.now()
    setEchoes(prev => [...prev, id])
    setTimeout(() => setEchoes(prev => prev.filter(e => e !== id)), 2000)
  }, [])

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ease-out border-b ${
      hidden ? '-translate-y-full' : 'translate-y-0'
    } ${
      atTop ? 'bg-transparent border-transparent' : 'bg-off-black/90 backdrop-blur-md border-white/10'
    }`}>
      <CascadeGroup mountOnly>
        <div className={`max-w-[1440px] mx-auto px-6 flex items-center justify-between transition-all duration-300 ease-out ${atTop ? 'py-6' : 'py-3'}`}>

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
                className="w-6 cursor-pointer relative"
                onClick={handleClick}
              />
            </div>
          </CascadeItem>

          <nav aria-label="Primary navigation">
            <ul className="flex items-center gap-6">
              {NAV_LINKS.map(({ label, href, Icon }, i) => (
                <CascadeItem key={label} as="li" index={i + 1}>
                  <Button
                    href={href}
                    variant="glass"
                    size="sm"
                    leftIcon={<Icon size={14} />}
                  >
                    {label}
                  </Button>
                </CascadeItem>
              ))}
            </ul>
          </nav>

        </div>
      </CascadeGroup>
    </header>
  )
}
