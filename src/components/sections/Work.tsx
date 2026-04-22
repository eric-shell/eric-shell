import { ArrowUpRight } from 'lucide-react'
import { work } from '../../data/work'

export default function Work() {
  return (
    <section id="work" className="bg-off-white py-24">
      <div className="max-w-[1440px] mx-auto px-6">

        <div className="mb-12">
          <p
            className="font-sans font-bold uppercase tracking-wider text-sm text-off-black mb-4"
            style={{ fontVariationSettings: "'GRAD' 150" }}
          >
            Selected Projects
          </p>
          <h2 className="font-display text-6xl font-bold uppercase text-off-black">
            Work
          </h2>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {work.map(({ url, title, solution, technology }) => (
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
                <span className="self-start font-sans text-xs font-semibold text-off-black/50 bg-off-black/8 px-2 py-1 rounded-md">
                  {technology}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-12">
          <button className="px-5 py-2.5 rounded-lg bg-off-black text-white font-sans font-semibold text-sm hover:bg-black transition cursor-pointer">
            View All Projects
          </button>
        </div>

      </div>
    </section>
  )
}
