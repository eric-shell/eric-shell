import { ArrowUpRight } from 'lucide-react'
import Panel from '../Panel'
import Pill from '../Pill'

interface CardProps {
  href: string
  title: string
  description: string
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
        className="flex flex-col gap-3 h-full p-5 rounded-xl hover:shadow-md min-h-[151px] transition"
      >
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
      </Panel>
    </a>
  )
}
