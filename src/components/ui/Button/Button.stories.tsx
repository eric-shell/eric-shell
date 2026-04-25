import type { Meta, StoryObj } from '@storybook/react'
import { ArrowUpRight, Briefcase } from 'lucide-react'
import Button from './Button'
import type { Variant, Size } from '../variants'

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Button',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

const variants: Variant[] = ['primary', 'ghost', 'glass-light', 'glass-dark']
const sizes: Size[] = ['sm', 'md', 'lg']

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
    shape: 'pill',
  },
}

export const AllVariants: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex flex-col gap-4">
      {variants.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex gap-4 items-center">
      {sizes.map((size) => (
        <Button key={size} size={size} variant="primary">
          {size}
        </Button>
      ))}
    </div>
  ),
}

export const Square: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    shape: 'square',
    children: <Briefcase size={16} strokeWidth={2.5} />,
  },
}

export const WithLeftIcon: Story = {
  args: {
    children: 'Learn More',
    leftIcon: <ArrowUpRight size={14} strokeWidth={2.5} />,
    variant: 'primary',
  },
}

export const WithRightIcon: Story = {
  args: {
    children: 'Visit Site',
    rightIcon: <ArrowUpRight size={14} strokeWidth={2.5} />,
  },
}

export const AsAnchor: Story = {
  args: {
    href: 'https://example.com',
    children: 'External Link',
    variant: 'primary',
  },
}

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Action',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
}

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
}

export const Glass: Story = {
  parameters: {
    backgrounds: { default: 'blue-950' },
  },
  render: () => (
    <div className="flex gap-3">
      <Button variant="glass-light">Glass Light</Button>
      <Button variant="glass-dark">Glass Dark</Button>
    </div>
  ),
}

export const SizeShapeMatrix: Story = {
  parameters: {
    controls: { disable: true },
    layout: 'padded',
  },
  render: () => (
    <div className="grid grid-cols-[auto_1fr_1fr] gap-4 items-center">
      <span />
      <span className="text-xs font-mono text-blue-950/60 uppercase">pill</span>
      <span className="text-xs font-mono text-blue-950/60 uppercase">square</span>

      {sizes.map((size) => (
        <div key={size} className="contents">
          <span className="text-xs font-mono text-blue-950/60 uppercase">{size}</span>
          <div>
            <Button size={size} shape="pill">{size}</Button>
          </div>
          <div>
            <Button size={size} shape="square">
              <Briefcase size={size === 'sm' ? 12 : size === 'md' ? 16 : 20} strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  ),
}
