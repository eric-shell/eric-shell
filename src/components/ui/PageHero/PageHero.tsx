import type { HTMLAttributes } from 'react'
import { cn } from '../cn'
import Container from '../Container'
import Section from '../Section'

interface PageHeroProps extends HTMLAttributes<HTMLElement> {
  /** Lands on the inner Container. */
  containerClassName?: string
}

/**
 * The opening field of an inner route (/resume, /privacy, /notes, a note): a
 * solid Luminous Blue block under the floating header, the same field the home
 * page's Work and Contact sections stand on. Usually holds a `SectionTitle`
 * with `as="h1" mountOnly`, so the masthead enters with the home page's rhythm.
 *
 * The bottom padding is deeper than the top on purpose: a `Sheet` rises over
 * the last 48 to 64px of it, the way the Work sheet rises over the hero. A
 * route with no sheet (the notes index, which is all one blue field like Work)
 * overrides it.
 */
export default function PageHero({ className, containerClassName, children, ...props }: PageHeroProps) {
  return (
    <Section tone="lum" rhythm="none" className={cn('pt-32 pb-28 md:pt-40 md:pb-36', className)} {...props}>
      <Container className={containerClassName}>{children}</Container>
    </Section>
  )
}
