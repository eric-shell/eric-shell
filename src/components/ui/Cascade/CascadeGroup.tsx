import { useCallback, useEffect, useRef, useState, type ElementType, type HTMLAttributes } from 'react'
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

/**
 * The most of the viewport a group may be asked to fill before it reveals.
 *
 * `threshold` is a fraction of the GROUP, so on a tall one it can ask for more
 * than a screen holds: 5% of the 12,700px notes list is 635px, and on a 548px
 * viewport the highest ratio that list can ever reach is 0.043. The observer
 * never fires and every card stays at `opacity: 0` — an empty page, with no
 * error anywhere. It also got one note closer to failing on a taller phone with
 * each entry added.
 *
 * Capping the ask at a quarter of the viewport makes every threshold reachable
 * at any height. A quarter rather than the whole screen because the cap is also
 * how much blank space a tall group shows before it appears: that same list
 * needed 612px of a 664px phone on screen first, a full empty screen that only
 * just resolved. Groups already asking for less than a quarter of the viewport
 * (threshold x height) are untouched, which is most of them.
 */
const MAX_VIEWPORT_SHARE = 0.25

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
  // `threshold`, lowered if this group is too tall to ever reach it.
  const [reachable, setReachable] = useState(threshold)
  const { ref: inViewRef, inView: scrollInView } = useInView({
    threshold: reachable,
    triggerOnce: true,
    skip: mountOnly,
  })
  const node = useRef<HTMLElement | null>(null)
  const ref = useCallback((el: HTMLElement | null) => {
    node.current = el
    inViewRef(el)
  }, [inViewRef])

  useEffect(() => {
    if (!mountOnly) return
    const id = requestAnimationFrame(() => setMountInView(true))
    return () => cancelAnimationFrame(id)
  }, [mountOnly])

  // Measured, because the cap depends on a height that moves: images load, a
  // filter shortens the list, the phone rotates. Stops once the group has
  // revealed — `useInView` rebuilds its observer when the threshold changes, and
  // a rebuild after the fact could report "not in view" and hide it again.
  useEffect(() => {
    const el = node.current
    if (mountOnly || scrollInView || !el) return
    const measure = () => {
      const height = el.offsetHeight
      if (height === 0) return
      // Rounded down to 3 places so sub-pixel height changes don't each build a
      // new observer. Down, not nearest: rounding up could overshoot the cap.
      const cap = Math.floor((window.innerHeight * MAX_VIEWPORT_SHARE / height) * 1000) / 1000
      setReachable(Math.min(threshold, cap))
    }
    // No explicit first call: a ResizeObserver reports once on `observe`.
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [mountOnly, scrollInView, threshold])

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
