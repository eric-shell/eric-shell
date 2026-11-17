import type { Meta, StoryObj } from '@storybook/react'
import css from '../../../index.css?raw'

/**
 * The palette, radii and shadows, read out of `@theme` in src/index.css at
 * build time. Nothing here is typed in twice, so this page cannot fall behind
 * the tokens it documents.
 */
const theme = /@theme\s*\{([\s\S]*?)\n\}/.exec(css.replace(/\/\*[\s\S]*?\*\//g, ''))?.[1] ?? ''

function tokens(namespace: string): [string, string][] {
  return [...theme.matchAll(new RegExp(`--${namespace}-([a-z0-9-]+)\\s*:\\s*([^;]+);`, 'g'))].map(m => [m[1], m[2].trim()])
}

const Heading = ({ children }: { children: string }) => (
  <p className="pt-10 pb-4 font-sans text-xs font-bold uppercase tracking-label text-ink-mute">{children}</p>
)

const meta = {
  title: 'Design System/Tokens',
  parameters: { layout: 'padded', controls: { disable: true } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Colour: Story = {
  render: () => (
    <div className="font-sans">
      <Heading>Colour</Heading>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {tokens('color').map(([name, value]) => (
          <div key={name} className="overflow-hidden rounded-xl border border-ink/10">
            <div className="h-20" style={{ background: `var(--color-${name})` }} />
            <div className="p-3">
              <p className="text-sm font-semibold text-ink">{name}</p>
              <p className="font-mono text-xs text-ink-mute">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
}

export const RadiusAndShadow: Story = {
  render: () => (
    <div className="font-sans">
      <Heading>Radius</Heading>
      <div className="flex flex-wrap gap-6">
        {tokens('radius').map(([name, value]) => (
          <div key={name} className="text-center">
            <div className="h-24 w-24 border border-ink/10 bg-ice" style={{ borderRadius: `var(--radius-${name})` }} />
            <p className="pt-2 text-sm font-semibold text-ink">rounded-{name}</p>
            <p className="font-mono text-xs text-ink-mute">{value}</p>
          </div>
        ))}
      </div>
      <Heading>Shadow</Heading>
      <div className="flex flex-wrap gap-8 rounded-xl bg-lum p-8">
        {tokens('shadow').map(([name]) => (
          <div key={name} className="grid h-24 w-32 place-items-center rounded-card bg-white" style={{ boxShadow: `var(--shadow-${name})` }}>
            <p className="text-sm font-semibold text-ink">shadow-{name}</p>
          </div>
        ))}
      </div>
    </div>
  ),
}
