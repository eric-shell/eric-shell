import type { Meta, StoryObj } from '@storybook/react'
import Hero from './Hero'

const meta = {
  title: 'Sections/Hero',
  component: Hero,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Hero>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Hero />,
}
