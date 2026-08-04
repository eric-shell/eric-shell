import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'
import {
  SURFACE,
  SURFACE_HOVER,
  SURFACE_ICON,
  SURFACE_ICON_HOVER,
  hoverLiftSquareOverride,
  type Variant,
  type Size,
} from '../variants'

type Shape = 'pill' | 'square'

/**
 * `transition` already covers `transform`, so the scale rides the same easing
 * as the surface colours. It is deliberately tiny — 1.5% — because these sit in
 * dense rows in the admin and anything larger reads as the button jumping.
 * `motion-safe:` drops it entirely under `prefers-reduced-motion`, where the
 * colour and shadow shifts still carry the state.
 *
 * The press scale is *below* 1 so a click always moves opposite the hover,
 * which keeps the two states distinguishable on a touch device that fires both.
 *
 * `disabled:` only binds on `<button>` — an `<a>` cannot be disabled, and a
 * disabled link should not be rendered as one. `pointer-events-none` is what
 * actually suppresses the hover and press states; without it a disabled button
 * still lights up under the cursor, which is what `VisitorDetail`'s Delete
 * button did for the whole duration of a delete.
 */
const BASE =
  'group inline-flex items-center justify-center font-sans font-semibold transition cursor-pointer overflow-hidden ' +
  'motion-safe:hover:scale-[1.035] motion-safe:active:scale-[0.985] ' +
  'disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none'

const SIZE_PILL: Record<Size, string> = {
  sm: 'px-3 py-1.5 rounded-lg text-xs',
  md: 'px-5 py-2.5 rounded-lg text-sm',
  lg: 'px-6 py-3 rounded-lg text-base',
}

/**
 * Label-to-icon spacing. It scales faster than the button's own `px` so the
 * label doesn't end up crowded against the slab while the far side carries a
 * much wider inset — most visible at `lg`.
 */
const GAP: Record<Size, string> = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
}

const SIZE_SQUARE: Record<Size, string> = {
  sm: 'p-1.5 rounded-lg',
  md: 'p-2.5 rounded-lg',
  lg: 'p-3.5 rounded-lg',
}

/**
 * The icon slab cancels the button's own padding with negative margins so it
 * bleeds to the padding box on three sides, then re-pads itself. `self-stretch`
 * plus the negative block margins give it the button's full height; the
 * button's `overflow-hidden` clips it back to the corner radius.
 */
const SLAB_SIZE: Record<Size, string> = {
  sm: '-my-1.5 px-2.5',
  md: '-my-2.5 px-3.5',
  lg: '-my-3 px-4',
}

const SLAB_LEFT: Record<Size, string> = { sm: '-ml-3', md: '-ml-5', lg: '-ml-6' }
const SLAB_RIGHT: Record<Size, string> = { sm: '-mr-3', md: '-mr-5', lg: '-mr-6' }

/**
 * Base optical size per button size. The `icon-optical` utility turns this into
 * the rendered width/height and scales light glyphs (arrows, chevrons, plus) up
 * from it — see `src/index.css`. CSS wins over lucide's width/height
 * attributes, so call sites don't have to pick a matching `size` number.
 */
const ICON_SIZE: Record<Size, string> = {
  sm: '[--icon-size:0.875rem]',
  md: '[--icon-size:1rem]',
  lg: '[--icon-size:1.25rem]',
}

const ICON_BASE = 'icon-optical inline-flex items-center justify-center shrink-0'
const SLAB_BASE = 'self-stretch transition-colors'

type SharedProps = {
  variant?: Variant
  size?: Size
  shape?: Shape
  className?: string
  children: React.ReactNode
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  /** Set false to render icons inline with no tinted slab. */
  iconSlab?: boolean
  /**
   * Render the button's appearance on a non-interactive `<span>`.
   *
   * For the case where the button sits inside something that is *already* a
   * link — a whole-card `<a>`, where a nested `<button>` or `<a>` is invalid
   * HTML and a second tab stop to the same destination. The span inherits the
   * card's click, so the affordance is real even though the element isn't.
   *
   * This exists so a call site in that position can still say
   * `variant="primary"` instead of hand-rolling the surface classes, which is
   * the rule everything else in `variants.ts` is built to hold. `Pill` renders
   * a `<span>` for the same reason. Do not use it for anything clickable in
   * its own right — it has no role, no focus, and no keyboard behaviour.
   */
  as?: 'span'
}

type ButtonAsButton = SharedProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }
type ButtonAsAnchor = SharedProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
type ButtonProps = ButtonAsButton | ButtonAsAnchor

export default function Button({
  variant = 'secondary',
  size = 'md',
  shape = 'pill',
  className = '',
  children,
  leftIcon,
  rightIcon,
  iconSlab = true,
  href,
  as,
  ...props
}: ButtonProps) {
  const square = shape === 'square'
  // Square buttons hold a single child, so the gap only matters for pills.
  const sizeClass = square ? SIZE_SQUARE[size] : twMerge(SIZE_PILL[size], GAP[size])
  const classes = twMerge(
    BASE,
    SURFACE[variant],
    SURFACE_HOVER[variant],
    sizeClass,
    // Square buttons take their icon through children, so scale it at the root.
    square && `icon-optical ${ICON_SIZE[size]}`,
    // At a tight square radius the HOVER_LIFT ring wraps the full perimeter
    // and reads as a halo rather than an edge — swap in the ring-free variant.
    // No-op for variants outside the HOVER_LIFT family.
    square && hoverLiftSquareOverride(variant),
    className,
  )

  // A square button is icon-only — a slab would just repaint the whole surface.
  const slab = iconSlab && !square

  const iconClass = (side: 'left' | 'right') =>
    twMerge(
      ICON_BASE,
      ICON_SIZE[size],
      slab &&
        twMerge(
          SLAB_BASE,
          SLAB_SIZE[size],
          side === 'left' ? SLAB_LEFT[size] : SLAB_RIGHT[size],
          SURFACE_ICON[variant],
          SURFACE_ICON_HOVER[variant],
        ),
    )

  const inner = (
    <>
      {leftIcon && (
        <span aria-hidden="true" className={iconClass('left')}>
          {leftIcon}
        </span>
      )}
      {children}
      {rightIcon && (
        <span aria-hidden="true" className={iconClass('right')}>
          {rightIcon}
        </span>
      )}
    </>
  )

  if (as === 'span') {
    return (
      <span className={classes} {...(props as HTMLAttributes<HTMLSpanElement>)}>
        {inner}
      </span>
    )
  }

  if (href !== undefined) {
    return (
      <a href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {inner}
      </a>
    )
  }

  return (
    <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {inner}
    </button>
  )
}
