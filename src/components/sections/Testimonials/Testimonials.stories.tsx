import type { Meta, StoryObj } from '@storybook/react'
import Testimonials from './Testimonials'

const meta = {
  title: 'Sections/Testimonials',
  component: Testimonials,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Testimonials>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="bg-white py-16">
      <Testimonials />
    </div>
  ),
}

export const OnDarkBackground: Story = {
  parameters: {
    backgrounds: { default: 'blue-950' },
  },
  render: () => (
    <div className="bg-blue-950 py-16">
      <Testimonials />
    </div>
  ),
}
