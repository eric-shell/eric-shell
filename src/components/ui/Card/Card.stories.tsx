import { useState } from 'react'
import { fn } from 'storybook/test'
import type { Meta, StoryObj } from '@storybook/react'
import Card from './Card'

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    href: 'https://example.com',
    title: 'Project Name',
    description: 'A brief description of the project and what it does.',
    tags: ['React', 'TypeScript', 'Tailwind'],
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
}

export const NoTags: Story = {
  args: {
    href: 'https://example.com',
    title: 'Project Without Tags',
    description: 'This card has no technology tags.',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
}

export const WithActiveTags: Story = {
  args: {
    href: 'https://example.com',
    title: 'Filtered Project',
    description: 'Some of these tags are active.',
    tags: ['React', 'TypeScript', 'Node.js'],
    activeTags: ['React'],
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
}

export const InteractiveTags: Story = {
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: function InteractiveCard() {
    const [activeTags, setActiveTags] = useState<string[]>([])
    const tags = ['React', 'TypeScript', 'Tailwind']

    return (
      <Card
        href="https://example.com"
        title="Interactive Card"
        description="Click tags to toggle them active."
        tags={tags}
        activeTags={activeTags}
        onTagClick={(tag) => {
          setActiveTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
          )
        }}
      />
    )
  },
}

export const LongContent: Story = {
  args: {
    href: 'https://example.com',
    title: 'A Very Long Project Title That Wraps To Multiple Lines',
    description: 'This is a much longer description that explains the project in great detail with more information about what was built and how it was accomplished.',
    tags: ['React', 'TypeScript', 'Tailwind', 'Vite'],
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
}

export const ManyTags: Story = {
  args: {
    href: 'https://example.com',
    title: 'Kitchen Sink Project',
    description: 'Testing how many tags wrap and lay out when we push the limits.',
    tags: ['React', 'TypeScript', 'Tailwind', 'Vite', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'AWS'],
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
}

export const InGrid: Story = {
  parameters: {
    controls: { disable: true },
    layout: 'padded',
  },
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
      <Card
        href="https://example.com/a"
        title="Portfolio Site"
        description="Personal portfolio built with Vite + React."
        tags={['React', 'TypeScript']}
      />
      <Card
        href="https://example.com/b"
        title="Design System"
        description="Reusable UI primitives and variant tokens."
        tags={['Storybook', 'Tailwind']}
      />
      <Card
        href="https://example.com/c"
        title="Ingest Pipeline"
        description="Streaming ETL for analytics events with backpressure handling."
        tags={['Node.js', 'Kafka']}
      />
      <Card
        href="https://example.com/d"
        title="AI Playground"
        description="Multi-model chat playground with streaming tool-use."
        tags={['Claude', 'React']}
      />
      <Card
        href="https://example.com/e"
        title="Mobile App"
        description="Cross-platform mobile app using React Native."
        tags={['React Native']}
      />
      <Card
        href="https://example.com/f"
        title="Marketing Site"
        description="SSG marketing site with MDX-driven blog."
        tags={['Astro', 'MDX']}
      />
    </div>
  ),
}
