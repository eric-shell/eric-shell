import { useEffect } from 'react'

const BASE = 'Eric Shell | '

const PHRASES = [
  'AI Design Systems Engineer and Software Developer',
  'Software Developer',
  'Front End Engineer',
  'Acquia Certified Drupal Developer',
  'ADA and SEO Specialist',
  'UI/UX Designer',
  'Claude Enthusiast',
  'Automotive and Landscape Photographer',
  'Action Sports Videographer',
  'Avid Mountian Biker',
]

export function useTitleCycle() {
  useEffect(() => {
    let phraseIndex = 0
    let charIndex   = 0
    let phase: 'typing' | 'pausing' | 'deleting' = 'typing'
    let timerId     = 0

    function tick() {
      const phrase = PHRASES[phraseIndex]

      if (phase === 'typing') {
        document.title = BASE + phrase.slice(0, ++charIndex)
        if (charIndex < phrase.length) {
          timerId = window.setTimeout(tick, 75)
        } else {
          phase = 'pausing'
          timerId = window.setTimeout(tick, 1500)
        }
      } else if (phase === 'pausing') {
        phase = 'deleting'
        timerId = window.setTimeout(tick, 200)
      } else {
        document.title = BASE + phrase.slice(0, --charIndex)
        if (charIndex > 0) {
          timerId = window.setTimeout(tick, 40)
        } else {
          phraseIndex = (phraseIndex + 1) % PHRASES.length
          phase = 'typing'
          timerId = window.setTimeout(tick, 250)
        }
      }
    }

    document.title = BASE
    timerId = window.setTimeout(tick, 500)

    return () => clearTimeout(timerId)
  }, [])
}
