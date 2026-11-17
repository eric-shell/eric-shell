import type { ReactNode } from 'react'
import { cn } from '../cn'
import { CascadeGroup, CascadeItem } from '../Cascade'
import Eyebrow from '../Eyebrow'
import { H1, H2 } from '../Heading'
import RiseText from '../RiseText'
import { descDelay } from './descDelay'

interface SectionTitleProps {
  /** Optional on the inner routes, where a document's own section heads go without one. */
  eyebrow?: string
  title: string
  /** An offsite or secondary action, shown beside the title from `md` up. */
  action?: ReactNode
  /** Description CascadeItems. They share this group's trigger, so they enter in step with the heading. */
  children?: ReactNode
  /**
   * `h1` for an inner route's masthead (inside a `PageHero`); `h2` everywhere
   * else. Only the element changes: the size comes from `size`.
   */
  as?: 'h1' | 'h2'
  /**
   * `poster` is the home page's section heading. `compact` is a document's
   * section head on an inner route (the resume, the privacy page), sized to fit
   * the 4/12 column those pages give it from `lg` up.
   */
  size?: 'poster' | 'compact'
  /** Enter on mount rather than on scroll. For a masthead, which is on screen at load. */
  mountOnly?: boolean
  /**
   * Stay in view beside a long section, from `lg`. For a document section's
   * head in the left column of a `grid-split`.
   */
  sticky?: boolean
  eyebrowClassName?: string
  titleClassName?: string
  /** Lands on the action's wrapper, e.g. `print:hidden`, so a hidden action leaves no gap behind. */
  actionClassName?: string
  className?: string
}

/**
 * Both the base and the `md:` size are set, because the headings' own defaults
 * include an `md:` size that a plain class can't override: that is how these
 * headings sat at 60px on desktop when the design calls for 136.
 *
 * `poster` is clamped so the longest title on the home page (TESTIMONIALS,
 * 7.6em wide) still fits a 320px phone: 9.5vw × 7.6 < 100vw - 48px.
 *
 * `compact` steps down from `lg`, where it sits in a 4/12 column rather than
 * across the page. CREDENTIALS, the widest head that uses it (~6.1em), fits
 * that column at both ends of the range: 43px in 299px at 1024, 60px in 420px
 * at 1440.
 */
const SIZE = {
  poster: 'text-[clamp(40px,9.5vw,136px)] md:text-[clamp(40px,9.5vw,136px)] leading-[0.86]',
  compact: 'text-[clamp(32px,8vw,60px)] md:text-[clamp(32px,8vw,60px)] lg:text-[clamp(32px,4.2vw,60px)] leading-[0.9]',
}

/**
 * Every section header on the site: eyebrow, then a Display heading that rises
 * letter by letter (RiseText), then whatever description follows. One
 * CascadeGroup drives all of it, so the heading and its description can never
 * drift out of step. The home page uses it at poster size; the inner routes use
 * it as their masthead (`as="h1" mountOnly`) and, compact, for their own
 * section heads, so every route enters with the same rhythm.
 */
export default function SectionTitle({
  eyebrow,
  title,
  action,
  children,
  as = 'h2',
  size = 'poster',
  mountOnly = false,
  sticky = false,
  eyebrowClassName,
  titleClassName,
  actionClassName,
  className,
}: SectionTitleProps) {
  const Heading = as === 'h1' ? H1 : H2
  return (
    <CascadeGroup
      mountOnly={mountOnly}
      threshold={0.15}
      className={cn(sticky && 'lg:sticky lg:top-28 lg:self-start', className)}
    >
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          {eyebrow && (
            <CascadeItem index={0}>
              <Eyebrow className={cn('mb-4 block', eyebrowClassName)}>{eyebrow}</Eyebrow>
            </CascadeItem>
          )}
          <Heading className={cn(SIZE[size], titleClassName)}>
            <RiseText text={title} />
          </Heading>
        </div>
        {action && (
          <CascadeItem delayMs={descDelay(0)} className={cn('shrink-0', actionClassName)}>
            {action}
          </CascadeItem>
        )}
      </div>
      {children}
    </CascadeGroup>
  )
}
