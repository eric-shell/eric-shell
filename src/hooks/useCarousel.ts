import { useCallback, useEffect, useRef, useState } from 'react'

interface Options {
  length: number
  intervalMs?: number
  fadeMs?: number
  initialIndex?: number
  autoPlay?: boolean
}

export function useCarousel({
  length,
  intervalMs = 6000,
  fadeMs = 250,
  initialIndex = 0,
  autoPlay = true,
}: Options) {
  const [index, setIndex] = useState(initialIndex)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [visible, setVisible] = useState(true)
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const indexRef = useRef(index)

  useEffect(() => { indexRef.current = index }, [index])

  const goTo = useCallback((target: number) => {
    if (fadeTimer.current) clearTimeout(fadeTimer.current)
    setVisible(false)
    fadeTimer.current = setTimeout(() => {
      setIndex(((target % length) + length) % length)
      setVisible(true)
    }, fadeMs)
  }, [length, fadeMs])

  const next = useCallback(() => goTo(indexRef.current + 1), [goTo])
  const prev = useCallback(() => goTo(indexRef.current - 1), [goTo])

  useEffect(() => {
    if (!isPlaying) return
    const id = setInterval(() => goTo(indexRef.current + 1), intervalMs)
    return () => clearInterval(id)
  }, [isPlaying, goTo, intervalMs])

  useEffect(() => {
    return () => { if (fadeTimer.current) clearTimeout(fadeTimer.current) }
  }, [])

  const togglePlaying = useCallback(() => setIsPlaying(p => !p), [])

  return { index, visible, isPlaying, next, prev, goTo, togglePlaying }
}
