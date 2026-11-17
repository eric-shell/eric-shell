import type { HTMLAttributes, ReactNode } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { cn } from '../cn'
import Panel from '../Panel'
import Pill from '../Pill'

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  href: string
  title: string
  /** The title's element. A card in a list of them is usually a heading. */
  titleAs?: 'h2' | 'h3' | 'span'
  /**
   * Set the title in the Display face, like every heading on the site. Right
   * for a project name; wrong for a sentence-length title, which Display turns
   * into four lines of capitals. Those stay sans.
   */
  display?: boolean
  description: string
  /** Cut the description at two lines, for a card narrower than the copy was written for. */
  clampDescription?: boolean
  /** The card's number in its grid ("07"), top left. */
  index?: string
  /** Anything else for the top-left slot, e.g. a `<Label as="time">`. */
  meta?: ReactNode
  /** The affordance, top right. It is decoration: the click is the card's. */
  arrow?: 'up-right' | 'right' | false
  tags?: string[]
  activeTags?: string[]
  /** Makes the tags buttons. Without it they are static. */
  onTagClick?: (tag: string) => void
  /** Pinned to the foot of the card, e.g. a `<Button as="span">`. */
  footer?: ReactNode
  /**
   * What the card sits on.
   *   field  a lum field: borderless white, the deep shadow, an 8px lift.
   *   sheet  a white sheet: a hairline so it has an edge, a softer shadow and lift.
   */
  tone?: 'field' | 'sheet'
  /** The colour bar that draws along the foot on hover, and the side it draws from. */
  bar?: 'glow' | 'lum'
  barOrigin?: 'left' | 'right'
  /** The link's accessible name, when the title alone does not say enough. */
  linkLabel?: string
  target?: string
  rel?: string
  image?: string
  /**
   * Candidate set for `image`. Card stays ignorant of where the candidates come
   * from: a file-backed caller would pass a local ladder.
   */
  imageSrcSet?: string
  /** Required alongside `imageSrcSet`; without it the browser assumes 100vw. */
  imageSizes?: string
}

const TONE = {
  field: { variant: 'white', hover: 'hover:[--lift:-8px] hover:shadow-card' },
  sheet: { variant: 'outline', hover: 'hover:[--lift:-6px] hover:shadow-card-soft' },
} as const

const TITLE = {
  display: 'font-display font-bold uppercase tracking-display text-[clamp(22px,2vw,28px)] leading-[0.95]',
  sans: 'font-sans text-xl font-semibold leading-snug tracking-[-0.01em]',
}

/**
 * The white card: the Work grid, the notes index, and the pager under a note.
 *
 * The card is a surface with one stretched link on its title, not an `<a>`
 * wrapped around everything. Wrapping put the tag pills, which are real
 * buttons, inside a link: invalid HTML, and handled inconsistently enough by
 * assistive technology that the tag filters could not be relied on to be
 * reachable. It also made the link's accessible name the whole card read
 * aloud. Now the name is the title (or `linkLabel`), the link's `::after`
 * covers the card so the whole surface still clicks, and the pills sit above
 * that overlay. The focus ring is drawn on the card (`focus-ring-within`),
 * because a ring around two lines of wrapped heading does not say which card
 * has focus.
 *
 * On hover it lifts and a colour bar draws along its foot. Inside a grid driven
 * by `useWaveGrid` it also tilts toward the pointer and catches a faint glow:
 * the hook finds the card by `data-card` and sets `--tx` `--ty` `--mx` `--my`
 * `--ax` `--ay` on it. Without those it just lifts.
 */
export default function Card({
  href,
  title,
  titleAs: Title = 'h3',
  display = false,
  description,
  clampDescription = false,
  index,
  meta,
  arrow = 'up-right',
  tags = [],
  activeTags = [],
  onTagClick,
  footer,
  tone = 'field',
  bar = 'glow',
  barOrigin = 'left',
  linkLabel,
  target,
  rel,
  image,
  imageSrcSet,
  imageSizes,
  className,
  ...props
}: CardProps) {
  const Arrow = arrow === 'right' ? ArrowRight : ArrowUpRight
  return (
    <Panel
      data-card=""
      variant={TONE[tone].variant}
      className={cn(
        'group card-lift focus-ring-within relative flex h-full min-h-[236px] flex-col overflow-hidden rounded-card transition-[transform,box-shadow] duration-300 ease-out',
        TONE[tone].hover,
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="card-glow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
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
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </div>
      )}
      {/* `focus-on-paper`: the pills in here are on white, whatever field the card is on. */}
      <div className="focus-on-paper relative flex flex-1 flex-col gap-2.5 p-6">
        {(index || meta || arrow) && (
          <div className="flex items-center justify-between gap-2">
            {index ? <span className="font-mono text-xs font-semibold text-ink-mute">{index}</span> : meta}
            {arrow && (
              <span
                aria-hidden="true"
                className={cn(
                  'grid h-9 w-9 place-items-center rounded-full bg-ice text-lum transition-[background-color,color,rotate,translate] duration-500 ease-spring group-hover:bg-lum group-hover:text-white',
                  arrow === 'right'
                    ? 'group-hover:translate-x-1'
                    : 'group-hover:rotate-45 [translate:var(--ax,0px)_var(--ay,0px)]',
                )}
              >
                <Arrow size={16} strokeWidth={2.5} />
              </span>
            )}
          </div>
        )}
        {/* With a footer the title follows the meta and the footer takes the
            foot of the card; without one the title is what sinks to it. */}
        <Title className={cn('text-balance text-ink', display ? TITLE.display : TITLE.sans, !footer && 'mt-auto pt-4')}>
          <a href={href} target={target} rel={rel} aria-label={linkLabel} className="after:absolute after:inset-0 after:rounded-card">
            {title}
          </a>
        </Title>
        <p className={cn('font-sans text-sm leading-snug text-ink-soft', clampDescription && 'line-clamp-2')}>{description}</p>
        {tags.length > 0 && (
          // Above the stretched link, so a tag click filters. Pill stops propagation itself.
          <div className="relative z-10 flex flex-wrap gap-1.5 pt-1">
            {tags.map(tag => (
              <Pill key={tag} active={activeTags.includes(tag)} onClick={onTagClick ? () => onTagClick(tag) : undefined}>
                {tag}
              </Pill>
            ))}
          </div>
        )}
        {footer && <div className="mt-auto pt-3">{footer}</div>}
      </div>
      <span
        aria-hidden="true"
        className={cn(
          'absolute bottom-0 left-0 h-1 w-full scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100',
          bar === 'lum' ? 'bg-lum' : 'bg-glow',
          barOrigin === 'right' ? 'origin-right' : 'origin-left',
        )}
      />
    </Panel>
  )
}
