import type { Meta, StoryObj } from '@storybook/react'
import Backdrop from './Backdrop'

const meta = {
  title: 'UI/Backdrop',
  component: Backdrop,
  tags: ['autodocs'],
} satisfies Meta<typeof Backdrop>

export default meta
type Story = StoryObj<typeof meta>

export const Light: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="relative h-96 bg-gradient-to-br from-white to-blue-50 overflow-hidden">
      <Backdrop tone="light" />
      <p className="relative z-10 p-8 font-sans text-blue-950">Light tone — drifting blobs + grain</p>
    </div>
  ),
}

export const LightFlipped: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="relative h-96 bg-gradient-to-br from-white to-blue-100 overflow-hidden">
      <Backdrop tone="light" flip />
      <p className="relative z-10 p-8 font-sans text-blue-950">Light tone, mirrored — for adjacent sections</p>
    </div>
  ),
}

export const Dark: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="relative h-96 bg-gradient-to-br from-blue-950 to-blue-900 overflow-hidden">
      <Backdrop tone="dark" />
      <p className="relative z-10 p-8 font-sans text-white">Dark tone — indigo/violet/cyan blobs + grain</p>
    </div>
  ),
}

export const Photo: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="relative h-96 bg-gradient-to-br from-blue-800 to-blue-950 overflow-hidden">
      <Backdrop tone="photo" />
      <p className="relative z-10 p-8 font-sans text-white">Photo tone — film grain only, no blobs</p>
    </div>
  ),
}
