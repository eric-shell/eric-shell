import { useEffect, useState, type ElementType, type HTMLAttributes } from 'react'
import { useCascade } from './CascadeContext'

interface CascadeItemProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  children: React.ReactNode
  className?: string
  as?: ElementType
  index?: number
  /** Explicit entrance delay — bypasses the index * stagger formula and its 7-step cap. */
  delayMs?: number
  /**
   * `rise` (default): fade up 6px. `flip`: the card stands up from lying flat,
   * hinged at its bottom edge, on a spring — the Work grid's wave. Flip uses
   * `transform` only, so the `translate` property stays free for a caller's
   * own motion (the grid's column drift).
   */
  effect?: 'rise' | 'flip'
}

export default function CascadeItem({ children, className, as: Tag = 'div', index = 0, delayMs, effect = 'rise', style: styleProp, ...props }: CascadeItemProps) {
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

  const motion = effect === 'flip'
    ? `origin-bottom transition-[opacity,transform] duration-1000 ease-[cubic-bezier(0.3,1.3,0.5,1)] ${
        isVisible ? 'opacity-100 [transform:none]' : 'opacity-0 [transform:perspective(900px)_rotateX(-80deg)_translateY(50px)]'
      }`
    : `duration-500 ease-out transition-[opacity,transform] ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-[6px] opacity-0'
      }`

  return (
    <Tag
      className={`cascade-item ${motion}${className ? ` ${className}` : ''}`}
      {...props}
      style={{ ...styleProp, transitionDelay: isVisible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </Tag>
  )
}
