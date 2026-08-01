import { lazy, Suspense, useEffect } from 'react'
import './index.css'
import { Header, Footer } from './components/layout'
import { Hero, Work, Testimonials, Visuals, Contact } from './components/sections'
import { Button, ErrorBoundary, Toaster } from './components/ui'
import { useTitleCycle } from './hooks'

const Resume = lazy(() => import('./components/sections/Resume'))
const Privacy = lazy(() => import('./components/sections/Privacy'))

type Route = 'home' | 'resume' | 'privacy'

function ContactFallback() {
  return (
    <section id="contact" className="min-h-[50vh] flex items-center justify-center bg-blue-950 text-white text-center px-6">
      <div>
        <p className="font-sans text-lg mb-4">Something went wrong loading this section — but I'm still reachable.</p>
        <Button href="mailto:ericjshell@gmail.com?subject=New%20Website%20Contact" variant="primary">
          ericjshell@gmail.com
        </Button>
      </div>
    </section>
  )
}

function getRoute(): Route {
  if (typeof window === 'undefined') return 'home'
  // The `.html` forms are matched too. Each route is a real document now
  // (resume.html / privacy.html), and Vercel will serve those paths directly
  // as static files — so without this, /resume.html would render the HOME
  // sections underneath the resume's title and canonical. The rewrite in
  // vercel.json is what visitors follow; this is what makes the direct path
  // agree with the document it was served from.
  switch (window.location.pathname) {
    case '/resume':
    case '/resume.html':  return 'resume'
    case '/privacy':
    case '/privacy.html': return 'privacy'
    default:              return 'home'
  }
}

export default function App() {
  const route = getRoute()

  // Homepage only — the other routes are their own documents with their own
  // <title>, and cycling would overwrite it. See useTitleCycle.
  useTitleCycle(route === 'home')

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
          <ErrorBoundary name="Hero"><Hero /></ErrorBoundary>
          <ErrorBoundary name="Work"><Work /></ErrorBoundary>
          <ErrorBoundary name="Testimonials"><Testimonials /></ErrorBoundary>
          <ErrorBoundary name="Visuals"><Visuals /></ErrorBoundary>
          <ErrorBoundary name="Contact" fallback={<ContactFallback />}><Contact /></ErrorBoundary>
        </main>
      )}
      <Footer />
      <Toaster />
    </div>
  )
}
