import type { Meta, StoryObj } from '@storybook/react'
import Contact from './Contact'

const originalFetch = window.fetch

const meta = {
  title: 'Sections/Contact',
  component: Contact,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => {
      window.fetch = async (input, init) => {
        if (typeof input === 'string' && input.includes('/api/contact')) {
          return new Response(JSON.stringify({ ok: true, message: 'Contact submitted' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return originalFetch(input, init)
      }
      return <Story />
    },
  ],
} satisfies Meta<typeof Contact>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="bg-white py-16">
      <Contact />
    </div>
  ),
}

export const OnDarkBackground: Story = {
  parameters: {
    backgrounds: { default: 'off-black' },
  },
  render: () => (
    <div className="bg-off-black py-16">
      <Contact />
    </div>
  ),
}
