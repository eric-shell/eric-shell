import { useEffect, useRef, useState, type ElementType } from 'react'
import { useCascade } from './CascadeContext'

interface CascadeItemProps {
  children: React.ReactNode
  className?: string
  as?: ElementType
  index?: number
}

export default function CascadeItem({ children, className, as: Tag = 'div', index = 0 }: CascadeItemProps) {
  const { inView: groupInView, stagger } = useCascade()
  const delay = Math.min(index, 7) * stagger

  // If the group is already in view when this item mounts (e.g. a filter revealed it),
  // animate independently so only this item fades in — not the whole group.
  const groupInViewOnMount = useRef(groupInView)
  const [selfVisible, setSelfVisible] = useState(false)

  useEffect(() => {
    if (!groupInViewOnMount.current) return
    const id = requestAnimationFrame(() => setSelfVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const isVisible = groupInViewOnMount.current ? selfVisible : groupInView

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
