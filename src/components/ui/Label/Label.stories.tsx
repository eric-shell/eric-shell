import type { Meta, StoryObj } from '@storybook/react'
import Label from './Label'

const meta = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs'],
  args: { children: 'August 22, 2026' },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Colour comes from the field. On a lum field keep it white; `text-glow` is for ink only. */
export const OnEachField: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col">
      <div className="bg-white p-6"><Label className="text-ink-mute">On white: ink-mute</Label></div>
      <div className="bg-lum p-6 text-white"><Label>On lum: white</Label></div>
      <div className="bg-ink p-6"><Label className="text-glow">On ink: glow</Label></div>
    </div>
  ),
}
