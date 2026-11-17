import type { AnchorHTMLAttributes } from 'react'
import { cn } from '../cn'

interface SocialLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
  /** The field it sits on: the blue menu panel, or the ink footer. */
  tone: 'lum' | 'ink'
  /** The network's name. It is the link's whole accessible name. */
  label: string
  /** One 24x24 SVG path, from `socialLinks` in `@/data`. */
  path: string
}

const TONE = {
  lum: 'border-white/35 text-white hover:border-white hover:bg-white hover:text-lum',
  ink: 'border-white/25 text-ice/85 hover:border-lum hover:bg-lum hover:text-white',
}

/** A round outlined link to a profile elsewhere. Opens in a new tab. */
export default function SocialLink({ tone, label, path, className, ...props }: SocialLinkProps) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-full border transition-[color,background-color,border-color,translate] duration-300 ease-spring hover:-translate-y-1',
        TONE[tone],
        className,
      )}
      {...props}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d={path} />
      </svg>
    </a>
  )
}
