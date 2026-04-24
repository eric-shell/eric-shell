import './index.css'
import { Header, Hero, Work, Testimonials, Visuals, Contact, Footer } from './components/sections'
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
    </div>
  )
}
