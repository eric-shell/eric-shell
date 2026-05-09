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

  return (
    <div className={twMerge('flex items-start justify-between gap-4 pb-10', className)}>
      {titlePair}
      {action}
    </div>
  )
}
