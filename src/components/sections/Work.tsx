import { useState } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import { work } from '../../data/work'

type SortOrder = 'chronological' | 'asc' | 'desc'

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'chronological', label: 'Chronological' },
  { value: 'asc', label: 'A → Z' },
  { value: 'desc', label: 'Z → A' },
]

export default function Work() {
  const [sort, setSort] = useState<SortOrder>('chronological')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  let items = activeTag ? work.filter(item => item.tags.includes(activeTag)) : [...work]
  if (sort === 'asc') items = items.sort((a, b) => a.title.localeCompare(b.title))
  if (sort === 'desc') items = items.sort((a, b) => b.title.localeCompare(a.title))

  return (
    <section id="work" className="bg-off-white py-24">
      <div className="max-w-[1440px] mx-auto px-6">

        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <p
              className="font-sans font-bold uppercase tracking-wider text-sm text-off-black mb-4"
              style={{ fontVariationSettings: "'GRAD' 150" }}
            >
              Selected Work and Projects
            </p>
            <h2 className="font-display text-6xl font-bold uppercase text-off-black">
              Contributions
            </h2>
          </div>

          <div className="flex items-center gap-1.5 pt-1 shrink-0" role="group" aria-label="Sort order">
            {SORT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSort(value)}
                aria-pressed={sort === value}
                className={`px-3 py-1.5 rounded-lg font-sans text-xs font-semibold transition cursor-pointer
                  ${sort === value
                    ? 'bg-off-black text-white'
                    : 'border border-off-black/20 text-off-black/60 hover:border-off-black/40 hover:text-off-black'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeTag && (
          <div className="flex items-center gap-2 mb-8">
            <span className="font-sans text-sm text-off-black/50">Filtering by:</span>
            <span className="flex items-center gap-1.5 font-sans text-xs font-semibold bg-off-black text-white px-2.5 py-1 rounded-md">
              {activeTag}
              <button
                onClick={() => setActiveTag(null)}
                aria-label={`Clear ${activeTag} filter`}
                className="cursor-pointer opacity-70 hover:opacity-100 transition"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          </div>
        )}

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {items.map(({ url, title, solution, tags }) => (
            <li key={title}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-3 h-full p-5 rounded-xl border border-off-black/10 bg-white hover:border-off-black/30 hover:shadow-md transition"
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
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <button
                      key={tag}
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setActiveTag(tag) }}
                      className={`font-sans text-xs font-semibold px-2 py-1 rounded-md transition cursor-pointer
                        ${activeTag === tag
                          ? 'bg-off-black text-white'
                          : 'text-off-black/50 bg-off-black/8 hover:bg-off-black/15'
                        }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </a>
            </li>
          ))}
        </ul>

      </div>
    </section>
  )
}
