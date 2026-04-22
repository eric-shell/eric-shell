import { useRef, useEffect, useCallback } from 'react'

interface ParallaxConfig {
  bgStrength: number
  gradientStrength: number
  subjectStrength: number
  lerpFactor: number
}

export function useParallax({ bgStrength, gradientStrength, subjectStrength, lerpFactor }: ParallaxConfig) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const bgRef = useRef<HTMLImageElement | null>(null)
  const gradientRef = useRef<HTMLDivElement | null>(null)
  const subjectRef = useRef<HTMLImageElement | null>(null)

  const targetX = useRef(0)
  const targetY = useRef(0)
  const currentX = useRef(0)
  const currentY = useRef(0)
  const rafId = useRef<number | null>(null)
  const reducedMotion = useRef(false)

  const applyTransforms = useCallback(() => {
    const bx = currentX.current * bgStrength
    const by = currentY.current * bgStrength
    const gx = currentX.current * gradientStrength
    const gy = currentY.current * gradientStrength
    const sx = currentX.current * subjectStrength
    const sy = currentY.current * subjectStrength

    if (bgRef.current) {
      bgRef.current.style.transform = `scale(1.04) translate(${bx}px, ${by}px)`
    }
    if (gradientRef.current) {
      gradientRef.current.style.transform = `translate(${gx}px, ${gy}px)`
    }
    if (subjectRef.current) {
      subjectRef.current.style.transform = `translate(${sx}px, ${sy}px)`
    }
  }, [bgStrength, gradientStrength, subjectStrength])

  const resetTransforms = useCallback(() => {
    if (bgRef.current) bgRef.current.style.transform = 'scale(1.04) translate(0px, 0px)'
    if (gradientRef.current) gradientRef.current.style.transform = 'translate(0px, 0px)'
    if (subjectRef.current) subjectRef.current.style.transform = 'translate(0px, 0px)'
  }, [])

  const tick = useCallback(() => {
    rafId.current = null

    const EPS = 0.0005
    currentX.current += (targetX.current - currentX.current) * lerpFactor
    currentY.current += (targetY.current - currentY.current) * lerpFactor

    applyTransforms()

    const stillMoving =
      Math.abs(targetX.current - currentX.current) > EPS ||
      Math.abs(targetY.current - currentY.current) > EPS

    if (stillMoving) {
      rafId.current = requestAnimationFrame(tick)
    }
  }, [lerpFactor, applyTransforms])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (reducedMotion.current) return
    const rect = sectionRef.current!.getBoundingClientRect()
    targetX.current = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    targetY.current = ((e.clientY - rect.top) / rect.height - 0.5) * 2

    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(tick)
    }
  }, [tick])

  const handleMouseLeave = useCallback(() => {
    targetX.current = 0
    targetY.current = 0
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(tick)
    }
  }, [tick])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion.current = mq.matches

    const handler = (e: MediaQueryListEvent) => {
      reducedMotion.current = e.matches
      if (e.matches) resetTransforms()
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [resetTransforms])

  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
    }
  }, [])

  return { sectionRef, bgRef, gradientRef, subjectRef, handleMouseMove, handleMouseLeave }
}
