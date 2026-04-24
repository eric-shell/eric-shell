import type { Meta, StoryObj } from '@storybook/react'
import Visuals from './Visuals'

const meta = {
  title: 'Sections/Visuals',
  component: Visuals,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Visuals>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="bg-white py-16">
      <Visuals />
    </div>
  ),
}
