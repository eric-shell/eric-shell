import { useState } from 'react'
import { fn } from 'storybook/test'
import type { Meta, StoryObj } from '@storybook/react'
import Chat from './Chat'

const meta = {
  title: 'UI/Chat',
  component: Chat,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'blue-950' },
  },
  args: {
    value: '',
    onChange: fn(),
    onSubmit: fn(),
  },
} satisfies Meta<typeof Chat>

export default meta
type Story = StoryObj<typeof meta>

const decorators = [
  (Story: any) => (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-950/80 to-black flex items-center justify-end p-8">
      <div className="w-[480px]">
        <Story />
      </div>
    </div>
  ),
]

export const Open: Story = {
  args: {
    value: '',
    onChange: fn(),
    onSubmit: fn(),
    placeholder: 'Ask me anything…',
  },
  decorators,
}

export const WithContent: Story = {
  args: {
    value: 'What technologies do you use?',
    onChange: fn(),
    onSubmit: fn(),
  },
  decorators,
}

export const WithChildren: Story = {
  args: {
    value: '',
    onChange: fn(),
    onSubmit: fn(),
  },
  decorators,
  render: (args) => (
    <Chat {...args}>
      <p className="text-white/80 text-sm">
        Hello! You can ask me anything about my work, projects, or background. I'll do my best to help!
      </p>
    </Chat>
  ),
}

export const Interactive: Story = {
  decorators,
  render: function InteractiveChat() {
    const [value, setValue] = useState('')
    const [submitted, setSubmitted] = useState(false)

    return (
      <>
        <Chat
          value={value}
          onChange={setValue}
          onSubmit={() => {
            setSubmitted(true)
            setValue('')
            setTimeout(() => setSubmitted(false), 2000)
          }}
        />
        {submitted && (
          <div className="fixed bottom-8 left-8 bg-blue-50 text-blue-950 px-4 py-2 rounded-lg text-sm font-semibold">
            Message sent!
          </div>
        )}
      </>
    )
  },
}

/**
 * When the Chat panel is dismissed, it portals a floating "Start a Chat"
 * trigger to `document.body`. In Storybook, that button appears in the
 * Storybook UI body rather than inside the story canvas — click it to
 * re-open the panel, which will also render outside the canvas frame.
 */
export const Closed: Story = {
  decorators,
  render: function ClosedChat() {
    const [value, setValue] = useState('')
    return (
      <div className="flex flex-col gap-4 text-white/80">
        <p className="font-sans text-sm">
          Trigger the closed state by clicking the X on the open panel. The floating
          "Start a Chat" trigger is portaled to document.body.
        </p>
        <Chat value={value} onChange={setValue} onSubmit={fn()} />
      </div>
    )
  },
}
