import type { HTMLAttributes, Ref } from 'react'
import { cn } from '../cn'
import { SURFACE, type Variant } from '../variants'

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Required: no surface is right on every field. See `variants.ts`. */
  variant: Variant
  className?: string
  ref?: Ref<HTMLDivElement>
  children?: React.ReactNode
}

export default function Panel({ variant, className, children, ...props }: PanelProps) {
  return (
    <div className={cn(SURFACE[variant], className)} {...props}>
      {children}
    </div>
  )
}
