import { useEffect, useState, type ElementType, type HTMLAttributes } from 'react'
import { useInView } from 'react-intersection-observer'
import { CascadeContext } from './CascadeContext'

interface CascadeGroupProps extends HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  className?: string
  as?: ElementType
  mountOnly?: boolean
  threshold?: number
  stagger?: number
}

export default function CascadeGroup({
  children,
  className,
  as: Tag = 'div',
  mountOnly = false,
  threshold = 0.1,
  stagger = 75,
  ...props
}: CascadeGroupProps) {
  const [mountInView, setMountInView] = useState(false)
  const { ref, inView: scrollInView } = useInView({ threshold, triggerOnce: true, skip: mountOnly })

  useEffect(() => {
    if (!mountOnly) return
    const id = requestAnimationFrame(() => setMountInView(true))
    return () => cancelAnimationFrame(id)
  }, [mountOnly])

  const inView = mountOnly ? mountInView : scrollInView

  return (
    <CascadeContext.Provider value={{ inView, stagger }}>
      {/*
        `...props` so `as` is actually usable as a semantic element. Rendering
        `as="nav"` without forwarding attributes silently dropped the
        `aria-label` that names the landmark, which is most of the reason to
        reach for `as="nav"` in the first place. Matches the convention every
        other ui component follows.
      */}
      <Tag ref={mountOnly ? undefined : ref} className={className} {...props}>
        {children}
      </Tag>
    </CascadeContext.Provider>
  )
}
