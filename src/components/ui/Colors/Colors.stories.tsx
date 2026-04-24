import type { Meta, StoryObj } from '@storybook/react'

type Swatch = {
  name: string
  className: string
  textClassName: string
  oklch: string
}

const blueScale: Swatch[] = [
  { name: 'blue-50',  className: 'bg-blue-50',  textClassName: 'text-blue-950', oklch: 'oklch(0.954 0.013 221.34)' },
  { name: 'blue-100', className: 'bg-blue-100', textClassName: 'text-blue-950', oklch: 'oklch(0.911 0.026 221.55)' },
  { name: 'blue-200', className: 'bg-blue-200', textClassName: 'text-blue-950', oklch: 'oklch(0.842 0.052 224.00)' },
  { name: 'blue-300', className: 'bg-blue-300', textClassName: 'text-blue-950', oklch: 'oklch(0.770 0.065 226.00)' },
  { name: 'blue-400', className: 'bg-blue-400', textClassName: 'text-blue-950', oklch: 'oklch(0.685 0.078 229.00)' },
  { name: 'blue-500', className: 'bg-blue-500', textClassName: 'text-white',    oklch: 'oklch(0.595 0.086 230.50)' },
  { name: 'blue-600', className: 'bg-blue-600', textClassName: 'text-white',    oklch: 'oklch(0.546 0.091 231.50)' },
  { name: 'blue-700', className: 'bg-blue-700', textClassName: 'text-white',    oklch: 'oklch(0.497 0.093 232.07)' },
  { name: 'blue-800', className: 'bg-blue-800', textClassName: 'text-white',    oklch: 'oklch(0.390 0.070 245.00)' },
  { name: 'blue-900', className: 'bg-blue-900', textClassName: 'text-white',    oklch: 'oklch(0.280 0.045 260.00)' },
  { name: 'blue-950', className: 'bg-blue-950', textClassName: 'text-white',    oklch: 'oklch(0.198 0.025 269.84)' },
]

const neutrals: Swatch[] = [
  { name: 'white', className: 'bg-white', textClassName: 'text-blue-950', oklch: '#ffffff' },
  { name: 'black', className: 'bg-black', textClassName: 'text-white',    oklch: '#030407' },
]

const Swatch = ({ swatch }: { swatch: Swatch }) => (
  <div className={`${swatch.className} ${swatch.textClassName} rounded-lg p-4 flex flex-col gap-1 border border-blue-950/10 min-h-28`}>
    <span className="font-mono text-sm font-semibold">{swatch.name}</span>
    <span className="font-mono text-xs opacity-70">{swatch.oklch}</span>
    <span className="font-mono text-[10px] opacity-60 mt-auto">bg-{swatch.name}</span>
  </div>
)

const meta = {
  title: 'Design System/Colors',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const BlueScale: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-5xl">
      <div>
        <h2 className="font-sans text-lg font-semibold text-blue-950 mb-1">Blue scale</h2>
        <p className="font-sans text-sm text-blue-950/60 mb-4">
          50 → 950. Anchors at 50 (<code>#e7f2f6</code>), 700 (<code>#196b8e</code>), and 950 (<code>#111521</code>).
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {blueScale.map((s) => <Swatch key={s.name} swatch={s} />)}
        </div>
      </div>

      <div>
        <h2 className="font-sans text-lg font-semibold text-blue-950 mb-1">Neutrals</h2>
        <p className="font-sans text-sm text-blue-950/60 mb-4">Generic neutrals, not part of the blue scale.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {neutrals.map((s) => <Swatch key={s.name} swatch={s} />)}
        </div>
      </div>
    </div>
  ),
}

export const Strip: Story = {
  render: () => (
    <div className="flex w-full max-w-5xl rounded-lg overflow-hidden border border-blue-950/10">
      {blueScale.map((s) => (
        <div
          key={s.name}
          className={`${s.className} ${s.textClassName} flex-1 h-24 flex items-end justify-center p-2`}
        >
          <span className="font-mono text-[10px] font-semibold">{s.name.replace('blue-', '')}</span>
        </div>
      ))}
    </div>
  ),
}
