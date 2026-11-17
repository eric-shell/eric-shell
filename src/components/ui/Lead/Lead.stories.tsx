import type { Meta, StoryObj } from '@storybook/react'
import Lead from './Lead'

const meta = {
  title: 'UI/Lead',
  component: Lead,
  tags: ['autodocs'],
  args: { children: 'A running changelog of engineering decisions made on this site.', className: 'max-w-xl' },
} satisfies Meta<typeof Lead>

export default meta
type Story = StoryObj<typeof meta>

export const Medium: Story = { args: { size: 'md' } }
export const Large: Story = { args: { size: 'lg' } }
