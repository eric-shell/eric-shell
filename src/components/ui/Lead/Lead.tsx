import type { HTMLAttributes } from 'react'
import { cn } from '../cn'

interface LeadProps extends HTMLAttributes<HTMLParagraphElement> {
  /** `lg` under a masthead's title; `md` for a section's opening paragraph. */
  size?: 'md' | 'lg'
}

const SIZE = {
  md: 'text-base md:text-lg',
  lg: 'text-lg md:text-xl',
}

/**
 * The paragraph that follows a heading and says what the page or section is.
 * Type only: it takes its colour from the field, and the call site sets the
 * measure (`max-w-*`) and the space above it.
 */
export default function Lead({ size = 'md', className, children, ...props }: LeadProps) {
  return (
    <p className={cn('font-sans leading-relaxed', SIZE[size], className)} {...props}>
      {children}
    </p>
  )
}
