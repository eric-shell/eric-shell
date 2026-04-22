import type { HTMLAttributes } from 'react'

interface EyebrowProps extends HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  size?: 'sm' | 'lg'
}

const sizeClasses = {
  sm: 'text-sm',
  lg: 'text-lg',
}

export default function Eyebrow({ children, className = '', size = 'sm', ...props }: EyebrowProps) {
  return (
    <span
      className={`font-sans ${sizeClasses[size]} font-bold uppercase tracking-wider ${className}`}
      style={{ fontVariationSettings: "'GRAD' 150" }}
      {...props}
    >
      {children}
    </span>
  )
}
