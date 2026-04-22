import { createContext, useContext } from 'react'

interface CascadeContextValue {
  inView: boolean
  stagger: number
}

export const CascadeContext = createContext<CascadeContextValue>({ inView: false, stagger: 75 })

export const useCascade = () => useContext(CascadeContext)
