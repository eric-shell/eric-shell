import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

type Variant = 'solid' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'icon'

const BASE = 'inline-flex items-center justify-center gap-2 font-sans font-semibold transition cursor-pointer'

const VARIANT: Record<Variant, string> = {
  solid:   'bg-off-black text-white hover:bg-off-black/90',
  outline: 'border border-off-black/20 text-off-black/60 hover:border-off-black/40 hover:text-off-black',
  ghost:   'text-off-black/60 hover:text-off-black',
}

const SIZE: Record<Size, string> = {
  sm:   'px-3 py-1.5 rounded-lg text-xs',
  md:   'px-5 py-2.5 rounded-lg text-sm',
  icon: 'p-2.5 rounded-lg',
}

type SharedProps = {
  variant?: Variant
  size?: Size
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
  className = '',
  children,
  leftIcon,
  rightIcon,
  href,
  ...props
}: ButtonProps) {
  const classes = twMerge(BASE, VARIANT[variant], SIZE[size], className)

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
