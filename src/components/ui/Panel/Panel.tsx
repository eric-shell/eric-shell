import type { HTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'
import { SURFACE, type Variant } from '../variants'

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant
  className?: string
  children?: React.ReactNode
}

export default function Panel({ variant = 'secondary', className, children, ...props }: PanelProps) {
  return (
    <div className={twMerge(SURFACE[variant], className)} {...props}>
      {children}
    </div>
  )
}
