import { useState } from 'react'
import { ArrowRight, ArrowUpRight, CalendarArrowDown, CalendarArrowUp, ArrowDownAZ, ArrowUpZA, FileText, RotateCcw } from 'lucide-react'
import { notes, repoUrl } from '@/data/notes'
import { Backdrop, Button, CascadeGroup, CascadeItem, Container, Dropdown, Eyebrow, H1, MultiSelect, Panel, Pill } from '../../ui'
import { formatNoteDate } from './formatDate'

type SortOrder = 'newest' | 'oldest' | 'asc' | 'desc'

const SORT_OPTIONS = [
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
  const [sort, setSort] = useState<SortOrder>('newest')
  const [activeTags, setActiveTags] = useState<string[]>([])

  function toggleTag(tag: string) {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  function resetFilters() {
    setActiveTags([])
    setSort('newest')
  }

  const canReset = activeTags.length > 0 || sort !== 'newest'

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
    <main id="main" className="bg-white text-blue-950">
      {/* pt is 2rem beyond the visual target to offset skew-hero's -2rem margin. */}
      <section className="relative bg-gradient-to-br from-blue-950 to-blue-900 text-white overflow-hidden skew-hero pt-40 pb-16 md:pt-48 md:pb-24">
        {/* Unflipped, where the Footer's is flipped. Two dark Backdrops on the
            same page read as copies of each other otherwise. */}
        <Backdrop tone="dark" />
        <Container className="unskew-hero">
          <CascadeGroup mountOnly className="flex flex-col gap-4">
            <CascadeItem index={0}>
              <Eyebrow size="lg" className="text-white">Logging Changes</Eyebrow>
            </CascadeItem>
            <CascadeItem index={1}>
              <H1 className="text-white">Build Notes</H1>
            </CascadeItem>
            <CascadeItem index={2}>
              <p className="font-sans text-lg md:text-xl text-white max-w-2xl pt-1 pb-3 leading-relaxed">
                A running changelog of engineering decisions made on this site.  What changed, what it
                cost, and what I got wrong on the way. Every entry links the commit behind it.
              </p>
            </CascadeItem>
            <CascadeItem index={3}>
              {/* The two places a reader goes next: the record of the work, and
                  the code every entry cites. The site's own nav already carries
                  a way home, so a "back" button here spends the primary slot on
                  the one destination nobody needs help finding. */}
              <div className="flex flex-wrap items-center gap-3">
                <Button href="/resume" variant="primary" leftIcon={<FileText aria-hidden="true" />}>
                  View Resume
                </Button>
                <Button
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="glass-light"
                  rightIcon={<ArrowUpRight aria-hidden="true" />}
                >
                  View Repository
                </Button>
              </div>
            </CascadeItem>
          </CascadeGroup>
        </Container>
      </section>

      {/* Same surface as the home page's Work section. This is the other
          filterable index on the site, and the two should read as one pattern. */}
      <section className="relative bg-gradient-to-br from-white to-blue-50 py-16 md:py-24">
        <Backdrop tone="light" />
        <Container className="relative">
          <CascadeGroup className="flex flex-col gap-8" threshold={0.15}>
            <CascadeItem index={0}>
              <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <Dropdown
                    options={SORT_OPTIONS}
                    value={sort}
                    onChange={(v) => setSort(v as SortOrder)}
                  />
                  <MultiSelect
                    options={TAG_OPTIONS}
                    values={activeTags}
                    onChange={setActiveTags}
                    placeholder="Filter by tag"
                    searchPlaceholder="Filter tags…"
                    searchable
                  />
                </div>

                <div className="flex items-center gap-3">
                  {/*
                    `aria-live` because filtering is the one action here with no
                    visible focus consequence: a tag click changes the list far
                    below the control that changed it, and without an
                    announcement a screen reader user gets no feedback that
                    anything happened at all. Polite, so it waits for a pause
                    rather than interrupting.
                  */}
                  <span
                    aria-live="polite"
                    className="font-sans text-sm font-semibold text-blue-950/60 whitespace-nowrap"
                  >
                    {visible.length === notes.length
                      ? `${notes.length} notes`
                      : `${visible.length} of ${notes.length} notes`}
                  </span>

                  {canReset && (
                    <Button
                      variant="white"
                      size="md"
                      onClick={resetFilters}
                      leftIcon={<RotateCcw size={15} strokeWidth={2.5} aria-hidden="true" />}
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </CascadeItem>
          </CascadeGroup>

          {/*
            Keyed on the active filter so the cascade replays when the list
            changes. Without the key, React reuses the already-revealed items
            and a filtered result set appears with no entrance at all.
          */}
          <CascadeGroup
            key={`${sort}:${activeTags.join(',')}`}
            as="ul"
            className="flex flex-col gap-4 pt-8"
            threshold={0.05}
          >
            {visible.map((note, i) => (
              <CascadeItem as="li" index={i} key={note.slug}>
                {/*
                  The card is a Panel with a stretched link on the title, not an
                  <a> wrapping everything.

                  Wrapping the whole card put the tag Pills — real <button>s —
                  inside a link. That is invalid HTML, and assistive technology
                  handles nested interactive elements inconsistently enough that
                  the tag filters could not be relied on to be reachable at all.
                  It also made the link's accessible name the entire card read
                  aloud: date, title, summary, all three tags, then "Read". A
                  screen reader user pulling up a list of links on this page got
                  thirty entries of that.

                  Now the title is the only link, so its accessible name is the
                  title — unique, and the shortest thing that identifies the
                  destination. Its ::after covers the card, so the whole surface
                  is still clickable, and the Pills sit above that overlay so
                  they still filter. The focus ring is drawn on the Panel via
                  `has-[a:focus-visible]`, because the link itself is inline text
                  and a ring around two lines of a wrapped heading does not tell
                  a keyboard user which card they are on.
                */}
                <Panel
                  variant="white"
                  className="group relative p-6 md:p-8 rounded-xl transition hover:shadow-lg hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-blue-600 has-[a:focus-visible]:ring-offset-2"
                >
                  <div className="flex flex-col gap-3">
                    <time
                      dateTime={note.date}
                      className="font-sans text-xs font-semibold uppercase tracking-wider text-blue-950/50"
                    >
                      {formatNoteDate(note.date)}
                    </time>
                    <h2 className="font-sans text-xl md:text-2xl font-semibold leading-snug">
                      <a
                        href={`/notes/${note.slug}`}
                        className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
                      >
                        {note.title}
                      </a>
                    </h2>
                    <p className="font-sans text-base text-blue-950/70 leading-relaxed">
                      {note.summary}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* Above the stretched overlay, so a tag click filters.
                          Pill stops propagation itself. */}
                      <div className="relative z-10 flex flex-wrap items-center gap-2">
                        {note.tags.map((t) => (
                          <Pill
                            key={t}
                            active={activeTags.includes(t)}
                            onClick={() => toggleTag(t)}
                          >
                            {t}
                          </Pill>
                        ))}
                      </div>
                      {/*
                        Deliberately left *under* the overlay and hidden from
                        assistive tech. It is an affordance, not a control: the
                        click it appears to offer is the card's, and its label
                        would otherwise append a thirtieth identical "Read" to
                        the page's accessible content while naming no
                        destination.
                      */}
                      <Button
                        as="span"
                        aria-hidden="true"
                        variant="primary"
                        size="sm"
                        className="ml-auto"
                        rightIcon={<ArrowRight />}
                      >
                        Read
                      </Button>
                    </div>
                  </div>
                </Panel>
              </CascadeItem>
            ))}
          </CascadeGroup>
        </Container>
      </section>
    </main>
  )
}
