import './index.css'
import { Header, Hero, Contributions, Testimonials, Creative, Contact, Footer } from './components/sections'
import { useTitleCycle } from './hooks'

export default function App() {
  useTitleCycle()

  return (
    <div>
      <Header />
      <Hero />
      <Contributions />
      <Testimonials />
      <Creative />
      <Contact />
      <Footer />
    </div>
  )
}
