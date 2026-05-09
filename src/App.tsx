import { useEffect } from 'react'
import './index.css'
import { Header, Footer } from './components/layout'
import { Hero, Work, Testimonials, Visuals, Contact, Resume, Privacy } from './components/sections'
import { Toaster } from './components/ui'
import { useTitleCycle } from './hooks'

type Route = 'home' | 'resume' | 'privacy'

function getRoute(): Route {
  if (typeof window === 'undefined') return 'home'
  switch (window.location.pathname) {
    case '/resume':  return 'resume'
    case '/privacy': return 'privacy'
    default:         return 'home'
  }
}

export default function App() {
  useTitleCycle()

  const route = getRoute()

  useEffect(() => {
    if (route !== 'home') return
    const hash = window.location.hash.slice(1)
    if (!hash) return
    requestAnimationFrame(() => {
      const el = document.getElementById(hash)
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    })
  }, [route])

  return (
    <div>
      <Header />
      {route === 'resume' ? (
        <Resume />
      ) : route === 'privacy' ? (
        <Privacy />
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
