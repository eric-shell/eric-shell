import { type ElementType } from 'react'
import { useCascade } from './CascadeContext'

interface CascadeItemProps {
  children: React.ReactNode
  className?: string
  as?: ElementType
  index?: number
}

export default function CascadeItem({ children, className, as: Tag = 'div', index = 0 }: CascadeItemProps) {
  const { inView, stagger } = useCascade()
  const delay = Math.min(index, 7) * stagger

  return (
    <Tag
      className={`cascade-item transition-[opacity,transform] duration-500 ease-out ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[6px]'
      }${className ? ` ${className}` : ''}`}
      style={{ transitionDelay: inView ? `${delay}ms` : '0ms' }}
    >
      {children}
    </Tag>
  )
}
