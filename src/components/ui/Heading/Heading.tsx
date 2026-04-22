import type { HTMLAttributes } from 'react'

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

const base = 'font-display font-bold uppercase leading-none tracking-tight'

export function H1({ children, className = '', ...props }: HeadingProps) {
  return (
    <h1 className={`${base} text-4xl md:text-8xl ${className}`} {...props}>
      {children}
    </h1>
  )
}

export function H2({ children, className = '', ...props }: HeadingProps) {
  return (
    <h2 className={`${base} text-3xl md:text-6xl ${className}`} {...props}>
      {children}
    </h2>
  )
}

export function H3({ children, className = '', ...props }: HeadingProps) {
  return (
    <h3 className={`${base} text-xl md:text-3xl ${className}`} {...props}>
      {children}
    </h3>
  )
}
