import { useEffect, useState, type CSSProperties, type ElementType } from 'react'
import { useCascade } from './CascadeContext'

interface CascadeItemProps {
  children: React.ReactNode
  className?: string
  as?: ElementType
  index?: number
  /** Explicit entrance delay — bypasses the index * stagger formula and its 7-step cap. */
  delayMs?: number
  /**
   * Slide in without the opacity fade. Required when the item contains a
   * `backdrop-filter` element (any `glass-*` variant): an ancestor with
   * opacity < 1 forms a backdrop root, so the blur samples an empty backdrop
   * for the whole fade and then snaps the moment opacity resolves to 1. Such
   * children should fade themselves — see `animate-glass-in`.
   */
  slideOnly?: boolean
}

export default function CascadeItem({ children, className, as: Tag = 'div', index = 0, delayMs, slideOnly = false }: CascadeItemProps) {
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
      className={`cascade-item duration-500 ease-out ${
        slideOnly ? 'transition-transform' : 'transition-[opacity,transform]'
      } ${
        isVisible
          ? `translate-y-0${slideOnly ? '' : ' opacity-100'}`
          : `translate-y-[6px]${slideOnly ? '' : ' opacity-0'}`
      }${className ? ` ${className}` : ''}`}
      style={{
        transitionDelay: isVisible ? `${delay}ms` : '0ms',
        // Inherited by descendants so a `cascade-fade` element can fade itself.
        // Custom properties form no backdrop root, so this reaches glass that
        // an ancestor's opacity would have broken.
        '--cascade-fade': isVisible ? 1 : 0,
        '--cascade-delay': isVisible ? `${delay}ms` : '0ms',
      } as CSSProperties}
    >
      {children}
    </Tag>
  )
}
