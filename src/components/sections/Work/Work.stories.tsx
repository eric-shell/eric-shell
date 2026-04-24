import type { Meta, StoryObj } from '@storybook/react'
import Work from './Work'

const meta = {
  title: 'Sections/Work',
  component: Work,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Work>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="bg-white py-16">
      <Work />
    </div>
  ),
}
