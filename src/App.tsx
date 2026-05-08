import { useEffect } from 'react'
import './index.css'
import { Header, Footer } from './components/layout'
import { Hero, Work, Testimonials, Visuals, Contact, Resume } from './components/sections'
import { Toaster } from './components/ui'
import { useTitleCycle } from './hooks'

export default function App() {
  useTitleCycle()

  const isResume = typeof window !== 'undefined' && window.location.pathname === '/resume'

  useEffect(() => {
    if (isResume) return
    const hash = window.location.hash.slice(1)
    if (!hash) return
    requestAnimationFrame(() => {
      const el = document.getElementById(hash)
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    })
  }, [])

  return (
    <div>
      <Header />
      {isResume ? (
        <Resume />
      ) : (
        <>
          <Hero />
          <Work />
          <Testimonials />
          <Visuals />
          <Contact />
        </>
      )}
      <Footer />
      <Toaster />
    </div>
  )
}
