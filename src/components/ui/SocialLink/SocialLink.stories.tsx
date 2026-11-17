import type { Meta, StoryObj } from '@storybook/react'
import { socialLinks } from '@/data'
import SocialLink from './SocialLink'

const meta = {
  title: 'UI/SocialLink',
  component: SocialLink,
  tags: ['autodocs'],
  args: { tone: 'ink', href: '#', label: socialLinks[0].label, path: socialLinks[0].path },
} satisfies Meta<typeof SocialLink>

export default meta
type Story = StoryObj<typeof meta>

export const BothTones: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col">
      {(['lum', 'ink'] as const).map(tone => (
        <div key={tone} className={`flex gap-2.5 p-6 focus-on-field ${tone === 'lum' ? 'bg-lum' : 'bg-ink'}`}>
          {socialLinks.map(({ label, href, path }) => (
            <SocialLink key={label} tone={tone} href={href} label={label} path={path} />
          ))}
        </div>
      ))}
    </div>
  ),
}
