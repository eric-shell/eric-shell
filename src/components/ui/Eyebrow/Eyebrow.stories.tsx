import type { Meta, StoryObj } from '@storybook/react'
import Eyebrow from './Eyebrow'
import { H2 } from '../Heading'

const meta = {
  title: 'UI/Eyebrow',
  component: Eyebrow,
  tags: ['autodocs'],
  args: {
    children: 'Eyebrow',
  },
} satisfies Meta<typeof Eyebrow>

export default meta
type Story = StoryObj<typeof meta>

export const Small: Story = {
  args: {
    children: 'Selected Work',
    size: 'sm',
  },
}

export const Large: Story = {
  args: {
    children: "What's up! My name is",
    size: 'lg',
  },
}

export const WithColor: Story = {
  args: {
    children: 'Custom Color',
    className: 'text-cyan-500',
  },
}

export const InHeadingContext: Story = {
  parameters: {
    controls: { disable: true },
    layout: 'padded',
  },
  render: () => (
    <div className="flex flex-col gap-2">
      <Eyebrow>Selected Work</Eyebrow>
      <H2>Featured Projects</H2>
    </div>
  ),
}

export const OnDarkBackground: Story = {
  parameters: {
    backgrounds: { default: 'blue-950' },
    controls: { disable: true },
  },
  render: () => (
    <div className="p-8 text-white">
      <Eyebrow>Dark Context</Eyebrow>
    </div>
  ),
}
