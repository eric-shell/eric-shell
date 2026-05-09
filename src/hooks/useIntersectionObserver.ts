import { useEffect, useRef, useState } from 'react'

interface Options {
  threshold?: number | number[]
  rootMargin?: string
  triggerOnce?: boolean
}

export function useIntersectionObserver<T extends Element = HTMLDivElement>(options: Options = {}) {
  const { threshold = 0, rootMargin, triggerOnce = false } = options
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const target = ref.current
    if (!target) return
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting)
      if (entry.isIntersecting && triggerOnce) observer.disconnect()
    }, { threshold, rootMargin })
    observer.observe(target)
    return () => observer.disconnect()
  }, [threshold, rootMargin, triggerOnce])

  return { ref, inView }
}
