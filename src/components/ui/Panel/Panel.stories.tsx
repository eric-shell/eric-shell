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

const variants: Variant[] = ['darker', 'dark', 'light', 'lighter', 'primary', 'ghost', 'glass-light', 'glass-dark']

export const Default: Story = {
  args: {
    variant: 'lighter',
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

export const Dark: Story = {
  args: {
    variant: 'dark',
    children: 'Dark variant panel',
    className: 'p-8 rounded-lg',
  },
}

export const Glass: Story = {
  parameters: {
    backgrounds: { default: 'off-black' },
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
    <Panel variant="lighter" className="p-6 rounded-xl max-w-md flex flex-col gap-3">
      <h3 className="font-sans font-semibold text-off-black">Panel with real content</h3>
      <p className="font-sans text-sm text-off-black/60 leading-snug">
        Panels are simple surface containers. They don't impose layout — you compose padding,
        typography, and children to shape the card.
      </p>
    </Panel>
  ),
}

export const Nested: Story = {
  parameters: {
    controls: { disable: true },
    layout: 'padded',
  },
  render: () => (
    <Panel variant="light" className="p-6 rounded-xl max-w-md flex flex-col gap-4">
      <span className="font-sans text-sm font-semibold">Outer panel (light)</span>
      <Panel variant="lighter" className="p-4 rounded-lg">
        <span className="font-sans text-xs text-off-black/60">Nested panel (lighter)</span>
      </Panel>
      <Panel variant="dark" className="p-4 rounded-lg">
        <span className="font-sans text-xs text-white/80">Nested panel (dark)</span>
      </Panel>
    </Panel>
  ),
}
