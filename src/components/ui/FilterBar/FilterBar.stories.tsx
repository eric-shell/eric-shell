import type { Meta, StoryObj } from '@storybook/react'
import { useTagFilter } from '@/hooks'
import Section from '../Section'
import Container from '../Container'
import FilterBar from './FilterBar'

type Sort = 'newest' | 'oldest'

const SORTS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
]
const TAGS = ['Accessibility', 'CSS', 'Performance', 'React', 'Telemetry'].map(tag => ({ value: tag, label: tag }))

const meta = {
  title: 'UI/FilterBar',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function Demo() {
  const { sort, setSort, tags, setTags, reset, canReset } = useTagFilter<Sort>({ section: 'notes', defaultSort: 'newest' })
  return (
    <Section tone="lum" rhythm="block" className="min-h-[60vh]">
      <Container>
        <FilterBar
          sortOptions={SORTS}
          sort={sort}
          onSortChange={setSort}
          tagOptions={TAGS}
          tags={tags}
          onTagsChange={setTags}
          canReset={canReset}
          onReset={reset}
          status={tags.length ? `${tags.length} of 5 tags` : '5 tags'}
        />
      </Container>
    </Section>
  )
}

/** Sort, tag filter, an announced count, and Reset, with `useTagFilter` holding the state. */
export const OnALumField: Story = { render: () => <Demo /> }
