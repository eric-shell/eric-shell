import { describe, expect, it } from 'vitest'
import { testimonials } from '../src/data/testimonials'

// The highlighter in the Testimonials section sweeps across `highlight`, found
// by exact match in `review`. A phrase that drifts from its review (an edit to
// one but not the other) silently highlights nothing, so it is checked here.
describe('testimonials', () => {
  it.each(testimonials.filter(t => t.highlight).map(t => [t.author, t]))('%s highlight appears in the review', (_, t) => {
    expect(t.review).toContain(t.highlight)
  })
})
