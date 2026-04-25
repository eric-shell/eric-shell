import './index.css'
import { Header, Footer } from './components/layout'
import { Hero, Work, Testimonials, Visuals, Contact } from './components/sections'
import { Toaster } from './components/ui'
import { useTitleCycle } from './hooks'

export default function App() {
  useTitleCycle()

  return (
    <div>
      <Header />
      <Hero />
      <Work />
      <Testimonials />
      <Visuals />
      <Contact />
      <Footer />
      <Toaster />
    </div>
  )
}
