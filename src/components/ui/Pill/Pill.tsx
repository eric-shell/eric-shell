import { X } from 'lucide-react'
import { cn } from '../cn'
import { SURFACE, SURFACE_HOVER } from '../variants'

interface PillProps {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
  onDismiss?: () => void
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  className?: string
}

const BASE = 'inline-flex items-center gap-1.5 font-sans text-xs font-semibold rounded-md transition'

/**
 * Hover and focus for a clickable inactive pill. The pill sits on a white
 * card, where `outline`'s own ice hover is too quiet for something this small,
 * so it also takes a lum label (4.8:1 on ice) and a lum border.
 */
const INTERACTIVE_INACTIVE =
  'hover:bg-ice hover:text-lum hover:border-lum/40 focus-visible:bg-ice focus-visible:text-lum focus-visible:border-lum/40'

/** Shared by both states: a small press so a click registers before the grid reflows. */
const INTERACTIVE = 'active:scale-95 motion-reduce:active:scale-100'

export default function Pill({
  children,
  active = false,
  onClick,
  onDismiss,
  leftIcon,
  rightIcon,
  className,
}: PillProps) {
  const padding = onDismiss ? 'px-2.5 py-1' : 'px-2 py-1'
  const colors = active
    ? cn(SURFACE.luminous, onClick && SURFACE_HOVER.luminous)
    : cn(SURFACE.outline, onClick && INTERACTIVE_INACTIVE)

  const classes = cn(BASE, padding, colors, onClick && INTERACTIVE, className)

  const inner = (
    <>
      {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
      {children}
      {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
      {onDismiss && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDismiss() }}
          aria-label={`Clear ${children} filter`}
          className="cursor-pointer opacity-70 hover:opacity-100 transition"
        >
          <X size={12} strokeWidth={2.5} aria-hidden="true" />
        </button>
      )}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick() }}
        aria-pressed={active}
        className={`cursor-pointer ${classes}`}
      >
        {inner}
      </button>
    )
  }

  return <span className={classes}>{inner}</span>
}
