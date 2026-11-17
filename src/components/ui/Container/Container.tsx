import type { ElementType, HTMLAttributes } from 'react'
import { cn } from '../cn'

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
}

export default function Container({ as: Tag = 'div', className, children, ...props }: ContainerProps) {
  return (
    <Tag className={cn('max-w-[1440px] mx-auto px-6', className)} {...props}>
      {children}
    </Tag>
  )
}
