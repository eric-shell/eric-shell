import type { HTMLAttributes } from 'react'

interface H3Props extends HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

export default function H3({ children, className = '', ...props }: H3Props) {
  return (
    <h3
      className={`font-display text-xl md:text-3xl font-bold uppercase leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
}
