import { lazy, Suspense, useEffect } from 'react'
import './index.css'
import { Header, Footer } from './components/layout'
import { Hero, Work, Testimonials, Visuals, Contact } from './components/sections'
import { Button, ErrorBoundary, Toaster } from './components/ui'
import { useTitleCycle } from './hooks'

const Resume = lazy(() => import('./components/sections/Resume'))
const Privacy = lazy(() => import('./components/sections/Privacy'))
const Notes = lazy(() => import('./components/sections/Notes'))
// Imported past the barrel on purpose — Notes/index.ts exports only the index
// page, so the list and the article stay in separate chunks.
const Note = lazy(() => import('./components/sections/Notes/Note'))

type Route =
  | { kind: 'home' }
  | { kind: 'resume' }
  | { kind: 'privacy' }
  | { kind: 'notes' }
  | { kind: 'note'; slug: string }

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

/**
 * A note slug, with an optional `.html`. Deliberately narrow: the generated
 * documents are all `[a-z0-9-]`, and anything else reaching this pattern is a
 * hand-typed URL that should fall through to the home route rather than be
 * handed to `noteBySlug` as a lookup key.
 */
const NOTE_PATH = /^\/notes\/([a-z0-9-]+)(?:\.html)?$/

function getRoute(): Route {
  if (typeof window === 'undefined') return { kind: 'home' }
  const path = window.location.pathname
  // The `.html` forms are matched too. Each route is a real document
  // (resume.html / privacy.html / notes.html / notes/<slug>.html), and Vercel
  // will serve those paths directly as static files — so without this,
  // /resume.html would render the HOME sections underneath the resume's title
  // and canonical. The rewrites in vercel.json are what visitors follow; this
  // is what makes the direct path agree with the document it was served from.
  switch (path) {
    case '/resume':
    case '/resume.html':  return { kind: 'resume' }
    case '/privacy':
    case '/privacy.html': return { kind: 'privacy' }
    case '/notes':
    case '/notes.html':   return { kind: 'notes' }
  }
  const note = NOTE_PATH.exec(path)
  if (note) return { kind: 'note', slug: note[1] }
  return { kind: 'home' }
}

export default function App() {
  const route = getRoute()

  // Homepage only — the other routes are their own documents with their own
  // <title>, and cycling would overwrite it. See useTitleCycle.
  useTitleCycle(route.kind === 'home')

  useEffect(() => {
    if (route.kind !== 'home') return
    const hash = window.location.hash.slice(1)
    if (!hash) return
    requestAnimationFrame(() => {
      const el = document.getElementById(hash)
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    })
    // `route` is a fresh object each render — depending on it directly would
    // re-run this on every render rather than on an actual route change.
  }, [route.kind])

  return (
    <div>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-999 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-blue-700 focus:text-white font-sans text-sm font-semibold"
      >
        Skip to content
      </a>
      <Header />
      {route.kind === 'resume' ? (
        <Suspense fallback={null}><Resume /></Suspense>
      ) : route.kind === 'privacy' ? (
        <Suspense fallback={null}><Privacy /></Suspense>
      ) : route.kind === 'notes' ? (
        <Suspense fallback={null}><Notes /></Suspense>
      ) : route.kind === 'note' ? (
        <Suspense fallback={null}><Note slug={route.slug} /></Suspense>
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
