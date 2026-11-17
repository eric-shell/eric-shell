import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowDownAZ, ArrowUpRight, ArrowUpZA, CalendarDays, Plus, RotateCcw } from 'lucide-react'
import { workItems } from '@/data'
import { useCountUp, useFilterTelemetry, useWaveGrid } from '@/hooks'
import { Button, Card, CascadeGroup, CascadeItem, Container, Dropdown, MultiSelect, SectionTitle, descDelay, useCascade } from '../../ui'

type SortOrder = 'chronological' | 'asc' | 'desc'

const SORT_OPTIONS = [
  { value: 'chronological', label: 'Chronological', icon: <CalendarDays size={12} strokeWidth={2.5} /> },
  { value: 'asc',           label: 'Ascending',     icon: <ArrowDownAZ size={12} strokeWidth={2.5} /> },
  { value: 'desc',          label: 'Descending',    icon: <ArrowUpZA size={12} strokeWidth={2.5} /> },
]

/**
 * Derived from the items rather than hand-listed, so a tag added to `work.ts` is
 * filterable without a second edit here — and a tag that no item carries can
 * never appear and filter to nothing. Alphabetical because there is no
 * meaningful ranking among them and a stable order is what makes a 24-item list
 * scannable twice.
 */
const TAG_OPTIONS = [...new Set(workItems.flatMap(item => item.tags))]
  .sort((a, b) => a.localeCompare(b))
  .map(tag => ({ value: tag, label: tag }))

/**
 * Which tags name a platform or framework, as opposed to an industry or kind of
 * work. This is the one hand-kept list here: the tags themselves don't say
 * which is which. A new framework tag needs adding to it to be counted.
 */
const PLATFORM_TAGS = new Set(['Drupal', 'React', 'React Native', 'Next.js', 'Three.js', 'Expo', 'Vite', 'Angular', 'TeamSite', 'Backbone', 'Custom Framework'])

/**
 * Which tags name an industry, as opposed to a platform or a kind of work
 * (Community, Internal, Regional, Project, Game). Hand-kept for the same reason
 * as PLATFORM_TAGS: a new industry tag needs adding here to be counted.
 */
const INDUSTRY_TAGS = new Set(['QSR', 'Government', 'Commerce', 'Entertainment', 'Healthcare', 'Data Hardware', 'DMO', 'Education', 'Charity', 'Landscaping', 'Agency'])

/** Counted from the data, never typed: the numbers change when `work.ts` does. */
const STATS = [
  { value: workItems.length, suffix: '', label: 'Projects' },
  { value: 15, suffix: '+', label: 'Years' },
  { value: new Set(workItems.flatMap(item => item.tags.filter(t => INDUSTRY_TAGS.has(t)))).size, suffix: '', label: 'Industries' },
  { value: new Set(workItems.flatMap(item => item.tags.filter(t => PLATFORM_TAGS.has(t)))).size, suffix: '', label: 'Platforms and frameworks' },
]

const INITIAL_COUNT = 12

/** A stat's label and number. Counts up once its header group comes into view. */
function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { inView } = useCascade()
  const n = useCountUp(value, inView)
  return (
    <>
      <dt className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-white/90 max-w-[18ch]">{label}</dt>
      <dd className="font-display font-bold tracking-display text-[clamp(46px,5.4vw,80px)] leading-[0.95] tabular-nums">
        {n}{suffix}
      </dd>
    </>
  )
}

