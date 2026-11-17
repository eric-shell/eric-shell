import type { Meta, StoryObj } from '@storybook/react'
import TextLink from './TextLink'

const meta = {
  title: 'UI/TextLink',
  component: TextLink,
  tags: ['autodocs'],
  args: { href: '#', children: 'a link in a sentence' },
} satisfies Meta<typeof TextLink>

export default meta
type Story = StoryObj<typeof meta>

export const Tones: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col font-sans">
      <p className="bg-white p-6 text-ink-soft">On white, <TextLink href="#">tone="lum"</TextLink> in body copy.</p>
      <p className="bg-lum p-6 text-white focus-on-field">On a field, <TextLink tone="field" href="#">tone="field"</TextLink> takes the field's text colour.</p>
      <p className="bg-white p-6 text-xs text-ink-mute">In small print, <TextLink tone="inherit" href="#">tone="inherit"</TextLink> stays as quiet as its sentence.</p>
    </div>
  ),
}
