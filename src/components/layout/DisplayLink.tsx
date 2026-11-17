import type { AnchorHTMLAttributes } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/components/ui/cn'

/**
 * A navigation link set like the page's headings (Display caps, even
 * tracking), for the menu and the footer, both of which are dark or blue
 * fields. On hover or focus the link brightens and a cyan arrow slides in.
 *
 * The call site sets the size. Layout-local rather than in `components/ui`:
 * it only makes sense as site navigation.
 */
export default function DisplayLink({ className, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={cn(
        'group inline-flex items-center gap-2 font-display font-bold uppercase tracking-display text-white/80 transition-colors hover:text-white',
        className,
      )}
      {...props}
    >
      {children}
      <ArrowUpRight
        size={18}
        strokeWidth={2.75}
        aria-hidden="true"
        // Hidden below `sm`: it is a hover affordance, and its reserved width
        // made TESTIMONIALS 26px wider than its footer column on a 360px phone.
        className="max-sm:hidden text-glow opacity-0 -translate-x-2 transition-[opacity,translate] duration-300 ease-spring group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0"
      />
    </a>
  )
}
