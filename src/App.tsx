import { lazy, Suspense, useEffect } from 'react'
import './index.css'
import { Header, Footer } from './components/layout'
import { Hero, Work, Testimonials, Visuals, Contact } from './components/sections'
import { Toaster } from './components/ui'
import { useTitleCycle } from './hooks'

const Resume = lazy(() => import('./components/sections/Resume'))
const Privacy = lazy(() => import('./components/sections/Privacy'))

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
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-999 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-blue-700 focus:text-white font-sans text-sm font-semibold"
      >
        Skip to content
      </a>
      <Header />
      {route === 'resume' ? (
        <Suspense fallback={null}><Resume /></Suspense>
      ) : route === 'privacy' ? (
        <Suspense fallback={null}><Privacy /></Suspense>
      ) : (
        <main id="main">
          <Hero />
          <Work />
          <Testimonials />
          <Visuals />
          <Contact />
        </main>
      )}
      <Footer />
      <Toaster />
    </div>
  )
}
