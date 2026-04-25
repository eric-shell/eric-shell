import './index.css'
import { Header, Footer } from './components/layout'
import { Hero, Work, Testimonials, Visuals, Contact, Resume } from './components/sections'
import { Toaster } from './components/ui'
import { useTitleCycle } from './hooks'

export default function App() {
  useTitleCycle()

  const isResume = typeof window !== 'undefined' && window.location.pathname === '/resume'

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
