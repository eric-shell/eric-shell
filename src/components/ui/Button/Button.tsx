import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'
import { SURFACE, SURFACE_HOVER, type Variant, type Size } from '../variants'

type Shape = 'pill' | 'square'

const BASE = 'inline-flex items-center justify-center gap-2 font-sans font-semibold transition cursor-pointer'

const SIZE_PILL: Record<Size, string> = {
  sm: 'px-3 py-1.5 rounded-lg text-xs',
  md: 'px-5 py-2.5 rounded-lg text-sm',
  lg: 'px-6 py-3 rounded-lg text-base',
}

const SIZE_SQUARE: Record<Size, string> = {
  sm: 'p-1.5 rounded-lg',
  md: 'p-2.5 rounded-lg',
  lg: 'p-3.5 rounded-lg',
}

type SharedProps = {
  variant?: Variant
  size?: Size
  shape?: Shape
  className?: string
  children: React.ReactNode
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

type ButtonAsButton = SharedProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }
type ButtonAsAnchor = SharedProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
type ButtonProps = ButtonAsButton | ButtonAsAnchor

export default function Button({
  variant = 'primary',
  size = 'md',
  shape = 'pill',
  className = '',
  children,
  leftIcon,
  rightIcon,
  href,
  ...props
}: ButtonProps) {
  const sizeClass = shape === 'square' ? SIZE_SQUARE[size] : SIZE_PILL[size]
  const classes = twMerge(BASE, SURFACE[variant], SURFACE_HOVER[variant], sizeClass, className)

  const inner = (
    <>
      {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
      {children}
      {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
    </>
  )

  if (href !== undefined) {
    return (
      <a href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {inner}
      </a>
    )
  }

  return (
    <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {inner}
    </button>
  )
}
