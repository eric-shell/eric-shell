import type { Meta, StoryObj } from '@storybook/react'
import Panel from './Panel'
import type { Variant } from '../variants'

const meta = {
  title: 'UI/Panel',
  component: Panel,
  tags: ['autodocs'],
} satisfies Meta<typeof Panel>

export default meta
type Story = StoryObj<typeof meta>

const variants: Variant[] = ['secondary', 'ghost', 'glass-light', 'glass-dark']

export const Default: Story = {
  args: {
    variant: 'secondary',
    children: 'Panel content goes here',
    className: 'p-8 rounded-lg',
  },
}

export const AllVariants: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex flex-col gap-4">
      {variants.map((variant) => (
        <Panel key={variant} variant={variant} className="p-6 rounded-lg">
          <span className="text-sm font-mono">{variant}</span>
        </Panel>
      ))}
    </div>
  ),
}

export const Glass: Story = {
  parameters: {
    backgrounds: { default: 'blue-950' },
  },
  render: () => (
    <div className="flex gap-4">
      <Panel variant="glass-light" className="p-8 rounded-lg flex-1">
        Glass Light
      </Panel>
      <Panel variant="glass-dark" className="p-8 rounded-lg flex-1">
        Glass Dark
      </Panel>
    </div>
  ),
}

export const WithContent: Story = {
  parameters: {
    controls: { disable: true },
    layout: 'padded',
  },
  render: () => (
    <Panel variant="secondary" className="p-6 rounded-xl max-w-md flex flex-col gap-3">
      <h3 className="font-sans font-semibold text-blue-950">Panel with real content</h3>
      <p className="font-sans text-sm text-blue-950/60 leading-snug">
        Panels are simple surface containers. They don't impose layout — you compose padding,
        typography, and children to shape the card.
      </p>
    </Panel>
  ),
}
