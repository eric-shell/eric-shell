import type { HTMLAttributes } from 'react'

interface H1Props extends HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

export default function H1({ children, className = '', ...props }: H1Props) {
  return (
    <h1
      className={`font-display text-4xl md:text-8xl font-bold uppercase leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h1>
  )
}
