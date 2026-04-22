import './index.css'
import Hero from './components/sections/Hero'
import Work from './components/sections/Work'
import Testimonials from './components/sections/Testimonials'

export default function App() {
  return (
    <div>
      <img src="/icon.svg" alt="Eric Shell" className="fixed top-6 left-6 w-6 z-50" />
      <Hero />
      <Work />
      <Testimonials />
    </div>
  )
}
