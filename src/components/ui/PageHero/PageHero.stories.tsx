import type { Meta, StoryObj } from '@storybook/react'
import { ArrowLeft } from 'lucide-react'
import Button from '../Button'
import { CascadeItem } from '../Cascade'
import Lead from '../Lead'
import SectionTitle, { descDelay } from '../SectionTitle'
import PageHero from './PageHero'

const meta = {
  title: 'UI/PageHero',
  component: PageHero,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PageHero>

export default meta
type Story = StoryObj<typeof meta>

export const Masthead: Story = {
  render: () => (
    <PageHero>
      <SectionTitle
        as="h1"
        mountOnly
        eyebrow="How this site handles your data"
        title="Privacy"
        eyebrowClassName="text-white"
        action={
          <Button href="#" variant="white" leftIcon={<ArrowLeft size={15} strokeWidth={2.5} aria-hidden="true" />}>
            Back to home
          </Button>
        }
      >
        <CascadeItem delayMs={descDelay(1)}>
          <Lead size="lg" className="max-w-2xl pt-8">
            The lead paragraph enters on the description's beat, after the heading's letters.
          </Lead>
        </CascadeItem>
      </SectionTitle>
    </PageHero>
  ),
}
