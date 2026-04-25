import type { Meta, StoryObj } from '@storybook/react'
import Header from './Header'

const meta = {
  title: 'Sections/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="relative bg-white">
      <Header />
      <div className="min-h-screen p-8 text-blue-950/60">
        <p>Scroll down to see header hide-on-scroll behavior in your browser.</p>
      </div>
    </div>
  ),
}

export const OnDarkBackground: Story = {
  parameters: {
    backgrounds: { default: 'blue-950' },
  },
  render: () => (
    <div className="relative bg-blue-950">
      <Header />
      <div className="min-h-screen p-8 text-white/60">
        <p>Header displays with light text on dark background.</p>
      </div>
    </div>
  ),
}
