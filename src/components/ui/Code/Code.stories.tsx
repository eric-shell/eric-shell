import type { Meta, StoryObj } from '@storybook/react'
import Code from './Code'

const meta = {
  title: 'UI/Code',
  component: Code,
  tags: ['autodocs'],
  args: { children: 'utm_source' },
} satisfies Meta<typeof Code>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const InASentence: Story = {
  render: () => (
    <p className="max-w-md font-sans text-base leading-relaxed text-ink-soft">
      If the link carried <Code>utm_source</Code> or <Code>utm_medium</Code>, those labels are stored with the visit.
    </p>
  ),
}
