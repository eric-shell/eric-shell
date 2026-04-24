import type { Meta, StoryObj } from '@storybook/react'
import { instagramPosts } from '../../../data/instagram'
import Post from './Post'

const meta = {
  title: 'UI/Post',
  component: Post,
  tags: ['autodocs'],
} satisfies Meta<typeof Post>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    post: instagramPosts[0],
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
}

export const Grid: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {instagramPosts.slice(0, 6).map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  ),
}

export const WithCaption: Story = {
  args: {
    post: {
      id: 'example',
      url: 'https://www.instagram.com/ericshell/',
      imageUrl: '/posts/AA2_8841.png',
      caption: 'A longer caption that will be visible on hover with some additional context about the photo.',
      altText: 'Photo description',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
}

export const ResponsiveGrid: Story = {
  parameters: {
    controls: { disable: true },
    layout: 'fullscreen',
  },
  render: () => (
    <div className="p-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-5xl mx-auto">
        {instagramPosts.slice(0, 6).map((post) => (
          <Post key={post.id} post={post} />
        ))}
      </div>
    </div>
  ),
}
