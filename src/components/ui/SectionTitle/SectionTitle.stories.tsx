import type { Meta, StoryObj } from '@storybook/react'
import { ArrowUpRight } from 'lucide-react'
import Button from '../Button'
import { CascadeItem } from '../Cascade'
import Container from '../Container'
import Lead from '../Lead'
import Section from '../Section'
import SectionTitle from './SectionTitle'
import { descDelay } from './descDelay'

const meta = {
  title: 'UI/SectionTitle',
  component: SectionTitle,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { title: 'Work' },
} satisfies Meta<typeof SectionTitle>

export default meta
type Story = StoryObj<typeof meta>

/** Eyebrow, then the heading's letters, then the description: the one entrance every section uses. */
export const Poster: Story = {
  render: () => (
    <Section tone="lum">
      <Container>
        <SectionTitle
          eyebrow="Selected work and projects"
          title="Work"
          eyebrowClassName="text-white"
          action={
            <Button href="#" variant="white" rightIcon={<ArrowUpRight size={15} strokeWidth={2.5} aria-hidden="true" />}>
              View work history
            </Button>
          }
        >
          <CascadeItem delayMs={descDelay(0)}>
            <Lead className="max-w-3xl pt-8">Description items share the heading's trigger, so they can never drift out of step with it.</Lead>
          </CascadeItem>
        </SectionTitle>
      </Container>
    </Section>
  ),
}

/** A document page's section head, in the left column of a `grid-split`. */
export const CompactInASplit: Story = {
  render: () => (
    <Section tone="white" rhythm="block">
      <Container className="grid-split gap-8 lg:gap-20">
        <SectionTitle size="compact" sticky eyebrow="Profile" title="About" eyebrowClassName="text-lum-deep" />
        <Lead className="max-w-3xl text-ink-soft">
          The content column. From `lg` the head beside it is sticky, so a long section keeps its label in view.
        </Lead>
      </Container>
    </Section>
  ),
}
