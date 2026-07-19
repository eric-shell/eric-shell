import { ArrowUpRight } from 'lucide-react'
import Panel from '../Panel'
import Pill from '../Pill'

interface CardProps {
  href: string
  title: string
  description: string
  image?: string
  tags?: string[]
  activeTags?: string[]
  onTagClick?: (tag: string) => void
  target?: string
  rel?: string
}

export default function Card({
  href,
  title,
  description,
  image,
  tags = [],
  activeTags = [],
  onTagClick,
  target,
  rel,
}: CardProps) {
  return (
    <a href={href} target={target} rel={rel} className="group block h-full">
      <Panel
        variant="white"
        className="relative noise-overlay flex flex-col h-full rounded-xl overflow-hidden hover:shadow-md hover:border-blue-400/40 min-h-[151px] transition"
      >
        {image && (
          <div className="aspect-[16/10] overflow-hidden bg-blue-100">
            <img
              src={image}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          </div>
        )}
        <div className="flex flex-col gap-3 flex-1 p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="font-sans font-semibold text-blue-950 leading-snug">{title}</span>
            <ArrowUpRight
              size={16}
              strokeWidth={2.5}
              className="shrink-0 mt-0.5 text-blue-950 group-hover:text-blue-950 transition"
              aria-hidden="true"
            />
          </div>
          <p className="font-sans text-sm text-blue-900 leading-snug flex-1">{description}</p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map(tag => (
                <Pill
                  key={tag}
                  active={activeTags.includes(tag)}
                  onClick={onTagClick ? () => onTagClick(tag) : undefined}
                >
                  {tag}
                </Pill>
              ))}
            </div>
          )}
        </div>
      </Panel>
    </a>
  )
}
