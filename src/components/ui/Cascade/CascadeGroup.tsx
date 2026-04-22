import { useEffect, useState, type ElementType } from 'react'
import { useInView } from 'react-intersection-observer'
import { CascadeContext } from './CascadeContext'

interface CascadeGroupProps {
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
      <Tag ref={mountOnly ? undefined : ref} className={className}>
        {children}
      </Tag>
    </CascadeContext.Provider>
  )
}
