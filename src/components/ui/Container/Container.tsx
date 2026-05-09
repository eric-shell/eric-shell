import type { ElementType, HTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
}

export default function Container({ as: Tag = 'div', className, children, ...props }: ContainerProps) {
  return (
    <Tag className={twMerge('max-w-[1440px] mx-auto px-6', className)} {...props}>
      {children}
    </Tag>
  )
}
