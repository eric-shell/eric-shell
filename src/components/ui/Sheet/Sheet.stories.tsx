import type { Meta, StoryObj } from '@storybook/react'
import Container from '../Container'
import Lead from '../Lead'
import PageHero from '../PageHero'
import SectionTitle from '../SectionTitle'
import Sheet from './Sheet'

const meta = {
  title: 'UI/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { tone: 'white' },
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

/** An inner route: a `PageHero`, then the white sheet rising over its foot. */
export const OverAPageHero: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <>
      <PageHero>
        <SectionTitle as="h1" mountOnly eyebrow="An inner route" title="Masthead" eyebrowClassName="text-white" />
      </PageHero>
      <Sheet tone="white" className="py-16 md:py-24">
        <Container>
          <Lead className="max-w-2xl text-ink-soft">
            The body of the page sits on this sheet. Its rounded top shows the field above in its corners.
          </Lead>
        </Container>
      </Sheet>
    </>
  ),
}

/** The home page's Work sheet: blue, widening to full bleed as it scrolls in. */
export const Widening: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <>
      <div className="h-[70vh] bg-ink" />
      <Sheet as="section" tone="lum" widen className="py-24 md:py-36">
        <Container>
          <SectionTitle eyebrow="Scroll up and down" title="Work" eyebrowClassName="text-white" />
        </Container>
      </Sheet>
    </>
  ),
}
