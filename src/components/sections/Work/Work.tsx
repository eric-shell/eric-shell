import { useState } from 'react'
import { ArrowDownAZ, ArrowUpRight, ArrowUpZA, CalendarDays } from 'lucide-react'
import { contributions } from '../../../data'
import { Button, CascadeGroup, CascadeItem, Eyebrow, H2, Panel, Pill } from '../../ui'

type SortOrder = 'chronological' | 'asc' | 'desc'

const SORT_OPTIONS: { value: SortOrder; label: string; icon: React.ReactNode }[] = [
  { value: 'chronological', label: 'Chronological', icon: <CalendarDays size={12} /> },
  { value: 'asc',           label: 'Ascending',     icon: <ArrowDownAZ size={12} /> },
  { value: 'desc',          label: 'Descending',    icon: <ArrowUpZA size={12} /> },
]

export default function Work() {
  const [sort, setSort] = useState<SortOrder>('chronological')
  const [activeTags, setActiveTags] = useState<string[]>([])

  function toggleTag(tag: string) {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  let items = activeTags.length > 0
    ? contributions.filter(item => activeTags.some(t => item.tags.includes(t)))
    : [...contributions]
  if (sort === 'asc') items = items.sort((a, b) => a.title.localeCompare(b.title))
  if (sort === 'desc') items = items.sort((a, b) => b.title.localeCompare(a.title))

  return (
    <section id="work" className="bg-off-white py-24">
      <div className="max-w-[1440px] mx-auto px-6">

        <CascadeGroup threshold={0.15}>
          <CascadeItem index={0}>
            <div className="flex items-start justify-between gap-4 pb-10">
              <div>
                <Eyebrow className="text-off-black mb-4 block">Selected Work and Projects</Eyebrow>
                <H2 className="text-off-black">Work</H2>
              </div>
              <Button
                href="https://www.linkedin.com/in/ericshell/details/experience/"
                target="_blank"
                rel="noopener noreferrer"
                size="md"
                className="shrink-0"
                rightIcon={<ArrowUpRight size={15} aria-hidden="true" />}
              >
                View Work History
              </Button>
            </div>
          </CascadeItem>

          <CascadeItem index={1}>
            <div className="flex flex-col gap-5 font-sans text-base leading-relaxed text-off-black/80 pb-10">
              <p>
                Over 15 years of practice spanning federal agencies, Fortune 500 brands, financial institutions, and entertainment platforms, I have built software that ships, scales, and endures well beyond the engagement that created it. Each context demanded a different caliber of contextual understanding, technical leadership and creative solutioning.
              </p>
              <p>
                What follows is a curated record of that output: client products, internal platforms, open source contributions, and independent projects. Each piece reflects the same standard of precision and accountability I bring to every engagement, regardless of its discipline, size or scope.
              </p>
            </div>
          </CascadeItem>

          <CascadeItem index={2}>
            <div className="flex items-center justify-between gap-2 mb-8">
              <div className="flex items-center gap-2 flex-wrap">
                {activeTags.length > 0 && (
                  <>
                    <span className="font-sans text-sm text-off-black/50">Filtering by:</span>
                    {activeTags.map(tag => (
                      <Pill key={tag} active onDismiss={() => toggleTag(tag)}>
                        {tag}
                      </Pill>
                    ))}
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5" role="group" aria-label="Sort order">
                {SORT_OPTIONS.map(({ value, label, icon }) => (
                  <Pill
                    key={value}
                    active={sort === value}
                    onClick={() => setSort(value)}
                    leftIcon={icon}
                  >
                    {label}
                  </Pill>
                ))}
              </div>
            </div>
          </CascadeItem>
        </CascadeGroup>

        <CascadeGroup as="ul" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" threshold={0.05}>
          {items.map(({ url, title, solution, tags }, i) => (
            <CascadeItem as="li" key={title} index={i}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block h-full"
              >
                <Panel
                  variant="lighter"
                  className="flex flex-col gap-3 h-full p-5 rounded-xl border border-off-black/10 group-hover:border-off-black/30 group-hover:shadow-md transition min-h-[151px]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-sans font-semibold text-off-black leading-snug">{title}</span>
                    <ArrowUpRight
                      size={16}
                      className="shrink-0 mt-0.5 text-off-black/30 group-hover:text-off-black/70 transition"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="font-sans text-sm text-off-black/60 leading-snug flex-1">{solution}</p>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(tag => (
                        <Pill
                          key={tag}
                          active={activeTags.includes(tag)}
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                        </Pill>
                      ))}
                    </div>
                  )}
                </Panel>
              </a>
            </CascadeItem>
          ))}
        </CascadeGroup>

      </div>
    </section>
  )
}
