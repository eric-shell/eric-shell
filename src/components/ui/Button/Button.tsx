import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

type Variant = 'solid' | 'outline' | 'ghost' | 'glass-light' | 'glass-dark'
type Size = 'sm' | 'md' | 'lg'
type Shape = 'pill' | 'square'

const BASE = 'inline-flex items-center justify-center gap-2 font-sans font-semibold transition cursor-pointer'

const VARIANT: Record<Variant, string> = {
  solid:   'bg-off-black text-white hover:bg-off-black/90',
  outline: 'border border-off-black/20 text-off-black/60 hover:border-off-black/40 hover:text-off-black',
  ghost:   'text-off-black/60 hover:text-off-black',
  'glass-light': 'glass-blur bg-white/10 border border-white/20 text-white hover:bg-off-black/50 hover:border-off-black/20 transition-all',
  'glass-dark':  'glass-blur bg-off-black/20 border border-off-black/20 text-white hover:bg-off-black/50 hover:border-off-black/20 transition-all',
}

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
  variant = 'solid',
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
  const classes = twMerge(BASE, VARIANT[variant], sizeClass, className)

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
