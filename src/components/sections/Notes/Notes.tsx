import type { ReactNode } from 'react'
import { ArrowUpRight, CalendarArrowDown, CalendarArrowUp, ArrowDownAZ, ArrowUpZA, FileText } from 'lucide-react'
import { notes, repoUrl } from '@/data/notes-index'
import { useTagFilter } from '@/hooks'
import { Button, Card, CascadeGroup, CascadeItem, FilterBar, Label, Lead, Page, PageHero, SectionTitle, descDelay } from '../../ui'
import { formatNoteDate } from './formatDate'

type SortOrder = 'newest' | 'oldest' | 'asc' | 'desc'

const SORT_OPTIONS: { value: SortOrder; label: string; icon: ReactNode }[] = [
  { value: 'newest', label: 'Newest first', icon: <CalendarArrowDown size={12} strokeWidth={2.5} /> },
  { value: 'oldest', label: 'Oldest first', icon: <CalendarArrowUp size={12} strokeWidth={2.5} /> },
  { value: 'asc',    label: 'Ascending',    icon: <ArrowDownAZ size={12} strokeWidth={2.5} /> },
  { value: 'desc',   label: 'Descending',   icon: <ArrowUpZA size={12} strokeWidth={2.5} /> },
]

/** Derived from the entries, alphabetical — same reasoning as Work's. */
const TAG_OPTIONS = [...new Set(notes.flatMap(note => note.tags))]
  .sort((a, b) => a.localeCompare(b))
  .map(tag => ({ value: tag, label: tag }))

/**
 * The notes index, every entry with the same filter controls as the Work grid.
 *
 * Tags are selected either by clicking them on a card or from the standing list
 * in the `MultiSelect`. The card click alone was the original model, and it left
 * the tag vocabulary undiscoverable: a reader could only filter by a tag that
 * happened to be on an entry already in view, and with 37 tags across the
 * entries most were never on screen at once. The dropdown carries the whole
 * list without spending any layout on it, which is what a standing row of every
 * tag as chips would have cost.
 *
 * Filtering is client-side and deliberately does not touch the URL. A filtered
 * view is not a page: it has no distinct title, no distinct content, and giving
 * it a crawlable address would put near-duplicate URLs in front of a crawler
 * that already has the canonical list here. The individual notes are the
 * indexable units; this page is their table of contents.
 */
export default function Notes() {
  const { sort, setSort, tags: activeTags, setTags: setActiveTags, toggleTag, reset, canReset } =
    useTagFilter<SortOrder>({ section: 'notes', defaultSort: 'newest' })

  // OR across selected tags, matching Work. AND would let two clicks produce an
  // empty grid, which reads as a broken filter rather than a narrow one.
  let visible = activeTags.length > 0
    ? notes.filter(n => activeTags.some(t => n.tags.includes(t)))
    : [...notes]
  // Sorts on the date rather than reversing the array. `notes` is already
  // date-descending, so a reverse would look right, but it would also flip the
  // hand-chosen order within each shared date instead of preserving it.
  if (sort === 'oldest') visible = visible.sort((a, b) => a.date.localeCompare(b.date))
  if (sort === 'asc') visible = visible.sort((a, b) => a.title.localeCompare(b.title))
  if (sort === 'desc') visible = visible.sort((a, b) => b.title.localeCompare(a.title))

  return (
    <Page tone="lum">
      {/* One blue field from the masthead to the footer, the way the home
          page's Work section carries its title, controls and grid on one
          sheet. This is the other filterable index on the site, and the two
          should read as one pattern. */}
      <PageHero className="pb-24 md:pb-36">
        <SectionTitle
          as="h1"
          mountOnly
          eyebrow="Logging Changes"
          title="Build Notes"
          eyebrowClassName="text-white"
          action={
            // The two places a reader goes next: the record of the work, and
            // the code every entry cites. The site's own nav already carries
            // a way home, so a "back" button here spends the primary slot on
            // the one destination nobody needs help finding.
            <div className="flex flex-wrap gap-2.5">
              <Button
                href="/resume"
                variant="white"
                leftIcon={<FileText size={15} strokeWidth={2.5} aria-hidden="true" />}
              >
                View Resume
              </Button>
              <Button
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="tint-white"
                rightIcon={<ArrowUpRight size={15} strokeWidth={2.5} aria-hidden="true" />}
              >
                View Repository
              </Button>
            </div>
          }
        >
          <CascadeItem delayMs={descDelay(1)}>
            <Lead className="max-w-3xl pt-8">
              A running changelog of engineering decisions made on this site. What changed, what it
              cost, and what I got wrong on the way. Every entry links the commit behind it.
            </Lead>
          </CascadeItem>

          <CascadeItem delayMs={descDelay(2)}>
            <FilterBar
              className="pt-12"
              sortOptions={SORT_OPTIONS}
              sort={sort}
              onSortChange={setSort}
              tagOptions={TAG_OPTIONS}
              tags={activeTags}
              onTagsChange={setActiveTags}
              canReset={canReset}
              onReset={reset}
              status={visible.length === notes.length
                ? `${notes.length} notes`
                : `${visible.length} of ${notes.length} notes`}
            />
          </CascadeItem>
        </SectionTitle>

        {/*
          Keyed on the active filter so the cascade replays when the list
          changes. Without the key, React reuses the already-revealed items
          and a filtered result set appears with no entrance at all.
        */}
        <CascadeGroup
          key={`${sort}:${activeTags.join(',')}`}
          as="ul"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-8"
          threshold={0.05}
        >
          {visible.map((note, i) => (
            <CascadeItem as="li" index={i} key={note.slug}>
              {/* The Work grid's card, with a sentence for a title: sans
                  rather than Display, and a little taller for the longer copy. */}
              <Card
                href={`/notes/${note.slug}`}
                title={note.title}
                titleAs="h2"
                description={note.summary}
                meta={<Label as="time" dateTime={note.date} className="text-ink-mute">{formatNoteDate(note.date)}</Label>}
                arrow="right"
                tags={note.tags}
                activeTags={activeTags}
                onTagClick={toggleTag}
                className="min-h-[260px]"
              />
            </CascadeItem>
          ))}
        </CascadeGroup>
      </PageHero>
    </Page>
  )
}
