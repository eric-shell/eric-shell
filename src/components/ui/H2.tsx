import type { HTMLAttributes } from 'react'

interface H2Props extends HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

export default function H2({ children, className = '', ...props }: H2Props) {
  return (
    <h2
      className={`font-display text-3xl md:text-6xl font-bold uppercase leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h2>
  )
}
