import type { Meta, StoryObj } from '@storybook/react'
import Container from '../Container'
import Lead from '../Lead'
import Section from './Section'

const meta = {
  title: 'UI/Section',
  component: Section,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { tone: 'lum' },
} satisfies Meta<typeof Section>

export default meta
type Story = StoryObj<typeof meta>

/** The three fields. Tab into each: the focus ring changes colour with the field. */
export const Tones: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <>
      {(['lum', 'white', 'ink'] as const).map(tone => (
        <Section key={tone} tone={tone} rhythm="block">
          <Container>
            <Lead>
              tone="{tone}". <a href="#focus" className="underline">A link to focus.</a>
            </Lead>
          </Container>
        </Section>
      ))}
    </>
  ),
}

/** Vertical padding, base and `md:` paired. */
export const Rhythms: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <>
      {(['section', 'block', 'tight', 'none'] as const).map((rhythm, i) => (
        <Section key={rhythm} tone={i % 2 ? 'white' : 'lum'} rhythm={rhythm}>
          <Container>
            <Lead>rhythm="{rhythm}"</Lead>
          </Container>
        </Section>
      ))}
    </>
  ),
}
