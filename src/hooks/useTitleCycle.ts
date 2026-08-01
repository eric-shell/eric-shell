import { useEffect } from 'react'

const BASE = 'Eric Shell | '

/**
 * How long the document's own <title> is left completely alone before the
 * cycle takes over.
 *
 * The cycle used to start at 500ms, and its first act was to blank the title
 * down to "Eric Shell | " and retype it. Anything that renders JS and snapshots
 * the DOM shortly after load — Googlebot's Web Rendering Service, most
 * obviously — could therefore capture the title mid-keystroke, which is how
 * "Eric Shell | Avid Mountain Bik" ends up as a search result.
 *
 * 15s is a deliberate over-estimate of any renderer's snapshot point rather
 * than a measured threshold; published figures move and vary by crawler. It
 * costs a human visitor nothing, because the title they see during the hold is
 * the correct one — so there is no reason to shave it close.
 *
 * Scrapers that don't execute JS (Slack, LinkedIn, iMessage) never reach this
 * and always get the static tag.
 */
const STATIC_HOLD_MS = 15_000

/**
 * Phrase 0 must stay byte-identical to the <title> in index.html.
 *
 * The cycle opens by DELETING phrase 0 rather than typing it, so the handoff
 * from the static tag is continuous — the title the visitor has been looking at
 * simply starts erasing. If the two strings drift apart, the first frame of the
 * cycle snaps to a different string before erasing it.
 */
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
  'Avid Mountain Biker',
]

/**
 * Typewriter-cycles the document title.
 *
 * `enabled` is false on every route but the homepage. /resume and /privacy are
 * their own documents with their own <title> (see resume.html / privacy.html),
 * and those titles are the ones that should rank — a cycle running over them
 * would overwrite each page's strongest on-page signal with the homepage's, one
 * character at a time.
 */
export function useTitleCycle(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    // Opens at the end of phrase 0, erasing. See the PHRASES note above.
    let phraseIndex = 0
    let charIndex   = PHRASES[0].length
    let phase: 'typing' | 'pausing' | 'deleting' = 'deleting'
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

    // Deliberately no `document.title = …` before this timer: the static tag is
    // left exactly as the document declared it for the whole hold.
    timerId = window.setTimeout(tick, STATIC_HOLD_MS)

    return () => clearTimeout(timerId)
  }, [enabled])
}
