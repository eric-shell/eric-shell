import { cn } from '@/components/ui/cn'
import {
  AlertTriangle, BookOpen, Bot, EyeOff, FlaskConical, Footprints, Globe,
  MailCheck, MessageSquare, MoonStar, RotateCcw, Sparkles, VenetianMask, Waypoints,
} from 'lucide-react'
import type { TagTone, VisitorTag } from '../lib/classify'

/**
 * Row badges for heuristically low-value traffic.
 *
 * Not the shared `Pill`: that is a light-theme filter chip sized for the public
 * site's tag rows, and it would need all three of its surface classes overridden
 * to sit in a dense dark table — which is exactly the hand-rolling the variant
 * system exists to prevent. These are alpha tints over the dark canvas instead.
 *
 * Every tag pairs an icon with a word, never colour alone, and carries the
 * classifier's reason as a title — a judgement the reader can't interrogate is
 * worse than no judgement.
 */
const TONE: Record<TagTone, string> = {
  // error-bright is 6.10:1 on the canvas — AA text.
  danger: 'text-error-bright bg-error-bright/10 ring-error-bright/25',
  // Traffic to discount, given the same weight as `good` so the column reads
  // symmetrically: green means a person did something, red means don't bother.
  //
  // Shares `danger`'s ink rather than a second red, because a second red at this
  // size would read as the same colour anyway. The ring carries the difference —
  // /15 against danger's /25 — and it is the ONLY separation, so the two must
  // never be merged: `Spam?` asks you to go and read a message, while these ask
  // for nothing at all. `TONE_RANK` in sortVisitors.ts encodes the same order.
  //
  // Full error-bright over this fill is 5.70:1 against the composited background,
  // clearing AA for the 9px badge text. Dropping the ink to /85 lands at 4.47:1
  // and fails it — keep the alpha on the fill, never on the text.
  reject: 'text-error-bright bg-error-bright/[0.07] ring-error-bright/15',
  // success-bright is 7.04:1 on the canvas — AA text. Paired with an icon, never
  // colour alone.
  good:   'text-success-bright bg-success-bright/10 ring-success-bright/25',
  // Amber, at the same hue as `--color-warning`. Corroborating evidence: it
  // explains a red row beside it, or asks you to keep an eye on this one.
  //
  // It was grey until the red tier arrived, which left three grey tiers doing
  // semantic work that nobody can tell apart at 9px. Giving the middle one a hue
  // is what makes the other two legible as "quiet".
  //
  // Rare on purpose — `VPN?` and `Burst` only, three rows in the live table.
  // `Bounce` was moved out to `neutral` in the same change; it outnumbered them
  // and is a real person, so leaving it here would have made amber mean
  // "someone visited briefly". warning-bright is 8.00:1 on the canvas, 7.24:1 over
  // this fill — AA at 9px.
  //
  // Amber next to red is the classic red/green-blind confusion pair, which is
  // survivable here ONLY because every badge carries an icon and a word; colour
  // is never the sole channel. Keep it that way.
  warn:   'text-warning-bright bg-warning-bright/[0.07] ring-warning-bright/20',
  // What's left after `reject` took the unwanted machines: the expected ones.
  // Googlebot indexing the site is the system working, and `Test` is our own
  // traffic — neither is a problem, so neither gets an alarm colour.
  muted:  'text-white/80 bg-white/[0.05] ring-white/10',
  // Every row carries a tag now, and most carry only an ordinary one. Neutral
  // is that ordinary case: legible (white/70 is 6.4:1 on the canvas) but with no
  // fill and the faintest ring, so a screen of them reads as texture and the
  // exceptions still jump. Anything louder and full coverage would just be noise.
  neutral: 'text-white/70 ring-white/[0.08]',
}

const ICON: Record<string, typeof Bot> = {
  'Bot': Bot,
  'Headless': Bot,
  // A different glyph from Bot on purpose: same "not a person" verdict, but
  // traffic we made ourselves, which reads differently at a glance.
  'Test': FlaskConical,
  'LLM': Sparkles,
  // Not the Bot glyph: the others announced themselves, this one was caught
  // claiming to be something it isn't.
  'Spoofed': VenetianMask,
  'No dwell': MoonStar,
  'Bounce': MoonStar,
  // Both about where the traffic came through rather than what it did, so
  // neither gets the Bot glyph: one of them lands on ordinary people.
  'Proxy': Waypoints,
  'Burst': Waypoints,
  'VPN?': Globe,
  'Spam?': AlertTriangle,
  'Returning': RotateCcw,
  'Reader': BookOpen,
  'Converted': MailCheck,
  'Chatted': MessageSquare,
  'Skimmed': Footprints,
  'Untracked': EyeOff,
}

export default function VisitorTags({ tags, className }: { tags: VisitorTag[]; className?: string }) {
  if (tags.length === 0) return null
  return (
    // No margin of its own — it sits in a table cell on desktop and stacked
    // under the id on a phone, which want different spacing.
    <span className={cn('flex flex-wrap items-center gap-1', className)}>
      {tags.map(t => {
        const Icon = ICON[t.label] ?? Bot
        return (
          <span
            key={t.label}
            title={t.reason}
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ring-inset ${TONE[t.tone]}`}
          >
            <Icon size={9} strokeWidth={2.5} aria-hidden="true" />
            {t.label}
          </span>
        )
      })}
    </span>
  )
}
