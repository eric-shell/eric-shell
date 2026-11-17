import type { HTMLAttributes } from 'react'
import { cn } from '../cn'

/** An inline code chip in running text: a header name, a storage key, a flag. */
export default function Code({ className, children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <code className={cn('px-1.5 py-0.5 rounded bg-ice text-lum-deep font-mono text-[0.85em]', className)} {...props}>
      {children}
    </code>
  )
}
