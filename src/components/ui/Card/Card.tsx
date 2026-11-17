import { ArrowUpRight } from 'lucide-react'
import Panel from '../Panel'
import Pill from '../Pill'

interface CardProps {
  href: string
  title: string
  description: string
  /** A small label above the title, e.g. the project's number in the grid. */
  label?: string
  image?: string
  /**
   * Candidate set for `image`. Card stays ignorant of where the candidates come
   * from — a file-backed caller would pass a local ladder.
   */
  imageSrcSet?: string
  /** Required alongside `imageSrcSet`; without it the browser assumes 100vw. */
  imageSizes?: string
  tags?: string[]
  activeTags?: string[]
  onTagClick?: (tag: string) => void
  target?: string
  rel?: string
}

/**
 * A white project card. With no `image` it is type-only: label and arrow, the
 * title set like every other Display heading, the description, then tag pills.
 *
 * On hover it lifts, tilts toward the pointer and catches a faint cyan glow
 * where the pointer is (kept at 8% so it never competes with the text). The
 * tilt and glow read `--tx` / `--ty` / `--mx` / `--my` (and the arrow
 * `--ax` / `--ay`), which a parent sets from pointer position (see
 * useWaveGrid); without them the card just lifts.
 */
export default function Card({
  href,
  title,
  description,
  label,
  image,
  imageSrcSet,
  imageSizes,
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
        className="relative flex flex-col h-full min-h-[236px] rounded-[22px] border-0 overflow-hidden transition-[transform,box-shadow] duration-300 ease-out [transform:perspective(900px)_rotateX(var(--ty,0deg))_rotateY(var(--tx,0deg))_translateY(var(--lift,0px))] group-hover:[--lift:-8px] group-hover:shadow-[0_30px_50px_-24px_rgba(5,10,60,0.7)] motion-reduce:[transform:none]"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(280px_circle_at_var(--mx,50%)_var(--my,50%),rgba(143,232,255,0.08),transparent_65%)]"
        />
        {image && (
          <div className="relative aspect-[16/10] overflow-hidden bg-ice">
            <img
              src={image}
              srcSet={imageSrcSet}
              sizes={imageSizes}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          </div>
        )}
        <div className="relative flex flex-col gap-2.5 flex-1 p-6">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-semibold text-blue-900/70">{label}</span>
            <span
              aria-hidden="true"
              className="grid place-items-center w-9 h-9 rounded-full bg-ice text-lum transition-[background-color,color,rotate,translate] duration-500 ease-[cubic-bezier(0.3,1.45,0.5,1)] group-hover:bg-lum group-hover:text-white group-hover:rotate-45 [translate:var(--ax,0px)_var(--ay,0px)]"
            >
              <ArrowUpRight size={16} strokeWidth={2.5} />
            </span>
          </div>
          <h3 className="mt-auto pt-4 font-display font-bold uppercase tracking-display text-[clamp(22px,2vw,28px)] leading-[0.95] text-ink text-balance">
            {title}
          </h3>
          <p className="font-sans text-sm text-blue-900 leading-snug">{description}</p>
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
        <span
          aria-hidden="true"
          className="absolute left-0 bottom-0 h-1 w-full bg-glow origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"
        />
      </Panel>
    </a>
  )
}
