import type { ElementType, HTMLAttributes } from 'react'
import { cn } from '../cn'
import { TONE, type Tone } from '../Section/tone'

interface SheetProps extends HTMLAttributes<HTMLElement> {
  tone: Extract<Tone, 'white' | 'lum'>
  as?: ElementType
  /**
   * The sheet starts at 90% width and widens to full bleed as it scrolls in
   * (the Work sheet rising over the hero). Scroll-driven where supported,
   * full width elsewhere and under reduced motion.
   */
  widen?: boolean
}

/** The overlap onto the field above, and the rounding that shows that field in the corners. */
const RISE = '-mt-12 md:-mt-16'
const ROUND = 'rounded-t-4xl md:rounded-t-sheet'

/**
 * A sheet rising over the bottom of the field above it, with a rounded top: the
 * blue Work sheet over the hero, and the white sheet every inner route puts its
 * body on over its `PageHero`. One geometry for both. z-10 so it covers what it
 * overlaps.
 *
 * With `widen`, the colour is a separate layer behind the content, because the
 * widening is a `scaleX` and must not scale the content with it. Without it the
 * element itself is the surface, which keeps a document page's sections as
 * direct children: the resume's print sheet depends on that depth.
 *
 * Square and flush in print, where the field above is a plain masthead.
 */
export default function Sheet({ tone, as: Tag = 'div', widen = false, className, children, ...props }: SheetProps) {
  if (widen) {
    return (
      <Tag className={cn('relative z-10', RISE, TONE[tone], 'bg-transparent', className)} {...props}>
        <div aria-hidden="true" className={cn('sheet-widen absolute inset-0 -z-10', ROUND, tone === 'lum' ? 'bg-lum' : 'bg-white')} />
        {children}
      </Tag>
    )
  }
  return (
    <Tag className={cn('relative z-10 print:mt-0 print:rounded-none', RISE, ROUND, TONE[tone], className)} {...props}>
      {children}
    </Tag>
  )
}
