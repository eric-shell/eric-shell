import { useState } from 'react'
import { fn } from 'storybook/test'
import type { Meta, StoryObj } from '@storybook/react'
import Input from './Input'

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    label: 'Label',
    onChange: fn(),
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'you@example.com',
    onChange: fn(),
  },
}

export const Valid: Story = {
  args: {
    label: 'Full Name',
    value: 'Jane Smith',
    valid: true,
    onChange: fn(),
  },
}

export const Invalid: Story = {
  args: {
    label: 'Email Address',
    value: '',
    valid: false,
    onChange: fn(),
  },
}

export const WithCharacterCount: Story = {
  args: {
    label: 'Bio',
    value: 'Some text here',
    maxLength: 100,
    showCount: true,
    onChange: fn(),
  },
}

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    disabled: true,
    onChange: fn(),
  },
}

export const Interactive: Story = {
  render: function InteractiveInput() {
    const [value, setValue] = useState('')
    return (
      <div className="w-full max-w-md">
        <Input
          label="Type something"
          value={value}
          onChange={setValue}
          placeholder="Start typing..."
          maxLength={50}
        />
      </div>
    )
  },
}
