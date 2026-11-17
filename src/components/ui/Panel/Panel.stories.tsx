import type { Meta, StoryObj } from '@storybook/react'
import Panel from './Panel'
import type { Variant } from '../variants'

const meta = {
  title: 'UI/Panel',
  component: Panel,
  tags: ['autodocs'],
  args: { variant: 'outline' },
} satisfies Meta<typeof Panel>

export default meta
type Story = StoryObj<typeof meta>

/** Each surface on the field it is meant for. */
const FIELDS: { label: string; field: string; variants: Variant[] }[] = [
  { label: 'on white', field: 'bg-white', variants: ['outline', 'luminous'] },
  { label: 'on a lum field', field: 'bg-lum', variants: ['white', 'tint-white', 'tint-ink'] },
  { label: 'on an ink field', field: 'bg-ink', variants: ['raised-dark', 'notice-info', 'notice-success', 'notice-error'] },
]

export const Default: Story = {
  args: {
    variant: 'outline',
    children: 'Panel content goes here',
    className: 'p-8 rounded-card',
  },
}

export const VariantsByField: Story = {
  parameters: { controls: { disable: true }, layout: 'padded' },
  render: () => (
    <div className="flex flex-col gap-6">
      {FIELDS.map(({ label, field, variants }) => (
        <div key={label} className="flex flex-col gap-2">
          <p className="font-sans text-xs font-bold uppercase tracking-label text-ink-mute">{label}</p>
          <div className={`grid grid-cols-2 gap-4 rounded-xl border border-ink/10 p-4 md:grid-cols-4 ${field}`}>
            {variants.map(variant => (
              <Panel key={variant} variant={variant} className="rounded-card p-6">
                <span className="font-mono text-sm">{variant}</span>
              </Panel>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
}

export const WithContent: Story = {
  parameters: { controls: { disable: true }, layout: 'padded' },
  render: () => (
    <Panel variant="outline" className="flex max-w-md flex-col gap-3 rounded-card p-6">
      <h3 className="font-sans font-semibold text-ink">Panel with real content</h3>
      <p className="font-sans text-sm leading-snug text-ink-soft">
        Panels are simple surface containers. They don't impose layout: you compose padding,
        typography, and children to shape the card.
      </p>
    </Panel>
  ),
}
