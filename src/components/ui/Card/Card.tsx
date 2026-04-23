import type { AnchorHTMLAttributes } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import Pill from '../Pill'

interface CardProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  title: string
  description: string
  tags?: string[]
  activeTags?: string[]
  onTagClick?: (tag: string) => void
  className?: string
}

export default function Card({
  title,
  description,
  tags = [],
  activeTags = [],
  onTagClick,
  className,
  ...props
}: CardProps) {
  return (
    <a
      className={twMerge(
        'group flex flex-col gap-3 h-full p-5 rounded-xl border border-off-black/10 bg-white hover:border-off-black/30 hover:shadow-md transition min-h-[151px]',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-sans font-semibold text-off-black leading-snug">{title}</span>
        <ArrowUpRight
          size={16}
          className="shrink-0 mt-0.5 text-off-black/30 group-hover:text-off-black/70 transition"
          aria-hidden="true"
        />
      </div>
      <p className="font-sans text-sm text-off-black/60 leading-snug flex-1">{description}</p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
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
    </a>
  )
}
