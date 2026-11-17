import type { Meta, StoryObj } from '@storybook/react'
import { ArrowUpRight, Briefcase, ChevronDown, MessagesSquare, Plus } from 'lucide-react'
import Button from './Button'
import type { Variant, Size } from '../variants'

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Button',
    variant: 'luminous',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

const sizes: Size[] = ['sm', 'md', 'lg']

/**
 * Which variant goes on which field. A variant is right on one kind of field
 * and wrong on another, which is why `variant` has no default.
 */
const FIELDS: { label: string; field: string; variants: Variant[] }[] = [
  { label: 'on white', field: 'bg-white', variants: ['luminous', 'outline', 'success', 'error'] },
  { label: 'on a lum field', field: 'bg-lum focus-on-field', variants: ['white', 'tint-white', 'tint-ink'] },
  { label: 'on an ink field', field: 'bg-ink focus-on-field', variants: ['luminous', 'white', 'tint-ink', 'raised-dark', 'success', 'error'] },
]

const Row = ({ children }: { children: React.ReactNode }) => (
  <span className="w-8 font-mono text-xs uppercase text-ink-mute">{children}</span>
)

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'luminous',
    size: 'md',
    shape: 'pill',
  },
}

export const VariantsByField: Story = {
  parameters: { controls: { disable: true }, layout: 'padded' },
  render: () => (
    <div className="flex flex-col gap-6">
      {FIELDS.map(({ label, field, variants }) => (
        <div key={label} className="flex flex-col gap-2">
          <p className="font-sans text-xs font-bold uppercase tracking-label text-ink-mute">{label}</p>
          <div className={`flex flex-wrap gap-3 rounded-xl border border-ink/10 p-4 ${field}`}>
            {variants.map(variant => (
              <Button
                key={variant}
                variant={variant}
                rightIcon={<ArrowUpRight size={14} strokeWidth={2.5} />}
              >
                {variant}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
}

/**
 * Solid fills drop the inset hairline ring at `shape="square"`: at a tight
 * circular radius it wraps the full perimeter and reads as a halo rather than
 * an edge. Hover to compare against the pill row.
 */
export const SquareSolidFills: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-3 rounded-xl bg-ink p-4 focus-on-field">
      {(['pill', 'square'] as const).map(shape => (
        <div key={shape} className="flex flex-wrap gap-3">
          {(['luminous', 'success', 'error'] as Variant[]).map(variant => (
            <Button key={variant} variant={variant} shape={shape} aria-label={variant}>
              {shape === 'square' ? <Briefcase size={16} strokeWidth={2.5} /> : variant}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-4">
      {sizes.map(size => (
        <Button key={size} size={size} variant="luminous">
          {size}
        </Button>
      ))}
    </div>
  ),
}

export const Square: Story = {
  args: {
    variant: 'outline',
    size: 'md',
    shape: 'square',
    children: <Briefcase size={16} strokeWidth={2.5} />,
  },
}

export const WithLeftIcon: Story = {
  args: {
    children: 'Learn More',
    leftIcon: <ArrowUpRight size={14} strokeWidth={2.5} />,
  },
}

export const WithRightIcon: Story = {
  args: {
    children: 'Visit Site',
    rightIcon: <ArrowUpRight size={14} strokeWidth={2.5} />,
  },
}

export const IconSlab: Story = {
  parameters: { controls: { disable: true }, layout: 'padded' },
  render: () => (
    <div className="flex flex-col gap-6">
      {sizes.map(size => (
        <div key={size} className="flex items-center gap-4">
          <Row>{size}</Row>
          <Button variant="luminous" size={size} leftIcon={<Briefcase size={14} strokeWidth={2.5} />}>
            Left icon
          </Button>
          <Button variant="luminous" size={size} rightIcon={<ArrowUpRight size={14} strokeWidth={2.5} />}>
            Right icon
          </Button>
          <Button
            variant="outline"
            size={size}
            leftIcon={<Briefcase size={14} strokeWidth={2.5} />}
            rightIcon={<ArrowUpRight size={14} strokeWidth={2.5} />}
          >
            Both
          </Button>
          <Button variant="outline" size={size} leftIcon={<Briefcase size={14} strokeWidth={2.5} />} iconSlab={false}>
            No slab
          </Button>
        </div>
      ))}
    </div>
  ),
}

/**
 * Light geometric glyphs get a 1.25x optical bump so they hold the same visual
 * weight as dense pictograms in the slab. Compare the rows: the arrow, chevron
 * and plus render larger than the briefcase and chat marks, but read the same.
 */
export const OpticalIconSizing: Story = {
  parameters: { controls: { disable: true }, layout: 'padded' },
  render: () => (
    <div className="flex flex-col gap-6">
      {sizes.map(size => (
        <div key={size} className="flex flex-wrap items-center gap-4">
          <Row>{size}</Row>
          <Button variant="luminous" size={size} leftIcon={<ArrowUpRight strokeWidth={2.5} />}>Arrow</Button>
          <Button variant="luminous" size={size} leftIcon={<ChevronDown strokeWidth={2.5} />}>Chevron</Button>
          <Button variant="luminous" size={size} leftIcon={<Plus strokeWidth={2.5} />}>Plus</Button>
          <Button variant="luminous" size={size} leftIcon={<Briefcase strokeWidth={2.5} />}>Briefcase</Button>
          <Button variant="luminous" size={size} leftIcon={<MessagesSquare strokeWidth={2.5} />}>Messages</Button>
        </div>
      ))}
    </div>
  ),
}

export const AsAnchor: Story = {
  args: {
    href: 'https://example.com',
    children: 'External Link',
  },
}

/** `as="span"`: the button's look on a non-interactive element, for inside a whole-card link. */
export const AsSpan: Story = {
  args: {
    as: 'span',
    size: 'sm',
    children: 'Read the note',
    rightIcon: <ArrowUpRight size={14} strokeWidth={2.5} />,
  },
}

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
}

export const SizeShapeMatrix: Story = {
  parameters: { controls: { disable: true }, layout: 'padded' },
  render: () => (
    <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-4">
      <span />
      <Row>pill</Row>
      <Row>square</Row>

      {sizes.map(size => (
        <div key={size} className="contents">
          <Row>{size}</Row>
          <div>
            <Button variant="luminous" size={size} shape="pill">{size}</Button>
          </div>
          <div>
            <Button variant="luminous" size={size} shape="square" aria-label={size}>
              <Briefcase size={size === 'sm' ? 12 : size === 'md' ? 16 : 20} strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  ),
}
