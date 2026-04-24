import type { Meta, StoryObj } from '@storybook/react'
import { H1, H2, H3 } from './Heading'

const meta = {
  title: 'UI/Heading',
  component: H1,
  tags: ['autodocs'],
  args: {
    children: 'Heading',
  },
} satisfies Meta<typeof H1>

export default meta
type Story = StoryObj<typeof meta>

export const H1Heading: Story = {
  args: {
    children: 'Display Heading Level 1',
  },
}

export const H2Heading: Story = {
  args: {
    children: 'Display Heading Level 2',
  },
  render: (args) => <H2 {...args} />,
}

export const H3Heading: Story = {
  args: {
    children: 'Display Heading Level 3',
  },
  render: (args) => <H3 {...args} />,
}

export const AllLevels: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex flex-col gap-12">
      <div>
        <H1>H1 Heading</H1>
      </div>
      <div>
        <H2>H2 Heading</H2>
      </div>
      <div>
        <H3>H3 Heading</H3>
      </div>
    </div>
  ),
}

export const Hierarchy: Story = {
  parameters: {
    controls: { disable: true },
    layout: 'padded',
  },
  render: () => (
    <article className="flex flex-col gap-8 max-w-3xl">
      <H1>Hello, I'm Eric</H1>
      <H2>What I've Been Building</H2>
      <H3>Sub-section heading</H3>
    </article>
  ),
}
