import { Fragment, type CSSProperties, type ElementType, type HTMLAttributes } from 'react'
import { useCascade } from '../Cascade/CascadeContext'
import { displayGap } from '@/lib/displayKerning'

interface RiseTextProps extends HTMLAttributes<HTMLElement> {
  /** The text. Rendered once for assistive tech and once, letter by letter, for the eye. */
  text: string
  as?: ElementType
  /** Delay before the first letter, in ms. */
  delayMs?: number
  /** Delay between letters, in ms. */
  stagger?: number
  /**
   * Overrides the surrounding CascadeGroup. The hero passes its own mount flag;
   * a decorative copy (the hero's outlined wordmark) passes the same one so the
   * two stay in step.
   */
  inView?: boolean
}

/**
 * A Display heading whose letters rise into place, in order, when its
 * CascadeGroup comes into view. Every heading on the home page uses it, so the
 * hero wordmark and the section titles enter the same way.
 *
 * Each letter is its own inline-block, and an inline-block boundary switches
 * off the font's kerning. The gap after each letter is therefore set
 * explicitly from `displayGap`: the font's own pair value plus the even
 * tracking every Display heading uses. Deterministic, so the prerendered
 * markup matches the client's first render.
 *
 * The visible letters are `aria-hidden`; the plain text is in an `sr-only`
 * span, so a screen reader reads "Work", not "W, o, r, k".
 */
export default function RiseText({
  text,
  as: Tag = 'span',
  delayMs = 80,
  stagger = 35,
  inView: inViewProp,
  ...props
}: RiseTextProps) {
  const cascade = useCascade()
  const inView = inViewProp ?? cascade.inView
  let n = 0

  return (
    <Tag {...props}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(' ').map((word, w) => (
          <Fragment key={w}>
            {w > 0 && ' '}
            <span className="inline-block whitespace-nowrap">
              {[...word].map((ch, i, letters) => {
                const index = n++
                const next = letters[i + 1]
                const style: CSSProperties = {
                  marginRight: next ? `${displayGap(ch, next).toFixed(3)}em` : undefined,
                  // One delay per transitioned property (transform, opacity,
                  // translate): the entrance is staggered, a hover lift is not.
                  transitionDelay: inView ? `${delayMs + index * stagger}ms, ${delayMs + index * stagger}ms, 0ms` : '0ms',
                }
                return (
                  <span key={i} className="rise-ch" data-i={index} data-out={inView ? undefined : ''} style={style}>
                    {ch}
                  </span>
                )
              })}
            </span>
          </Fragment>
        ))}
      </span>
    </Tag>
  )
}
