import type { AnchorHTMLAttributes } from 'react'
import { cn } from '../cn'
import { TEXT_LINK, type TextLinkTone } from './linkTone'

interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  tone?: TextLinkTone
}

/** A link inside a sentence. Anything that stands alone as an action is a `Button`. */
export default function TextLink({ tone = 'lum', className, children, ...props }: TextLinkProps) {
  return (
    <a className={cn(TEXT_LINK[tone], className)} {...props}>
      {children}
    </a>
  )
}
