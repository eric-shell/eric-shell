export { default as Hero } from './Hero'
export { default as Work } from './Work'
export { default as Testimonials } from './Testimonials'
export { default as Visuals } from './Visuals'
export { default as Contact } from './Contact'
// Resume and Privacy are route-split — App.tsx lazy-imports them directly.
// Exporting them here would pull them back into the main chunk.
