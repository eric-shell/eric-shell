import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowDownAZ, ArrowUpRight, ArrowUpZA, CalendarDays, Plus, RotateCcw, X } from 'lucide-react'
import { workItems } from '@/data'
import { Backdrop, Button, Card, CascadeGroup, CascadeItem, Container, Dropdown, SectionHeader } from '../../ui'

type SortOrder = 'chronological' | 'asc' | 'desc'

const SORT_OPTIONS = [
  { value: 'chronological', label: 'Chronological', icon: <CalendarDays size={12} strokeWidth={2.5} /> },
  { value: 'asc',           label: 'Ascending',     icon: <ArrowDownAZ size={12} strokeWidth={2.5} /> },
  { value: 'desc',          label: 'Descending',    icon: <ArrowUpZA size={12} strokeWidth={2.5} /> },
]

const INITIAL_COUNT = 8

export default function Work() {
  const [sort, setSort] = useState<SortOrder>('chronological')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [showAll, setShowAll] = useState(false)
  const scrollYBeforeReveal = useRef<number | null>(null)

  function revealAll() {
    scrollYBeforeReveal.current = window.scrollY
    setShowAll(true)
  }

  // Restore the pre-reveal scroll position before paint — inserting 30+ cards
  // otherwise triggers browser scroll anchoring, which follows the content
  // below the insertion point down the page.
  useLayoutEffect(() => {
    if (scrollYBeforeReveal.current === null) return
    window.scrollTo(0, scrollYBeforeReveal.current)
    scrollYBeforeReveal.current = null
  }, [showAll])

  function toggleTag(tag: string) {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  function resetFilters() {
    setActiveTags([])
    setSort('chronological')
  }

  const canReset = activeTags.length > 0 || sort !== 'chronological'

  let items = activeTags.length > 0
    ? workItems.filter(item => activeTags.some(t => item.tags.includes(t)))
    : [...workItems]
  if (sort === 'asc') items = items.sort((a, b) => a.title.localeCompare(b.title))
  if (sort === 'desc') items = items.sort((a, b) => b.title.localeCompare(a.title))

  const isExpanded = showAll || activeTags.length > 0
  const visibleItems = isExpanded ? items : items.slice(0, INITIAL_COUNT)
  const hasMore = !isExpanded && items.length > INITIAL_COUNT

  return (
    <section id="work" className="relative bg-gradient-to-br from-white to-blue-50 skew-section z-50" style={{ marginTop: '-4rem' }}>
      <Backdrop tone="light" />
      <Container className="unskew-inner">

        <CascadeGroup threshold={0.15} className='z-[50]'>
          <CascadeItem index={0}>
            <SectionHeader
              eyebrow="Selected Work and Projects"
              title="Work"
              eyebrowClassName="text-blue-900"
              titleClassName="text-blue-950"
              action={
                <Button
                  href="https://www.linkedin.com/in/ericshell/details/experience/"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  size="md"
                  className="hidden md:inline-flex shrink-0"
                  rightIcon={<ArrowUpRight size={15} strokeWidth={2.5} aria-hidden="true" />}
                >
                  View Work History
                </Button>
              }
            />
          </CascadeItem>

          <CascadeItem index={1}>
            <div className="flex flex-col gap-5 font-sans text-base leading-relaxed text-blue-900 pb-10">
              <p>
                Over 15 years of practice spanning Fortune 500 brands, financial institutions, federal agencies, DMOs, QSRs and more I have built web-based applications that performs, ships, scales, and outlasts the engagement that built it. Each product demanded a different caliber of contextual understanding, technical leadership and creative solutioning which all culminated into an extensive portfolio that I am very proud of.
              </p>
              <p>
                What follows is a historical record of my contributions and completed projects. Each piece reflects the same standard of precision and accountability I bring to every engagement, regardless of its discipline, size or scope.
              </p>
              <Button
                href="https://www.linkedin.com/in/ericshell/details/experience/"
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                size="md"
                className="md:hidden self-start"
                rightIcon={<ArrowUpRight size={15} strokeWidth={2.5} aria-hidden="true" />}
              >
                View Work History
              </Button>
            </div>
          </CascadeItem>

          <CascadeItem index={2}>
            <div className="relative z-10 flex items-center justify-between gap-4 mb-8 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Dropdown
                  options={SORT_OPTIONS}
                  value={sort}
                  onChange={(v) => setSort(v as SortOrder)}
                />
                {activeTags.map(tag => (
                  <Button
                    key={tag}
                    variant="primary"
                    size="md"
                    onClick={() => toggleTag(tag)}
                    rightIcon={<X size={16} strokeWidth={2.5} aria-hidden="true" />}
                  >
                    {tag}
                  </Button>
                ))}
              </div>

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
          </CascadeItem>
        </CascadeGroup>

        <div className="relative">
          <CascadeGroup as="ul" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 z-[40]" threshold={0.05}>
            {visibleItems.map(({ url, title, solution, tags, image }, i) => (
              // Items revealed by "View All Work" get an explicit rolling delay —
              // the default index stagger caps at 7 steps, which would make
              // everything past the 8th revealed item appear at once.
              <CascadeItem
                as="li"
                key={title}
                index={i}
                delayMs={showAll && i >= INITIAL_COUNT ? (i - INITIAL_COUNT) * 60 : undefined}
              >
                <Card
                  href={url}
                  title={title}
                  description={solution}
                  image={image}
                  tags={tags}
                  activeTags={activeTags}
                  onTagClick={toggleTag}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              </CascadeItem>
            ))}
          </CascadeGroup>

          <div
            className={`absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-blue-50 to-transparent pointer-events-none z-10 transition-opacity duration-700 motion-reduce:transition-none ${
              hasMore ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        <div
          aria-hidden={!hasMore}
          className={`flex justify-center overflow-hidden transition-[max-height,opacity,margin] duration-500 ease-out motion-reduce:transition-none ${
            hasMore ? 'mt-6 max-h-20 opacity-100' : 'mt-0 max-h-0 opacity-0'
          }`}
        >
          <Button
            variant="primary"
            size="md"
            onClick={revealAll}
            tabIndex={hasMore ? undefined : -1}
            rightIcon={<Plus size={15} strokeWidth={2.5} aria-hidden="true" />}
          >
            View All Work
          </Button>
        </div>

      </Container>
    </section>
  )
}
