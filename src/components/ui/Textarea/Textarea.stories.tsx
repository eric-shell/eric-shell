import { useState } from 'react'
import { fn } from 'storybook/test'
import type { Meta, StoryObj } from '@storybook/react'
import Textarea from './Textarea'

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  args: {
    label: 'Label',
    onChange: fn(),
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Message',
    placeholder: 'Type your message here...',
    onChange: fn(),
  },
}

export const Valid: Story = {
  args: {
    label: 'Feedback',
    value: 'This is great feedback!',
    valid: true,
    onChange: fn(),
  },
}

export const Invalid: Story = {
  args: {
    label: 'Comment',
    value: '',
    valid: false,
    onChange: fn(),
  },
}

export const WithCharacterCount: Story = {
  args: {
    label: 'Bio',
    value: 'Some text here',
    maxLength: 500,
    showCount: true,
    onChange: fn(),
  },
}

export const Disabled: Story = {
  args: {
    label: 'Disabled Textarea',
    disabled: true,
    onChange: fn(),
  },
}

export const Interactive: Story = {
  render: function InteractiveTextarea() {
    const [value, setValue] = useState('')
    return (
      <div className="w-full max-w-2xl">
        <Textarea
          label="Share your thoughts"
          value={value}
          onChange={setValue}
          placeholder="Write here..."
          maxLength={1000}
          rows={8}
        />
      </div>
    )
  },
}
