import './index.css'
import Hero from './components/sections/Hero'
import Contributions from './components/sections/Contributions'
import Testimonials from './components/sections/Testimonials'
import Creative from './components/sections/Creative'
import Footer from './components/sections/Footer'

export default function App() {
  return (
    <div>
      <img src="/icon.svg" alt="Eric Shell" className="fixed top-6 left-6 w-6 z-50" />
      <Hero />
      <Contributions />
      <Testimonials />
      <Creative />
      <Footer />
    </div>
  )
}