export default function Work() {
  const [sort, setSort] = useState<SortOrder>('chronological')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [showAll, setShowAll] = useState(false)
  const scrollYBeforeReveal = useRef<number | null>(null)
  const gridRef = useRef<HTMLElement | null>(null)

  useFilterTelemetry({ section: 'work', tags: activeTags, sort, defaultSort: 'chronological' })

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

  const cols = useWaveGrid(gridRef, visibleItems.map(i => i.title).join('|'))

  return (
    // Rises over the hero's lower edge as a rounded blue sheet that widens to
    // full bleed (`work-sheet`). z-10 so the sheet covers the hero it overlaps.
    // `overflow-x-clip`: before their entrance, the cards lie flat in 3D
    // perspective, which projects wider than their column and scrolled phones
    // sideways. Clip, not hidden, so this doesn't become a scroll container.
    <section id="work" className="relative z-10 -mt-14 pt-24 md:pt-32 pb-24 md:pb-36 text-white overflow-x-clip">
      <div aria-hidden="true" className="work-sheet absolute inset-0 -z-10 rounded-t-[48px] bg-lum" />
      <Container>
        <SectionTitle
          eyebrow="Selected Work and Projects"
          title="Work"
          eyebrowClassName="text-white"
          action={
            <Button
              href="https://www.linkedin.com/in/ericshell/details/experience/"
              target="_blank"
              rel="noopener noreferrer"
              variant="white"
              className="border-0"
              rightIcon={<ArrowUpRight size={15} strokeWidth={2.5} aria-hidden="true" />}
            >
              View Work History
            </Button>
          }
        >
          <CascadeItem delayMs={descDelay(0)}>
            <div className="flex flex-col gap-5 pt-8 font-sans text-base md:text-lg leading-relaxed text-white/90 max-w-3xl">
              <p>
                Fifteen years of web and mobile applications for Fortune 500 brands, financial institutions, federal agencies, tourism boards and national restaurant chains. Every project here shipped, and every one was held to the same standard of precision and accountability, whatever its size.
              </p>
            </div>
          </CascadeItem>

          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8 pt-12 pb-12">
            {STATS.map((stat, i) => (
              <CascadeItem key={stat.label} delayMs={descDelay(1 + i)} className="relative flex flex-col-reverse justify-end gap-2 pt-5 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-white/40 before:origin-left before:scale-x-0 before:transition-transform before:duration-[1100ms] before:ease-[cubic-bezier(0.2,0.8,0.2,1)] [&.opacity-100]:before:scale-x-100 motion-reduce:before:scale-x-100">
                <Stat {...stat} />
              </CascadeItem>
            ))}
          </dl>

          <CascadeItem delayMs={descDelay(5)}>
            <div className="relative z-20 flex items-center justify-between gap-4 mb-8 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Dropdown
                  variant="white"
                  options={SORT_OPTIONS}
                  value={sort}
                  onChange={(v) => setSort(v as SortOrder)}
                />
                {/*
                  Selected tags live in the trigger rather than as a row of
                  dismissible Buttons beside it. That row grew one control per
                  tag: at four tags it wrapped onto a second line and pushed the
                  grid down, and the sort control it sat next to drifted further
                  from the grid it sorts with every addition. This is also the
                  only place the full tag vocabulary is visible — clicking tags
                  on the cards can only ever surface the tags already on screen.
                */}
                <MultiSelect
                  variant="white"
                  options={TAG_OPTIONS}
                  values={activeTags}
                  onChange={setActiveTags}
                  placeholder="Filter by tag"
                  searchPlaceholder="Filter tags…"
                  searchable
                />
              </div>

              {canReset && (
                <Button
                  variant="white"
                  size="md"
                  className="border-0"
                  onClick={resetFilters}
                  leftIcon={<RotateCcw size={15} strokeWidth={2.5} aria-hidden="true" />}
                >
                  Reset
                </Button>
              )}
            </div>
          </CascadeItem>
        </SectionTitle>

        {/* While collapsed, the grid fades out through a mask rather than a
            gradient laid over it. The columns drift (useWaveGrid), so the middle
            one hangs below this box; an overlay pinned to the box left that card's
            foot solid white under the fade. A mask fades the last 14rem and hides
            anything past the edge, whichever column it belongs to. A mask also
            hides everything outside the box on every side, so the box is grown
            with padding (and pulled back with negative margin, so the layout
            doesn't move): room above for the columns' upward drift and a hovered
            card's lift, and to the sides for its tilt and shadow. Without it the
            top of a drifting card was cut off. */}
        <div
          // The grown box overlaps the controls above; only the grid takes the pointer.
          className={`relative -mx-6 px-6 -mt-20 pt-20 pointer-events-none [&>ul]:pointer-events-auto ${hasMore ? '[mask-image:linear-gradient(to_bottom,black_calc(100%-14rem),transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_calc(100%-14rem),transparent)]' : ''}`}
          ref={el => { gridRef.current = el?.querySelector('ul') ?? null }}
        >
          <CascadeGroup as="ul" className="wave-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" threshold={0.05}>
            {visibleItems.map(({ url, title, solution, tags }, i) => (
              <CascadeItem
                as="li"
                key={title}
                data-key={title}
                effect="flip"
                // Items revealed by "View All Work" roll in after the first set;
                // the rest flip up in a diagonal wave, staggered by column with
                // alternate rows offset.
                delayMs={showAll && i >= INITIAL_COUNT
                  ? (i - INITIAL_COUNT) * 60
                  : (i % cols) * 90 + (Math.floor(i / cols) % 2) * 45}
              >
                <Card
                  href={url}
                  title={title}
                  label={String(workItems.findIndex(w => w.title === title) + 1).padStart(2, '0')}
                  description={solution}
                  tags={tags}
                  activeTags={activeTags}
                  onTagClick={toggleTag}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              </CascadeItem>
            ))}
          </CascadeGroup>

        </div>

        <div
          aria-hidden={!hasMore}
          className={`flex justify-center overflow-hidden transition-[max-height,opacity,margin] duration-500 ease-out motion-reduce:transition-none ${
            hasMore ? 'py-6 max-h-40 opacity-100' : 'pt-0 max-h-0 opacity-0'
          }`}
        >
          <Button
            variant="white"
            size="md"
            className="border-0"
            onClick={revealAll}
            tabIndex={hasMore ? undefined : -1}
            rightIcon={<Plus size={15} strokeWidth={2.5} aria-hidden="true" />}
          >
            View All {workItems.length} Projects
          </Button>
        </div>

      </Container>
    </section>
  )
}
