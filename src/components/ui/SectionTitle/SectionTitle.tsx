import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
import { CascadeGroup, CascadeItem } from '../Cascade'
import Eyebrow from '../Eyebrow'
import { H2 } from '../Heading'
import RiseText from '../RiseText'
import { descDelay } from './descDelay'

interface SectionTitleProps {
  eyebrow: string
  title: string
  /** An offsite or secondary action, shown beside the title from `md` up. */
  action?: ReactNode
  /** Description CascadeItems. They share this group's trigger, so they enter in step with the heading. */
  children?: ReactNode
  eyebrowClassName?: string
  className?: string
}

/**
 * The home page's section header: eyebrow, then a poster-size Display heading
 * that rises letter by letter (RiseText), then whatever description follows.
 * One CascadeGroup drives all of it, so the heading and its description can
 * never drift out of step.
 *
 * The heading's size is clamped so the longest title on the page
 * (TESTIMONIALS, 7.6em wide) still fits a 320px phone: 9.5vw × 7.6 < 100vw - 48px.
 */
/**
 * Both the base and the `md:` size are set, because H2's own defaults include an
 * `md:` size that a plain class can't override: that is how these headings sat
 * at 60px on desktop when the design calls for 136.
 */
const SIZE = 'text-[clamp(40px,9.5vw,136px)] md:text-[clamp(40px,9.5vw,136px)]'

export default function SectionTitle({ eyebrow, title, action, children, eyebrowClassName, className }: SectionTitleProps) {
  return (
    <CascadeGroup threshold={0.15} className={className}>
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <CascadeItem index={0}>
            <Eyebrow className={twMerge('mb-4 block', eyebrowClassName)}>{eyebrow}</Eyebrow>
          </CascadeItem>
          <H2 className={`${SIZE} leading-[0.86]`}>
            <RiseText text={title} />
          </H2>
        </div>
        {action && (
          <CascadeItem delayMs={descDelay(0)} className="shrink-0">
            {action}
          </CascadeItem>
        )}
      </div>
      {children}
    </CascadeGroup>
  )
}
