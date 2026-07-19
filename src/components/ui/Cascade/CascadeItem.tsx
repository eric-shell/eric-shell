import { useEffect, useState, type ElementType } from 'react'
import { useCascade } from './CascadeContext'

interface CascadeItemProps {
  children: React.ReactNode
  className?: string
  as?: ElementType
  index?: number
  /** Explicit entrance delay — bypasses the index * stagger formula and its 7-step cap. */
  delayMs?: number
}

export default function CascadeItem({ children, className, as: Tag = 'div', index = 0, delayMs }: CascadeItemProps) {
  const { inView: groupInView, stagger } = useCascade()
  const delay = delayMs ?? Math.min(index, 7) * stagger

  // If the group is already in view when this item mounts (e.g. a filter revealed it),
  // animate independently so only this item fades in — not the whole group.
  const [groupInViewOnMount] = useState(groupInView)
  const [selfVisible, setSelfVisible] = useState(false)

  useEffect(() => {
    if (!groupInViewOnMount) return
    const id = requestAnimationFrame(() => setSelfVisible(true))
    return () => cancelAnimationFrame(id)
  }, [groupInViewOnMount])

  const isVisible = groupInViewOnMount ? selfVisible : groupInView

  return (
    <Tag
      className={`cascade-item transition-[opacity,transform] duration-500 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[6px]'
      }${className ? ` ${className}` : ''}`}
      style={{ transitionDelay: isVisible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </Tag>
  )
}
