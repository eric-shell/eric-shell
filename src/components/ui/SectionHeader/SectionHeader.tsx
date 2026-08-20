import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
import Eyebrow from '../Eyebrow'
import { H2 } from '../Heading'

interface SectionHeaderProps {
  eyebrow: string
  title: string
  eyebrowClassName?: string
  titleClassName?: string
  action?: ReactNode
  className?: string
}

export default function SectionHeader({
  eyebrow,
  title,
  eyebrowClassName,
  titleClassName,
  action,
  className,
}: SectionHeaderProps) {
  const titlePair = (
    <div>
      <Eyebrow className={twMerge('mb-4 block', eyebrowClassName)}>{eyebrow}</Eyebrow>
      <H2 className={titleClassName}>{title}</H2>
    </div>
  )

  if (!action) {
    return <div className={className}>{titlePair}</div>
  }

  /*
   * The action stacks under the title pair below `md` rather than sitting
   * beside it. It used to be hidden here and re-rendered by the call site at
   * the foot of the section's body copy — which put a primary pill directly on
   * top of the Work grid's sort and tag controls, three pill-shaped controls in
   * a vertical run. Stacking it here is the same hierarchy the desktop row
   * states (section, then its offsite destination), and it means the CTA exists
   * once in the DOM instead of twice.
   */
  return (
    <div
      className={twMerge(
        'flex flex-col items-start gap-6 pb-10 md:flex-row md:justify-between md:gap-4',
        className,
      )}
    >
      {titlePair}
      {action}
    </div>
  )
}
