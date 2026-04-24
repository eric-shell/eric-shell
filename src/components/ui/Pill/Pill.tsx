import { X } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { SURFACE } from '../variants'

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
    ? SURFACE.dark
    : `${SURFACE.light} text-off-black/50 bg-off-black/8${onClick ? ' hover:bg-off-black hover:text-white' : ''}`

  const classes = twMerge(BASE, padding, colors, className)

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
          <X size={12} aria-hidden="true" />
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
