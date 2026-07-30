import { AlertTriangle, Bot, MoonStar } from 'lucide-react'
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
  // red-400 is 6.10:1 on the canvas — AA text.
  danger: 'text-red-400 bg-red-400/10 ring-red-400/25',
  warn:   'text-white/85 bg-white/[0.07] ring-white/15',
  muted:  'text-white/80 bg-white/[0.05] ring-white/10',
}

const ICON: Record<string, typeof Bot> = {
  'Bot': Bot,
  'Automated': Bot,
  'No dwell': MoonStar,
  'Bounce': MoonStar,
  'Spam?': AlertTriangle,
}

export default function VisitorTags({ tags }: { tags: VisitorTag[] }) {
  if (tags.length === 0) return null
  return (
    <span className="mt-1 flex flex-wrap items-center gap-1">
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
