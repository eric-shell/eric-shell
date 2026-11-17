import type { ElementType, HTMLAttributes, Ref } from 'react'
import { cn } from '../cn'
import { TONE, type Tone } from './tone'

/**
 * Vertical padding, base and `md:` paired so the two can never be set apart.
 *   section  a full home-page section.
 *   block    a section of a document page (the resume), or a sheet's own padding.
 *   tight    a dense document section (the privacy page).
 *   none     the caller owns it (the hero, a pinned section).
 */
export type Rhythm = 'section' | 'block' | 'tight' | 'none'

const RHYTHM: Record<Rhythm, string> = {
  section: 'py-24 md:py-36',
  block: 'py-16 md:py-24',
  tight: 'py-12 md:py-16',
  none: '',
}

interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone: Tone
  rhythm?: Rhythm
  as?: ElementType
  ref?: Ref<HTMLElement>
}

/**
 * Every `<section>` on the site. It owns the field and the vertical rhythm, so
 * a section file states which field it is on once and never spells out
 * `bg-* text-* py-*` (ESLint refuses a raw `<section>` in `sections/`).
 *
 * It does not include a `Container`: the hero and the pinned Visuals section
 * lay out against the full bleed.
 */
export default function Section({ tone, rhythm = 'section', as: Tag = 'section', className, children, ...props }: SectionProps) {
  return (
    <Tag className={cn('relative', TONE[tone], RHYTHM[rhythm], className)} {...props}>
      {children}
    </Tag>
  )
}

interface PageProps extends HTMLAttributes<HTMLElement> {
  /** The field behind the whole route, visible wherever a section does not paint its own. */
  tone?: Exclude<Tone, 'inherit'>
}

/** A route's `<main>`. Carries `id="main"`, the skip link's target. */
export function Page({ tone, className, children, ...props }: PageProps) {
  return (
    <main id="main" className={cn(tone && TONE[tone], className)} {...props}>
      {children}
    </main>
  )
}
