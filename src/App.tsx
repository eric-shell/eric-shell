import './index.css'
import { Hero, Contributions, Testimonials, Creative, Contact, Footer } from './components/sections'

export default function App() {
  return (
    <div>
      <img src="/icon.svg" alt="Eric Shell" className="fixed top-6 left-6 w-6 z-50" />
      <Hero />
      <Contributions />
      <Testimonials />
      <Creative />
      <Contact />
      <Footer />
    </div>
  )
}
