import { useState } from 'react'
import { fn } from 'storybook/test'
import type { Meta, StoryObj } from '@storybook/react'
import Dropdown from './Dropdown'

const meta = {
  title: 'UI/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
} satisfies Meta<typeof Dropdown>

export default meta
type Story = StoryObj<typeof meta>

const options = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
]

export const Default: Story = {
  args: {
    options,
    onChange: fn(),
  },
}

export const WithSelection: Story = {
  args: {
    options,
    value: 'react',
    onChange: fn(),
  },
}

export const ManyOptions: Story = {
  args: {
    options: Array.from({ length: 15 }, (_, i) => ({
      value: `option-${i}`,
      label: `Option ${i + 1}`,
    })),
    onChange: fn(),
  },
}

export const CustomPlaceholder: Story = {
  args: {
    options,
    placeholder: 'Choose a framework...',
    onChange: fn(),
  },
}

export const Interactive: Story = {
  render: function InteractiveDropdown() {
    const [selected, setSelected] = useState<string | undefined>(undefined)
    return (
      <div className="space-y-4">
        <Dropdown
          options={options}
          value={selected}
          onChange={setSelected}
        />
        {selected && (
          <p className="text-sm text-off-black/60">
            Selected: <span className="font-semibold">{options.find(o => o.value === selected)?.label}</span>
          </p>
        )}
      </div>
    )
  },
}

export const InDarkTheme: Story = {
  parameters: {
    backgrounds: { default: 'off-black' },
  },
  args: {
    options,
    value: 'react',
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
}
