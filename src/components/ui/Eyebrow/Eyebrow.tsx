import type { HTMLAttributes } from 'react'

interface EyebrowProps extends HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
}

export default function Eyebrow({ children, className = '', ...props }: EyebrowProps) {
  return (
    <span
      className={`font-sans text-sm font-bold uppercase tracking-wider ${className}`}
      style={{ fontVariationSettings: "'GRAD' 150" }}
      {...props}
    >
      {children}
    </span>
  )
}
