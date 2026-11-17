/**
 * Every surface on the site. `Button`, `Panel`, `Pill` and `Toast` read these
 * maps; nothing outside `components/ui` may (ESLint enforces it), so a surface
 * is always named, never spelled out in classes at a call site.
 *
 * Which one goes where:
 *
 *   on a lum field    `white` (the main action), `tint-white` (the second one)
 *   on an ink field   `luminous` (the main action), `tint-ink`, `raised-dark`
 *   on white          `luminous` (the main action), `outline` (everything else)
 *
 * There is deliberately no default. Each of these is right on one kind of
 * field and wrong on another, so the call site has to say which it means.
 */
export type Variant =
  /** Solid Luminous Blue, white label (5.5:1). The main action on white or ink. */
  | 'luminous'
  /** Solid white, ink label, no border. The main action on a lum field, and the
   *  fill of every white card. Invisible on white: use `outline` there. */
  | 'white'
  /** White with an ink hairline, for a white control sitting on white. */
  | 'outline'
  /** A flat white tint for the second action on a lum field. Label 4.6:1. */
  | 'tint-white'
  /** A flat ink tint for a quiet control on a lum field or inside a notice. */
  | 'tint-ink'
  /** Raised surface for the ink canvas: the admin's panels. */
  | 'raised-dark'
  /** Notice panels: a toast, an inline error. Deep fill, bright border, white
   *  label. Surfaces to read, not buttons to press. */
  | 'notice-error'
  | 'notice-success'
  | 'notice-info'
  /**
   * Status buttons. Both share one lightness (L 0.546) and hover by gaining
   * chroma, never by darkening: they land on white and on ink alike, and a fill
   * that darkens walks toward the ink canvas at the moment it is pointed at.
   * See the derivation beside the tokens in index.css.
   */
  | 'success'
  | 'error'

export type Size = 'sm' | 'md' | 'lg'

export const SURFACE: Record<Variant, string> = {
  luminous:         'text-white bg-lum border border-transparent',
  white:            'text-ink bg-white border border-transparent',
  outline:          'text-ink bg-white border border-ink/10',
  'tint-white':     'text-white bg-white/10 border border-white/30',
  'tint-ink':       'text-white bg-ink/40 border border-white/10',
  'raised-dark':    'text-white bg-white/[0.055] border border-white/10',
  'notice-error':   'text-white bg-error-deep border border-error-bright/50',
  'notice-success': 'text-white bg-success-deep border border-success-bright/50',
  'notice-info':    'text-white bg-ink border border-glow/40',
  success:          'text-white bg-success border border-transparent inset-shadow-highlight',
  error:            'text-white bg-error border border-transparent inset-shadow-highlight',
}

/**
 * Translucent darkening layer behind a Button's leading or trailing icon.
 * Alpha only, so it tracks whatever the surface underneath is doing, hover
 * included, instead of restating each variant's colour.
 */
export const SURFACE_ICON: Record<Variant, string> = {
  luminous:         'bg-ink/25',
  white:            'bg-ink/6',
  outline:          'bg-ink/6',
  'tint-white':     'bg-ink/15',
  'tint-ink':       'bg-ink/25',
  'raised-dark':    'bg-white/10',
  'notice-error':   'bg-ink/25',
  'notice-success': 'bg-ink/25',
  'notice-info':    'bg-white/10',
  success:          'bg-ink/25',
  error:            'bg-ink/25',
}

export const SURFACE_ICON_HOVER: Record<Variant, string> = {
  luminous:         'group-hover:bg-ink/40',
  white:            'group-hover:bg-ink/10',
  outline:          'group-hover:bg-ink/10',
  'tint-white':     'group-hover:bg-ink/25',
  'tint-ink':       'group-hover:bg-ink/35',
  'raised-dark':    'group-hover:bg-white/20',
  'notice-error':   'group-hover:bg-ink/40',
  'notice-success': 'group-hover:bg-ink/40',
  'notice-info':    'group-hover:bg-white/20',
  // The status fills hold their lightness on hover, so the slab deepens
  // further than the rest to carry the depth cue.
  success:          'group-hover:bg-ink/45',
  error:            'group-hover:bg-ink/45',
}

/**
 * A lit top edge plus an inset hairline, for every solid fill. Inset, so it
 * reads against the fill rather than the canvas and behaves the same on white
 * and on ink. It is what keeps `luminous` visible when hovered on ink, where
 * its darker hover fill alone is 2.4:1 against the canvas. Kept faint on
 * purpose: an early pass at 0.40/0.22 read as a halo rather than an edge.
 */
const HOVER_LIFT = 'hover:inset-shadow-highlight-strong hover:inset-ring hover:inset-ring-white/14'

/** Variants whose hover includes `HOVER_LIFT`. */
const HOVER_LIFT_FAMILY: readonly Variant[] = ['luminous', 'success', 'error']

/**
 * For `shape="square"` buttons in the `HOVER_LIFT` family: drops the hairline
 * ring and keeps the top highlight. At a tight circular radius the ring wraps
 * the whole perimeter and reads as a halo. Returns `''` for every other
 * variant. Consumed by `Button`.
 */
export function hoverLiftSquareOverride(variant: Variant): string {
  return HOVER_LIFT_FAMILY.includes(variant) ? 'hover:inset-ring-0' : ''
}

export const SURFACE_HOVER: Record<Variant, string> = {
  /** Darkens one step to lum-deep: 7.0:1 against the white label. */
  luminous:         `hover:bg-lum-deep ${HOVER_LIFT}`,
  white:            'hover:bg-ice',
  outline:          'hover:bg-ice',
  'tint-white':     'hover:bg-ink/40',
  'tint-ink':       'hover:bg-ink/60',
  'raised-dark':    'hover:bg-white/[0.09] hover:border-white/20',
  'notice-error':   'hover:border-error-bright/70',
  'notice-success': 'hover:border-success-bright/70',
  'notice-info':    'hover:border-glow/60',
  success:          `hover:bg-success-hover ${HOVER_LIFT}`,
  error:            `hover:bg-error-hover ${HOVER_LIFT}`,
}

/**
 * The classes for a surface, for the rare element that is neither a `Button`
 * nor a `Panel` but must look like one (a segmented control's selected
 * segment). Exported from the ui barrel; the maps above are not.
 */
export function surface(variant: Variant, { hover = false }: { hover?: boolean } = {}): string {
  return hover ? `${SURFACE[variant]} ${SURFACE_HOVER[variant]}` : SURFACE[variant]
}
