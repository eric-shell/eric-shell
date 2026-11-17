import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../cn'

type LabelTag = 'span' | 'p' | 'dt' | 'time'

type LabelProps<T extends LabelTag = 'span'> = { as?: T } & ComponentPropsWithoutRef<T>

/**
 * The small uppercase label: a date on a card, a stat's caption, a nav group's
 * heading, a count. Type only, so the colour is the field's unless a token
 * class says otherwise. On a lum field keep it white: `text-glow` there is
 * under 4:1 (it is fine on ink).
 *
 * Not `Eyebrow`. An eyebrow is the kicker above a section heading, larger and
 * on the GRAD axis, and it only appears through `SectionTitle`.
 */
export default function Label<T extends LabelTag = 'span'>({ as, className, children, ...props }: LabelProps<T>) {
  const Tag: LabelTag = as ?? 'span'
  return (
    <Tag className={cn('font-sans text-xs font-bold uppercase tracking-label', className)} {...(props as ComponentPropsWithoutRef<'span'>)}>
      {children}
    </Tag>
  )
}
