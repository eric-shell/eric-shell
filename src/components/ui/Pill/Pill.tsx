import { X } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
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
 * Hover/focus for a clickable inactive pill. `SURFACE_HOVER.white` (a blue-50
 * wash) is shared with Button and all but vanishes when the pill sits on a
 * white Card, so a clickable pill tints toward the Luminous blue instead: ice
 * fill, lum label (4.8:1 on ice) and border. Keyboard focus gets the same
 * tint plus a lum ring, because the global blue-500 outline is easy to miss
 * against the card's own focus outline.
 */
const INTERACTIVE_INACTIVE =
  'hover:bg-ice hover:text-lum hover:border-lum/40 focus-visible:bg-ice focus-visible:text-lum focus-visible:border-lum/40 focus-visible:outline-lum'

/** Active pills keep `primary`'s hover and take the same lum focus ring. */
const INTERACTIVE_ACTIVE = 'focus-visible:outline-lum'

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
    ? twMerge(SURFACE.primary, onClick && SURFACE_HOVER.primary, onClick && INTERACTIVE_ACTIVE)
    : twMerge(SURFACE.white, onClick && INTERACTIVE_INACTIVE)

  const classes = twMerge(BASE, padding, colors, onClick && INTERACTIVE, className)

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
