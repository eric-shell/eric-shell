import { useState } from 'react'
import { fn } from 'storybook/test'
import type { Meta, StoryObj } from '@storybook/react'
import { Tag } from 'lucide-react'
import Pill from './Pill'

const meta = {
  title: 'UI/Pill',
  component: Pill,
  tags: ['autodocs'],
} satisfies Meta<typeof Pill>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'React',
  },
}

export const Active: Story = {
  args: {
    children: 'Active Pill',
    active: true,
  },
}

export const Clickable: Story = {
  args: {
    children: 'Click me',
    onClick: fn(),
  },
}

export const WithDismiss: Story = {
  args: {
    children: 'Dismissible',
    onDismiss: fn(),
  },
}

export const WithLeftIcon: Story = {
  args: {
    children: 'Tagged',
    leftIcon: <Tag size={12} />,
  },
}

export const WithRightIcon: Story = {
  args: {
    children: 'Icon on right',
    rightIcon: <Tag size={12} />,
  },
}

export const Interactive: Story = {
  render: function InteractivePill() {
    const [active, setActive] = useState(false)
    return (
      <div className="flex gap-4">
        <Pill active={active} onClick={() => setActive(!active)}>
          Click to toggle
        </Pill>
        <span className="text-sm text-off-black/60">Active: {active ? 'true' : 'false'}</span>
      </div>
    )
  },
}

export const Multiple: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Pill>React</Pill>
      <Pill>TypeScript</Pill>
      <Pill active>Tailwind</Pill>
      <Pill>Storybook</Pill>
    </div>
  ),
}

export const FilterBarExample: Story = {
  parameters: {
    controls: { disable: true },
    layout: 'padded',
  },
  render: function FilterBarExampleRender() {
    const tags = ['All', 'Engineering', 'Design', 'AI', 'Open Source', 'Product']
    const [active, setActive] = useState<string[]>(['Engineering'])

    const toggle = (tag: string) => {
      setActive((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      )
    }

    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Pill key={tag} active={active.includes(tag)} onClick={() => toggle(tag)}>
              {tag}
            </Pill>
          ))}
        </div>
        {active.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-mono text-off-black/60">Active filters:</span>
            {active.map((tag) => (
              <Pill key={tag} active onDismiss={() => toggle(tag)}>
                {tag}
              </Pill>
            ))}
          </div>
        )}
      </div>
    )
  },
}
