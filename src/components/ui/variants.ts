export type Variant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'glass-light'
  | 'glass-dark'
  | 'error-glass'
  | 'success-glass'
  | 'white'
  /**
   * Raised surface for a dark canvas — the inverse of `white`. Unlike the
   * `glass-*` variants it applies no backdrop blur, so it is safe to use on
   * large, scrolling surfaces (the admin's visitor table) where blur would
   * repaint on every frame. Used by the admin CRM.
   */
  | 'raised-dark'
  /**
   * Semantic status fills. Solid, not gradients: a gradient has two different
   * contrast values and only one of them tends to get checked. Each fill is
   * validated for a white label AND for its boundary against both the light and
   * dark canvases — see the derivation note in index.css.
   *
   * The four are one family, not four independent picks: all share `primary`'s
   * lightness (blue-600 base / blue-700 hover) and sit at the same fraction of
   * their hue's available chroma, so they read at matching contrast and
   * vibrance and differ only in hue.
   *
   * `info` has no token of its own — it *is* the primary blue, flat rather than
   * gradient. It differs from `primary` in intent, not looks: `primary` is
   * "this is the main action here", `info` is "this action carries
   * neutral/informational status". Reach for `primary` for a CTA.
   */
  | 'info'
  | 'success'
  | 'warning'
  | 'error'

export type Size = 'sm' | 'md' | 'lg'

export const SURFACE: Record<Variant, string> = {
  primary:   'text-white bg-gradient-to-br from-blue-600 to-blue-700 border border-transparent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]',
  secondary: 'text-blue-800 bg-gradient-to-br from-white to-blue-50 border border-transparent',
  ghost:     'text-blue-950/60 border border-transparent',
  'glass-light': 'text-white glass-blur bg-white/10 border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.20)]',
  'glass-dark':  'text-white glass-blur bg-blue-950/20 border border-blue-950/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10)]',
  'error-glass':   'text-white glass-blur bg-red-950/85 border border-red-400/50',
  'success-glass': 'text-white glass-blur bg-green-950/85 border border-green-400/50',
  white:     'bg-white border border-blue-950/10 text-blue-950',
  'raised-dark': 'text-white bg-white/[0.055] border border-white/10',
  info:      'text-white bg-blue-600 border border-transparent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]',
  success:   'text-white bg-success border border-transparent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]',
  warning:   'text-white bg-warning border border-transparent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]',
  error:     'text-white bg-error border border-transparent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]',
}

/**
 * Translucent darkening layer behind a Button's leading/trailing icon.
 * Deliberately alpha-only so it tracks whatever the surface underneath is
 * doing — including the hover gradient — instead of restating each variant's
 * color.
 */
export const SURFACE_ICON: Record<Variant, string> = {
  primary:   'bg-blue-950/25',
  secondary: 'bg-blue-950/8',
  ghost:     'bg-blue-950/6',
  'glass-light': 'bg-blue-950/15',
  'glass-dark':  'bg-blue-950/25',
  'error-glass':   'bg-red-950/50',
  'success-glass': 'bg-green-950/50',
  white:     'bg-blue-950/6',
  'raised-dark': 'bg-white/10',
  info:      'bg-blue-950/25',
  success:   'bg-blue-950/25',
  warning:   'bg-blue-950/25',
  error:     'bg-blue-950/25',
}

export const SURFACE_ICON_HOVER: Record<Variant, string> = {
  primary:   'group-hover:bg-blue-950/35',
  secondary: 'group-hover:bg-blue-950/20',
  ghost:     'group-hover:bg-blue-950/10',
  'glass-light': 'group-hover:bg-blue-950/25',
  'glass-dark':  'group-hover:bg-blue-950/35',
  'error-glass':   'group-hover:bg-red-950/40',
  'success-glass': 'group-hover:bg-green-950/40',
  white:     'group-hover:bg-blue-950/10',
  'raised-dark': 'group-hover:bg-white/20',
  // Status variants deepen the slab further than the rest (/25 -> /45). Their
  // surface deliberately holds its lightness on hover, so the slab carries the
  // depth cue instead — and being alpha over a small region, it costs the
  // button nothing in contrast against the canvas behind it.
  info:      'group-hover:bg-blue-950/45',
  success:   'group-hover:bg-blue-950/45',
  warning:   'group-hover:bg-blue-950/45',
  error:     'group-hover:bg-blue-950/45',
}

export const SURFACE_HOVER: Record<Variant, string> = {
  primary:   'hover:from-blue-800 hover:to-blue-900',
  secondary: 'hover:text-white hover:from-blue-600 hover:to-blue-700',
  ghost:     'hover:text-blue-950',
  'glass-light': 'hover:bg-blue-950/50 hover:border-blue-950/20',
  'glass-dark':  'hover:bg-blue-950/50 hover:border-blue-950/20',
  'error-glass':   'hover:bg-red-700/40 hover:border-red-300/60',
  'success-glass': 'hover:bg-green-800/40 hover:border-green-300/60',
  white:     'hover:bg-blue-50',
  'raised-dark': 'hover:bg-white/[0.09] hover:border-white/20',
  /**
   * Status hovers gain chroma at a fixed lightness rather than darkening — see
   * the derivation in index.css. The paired shadow does the rest of the work:
   * it strengthens the existing top highlight and adds an inset hairline ring,
   * which is what gives a hover cue to buttons the icon slab can't reach
   * (no `leftIcon`/`rightIcon`, `iconSlab={false}`, or `shape="square"`).
   * Inset, so it reads against the fill and behaves the same on either canvas.
   */
  info:      'hover:bg-info-hover hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.40),inset_0_0_0_1px_rgba(255,255,255,0.22)]',
  success:   'hover:bg-success-hover hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.40),inset_0_0_0_1px_rgba(255,255,255,0.22)]',
  warning:   'hover:bg-warning-hover hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.40),inset_0_0_0_1px_rgba(255,255,255,0.22)]',
  error:     'hover:bg-error-hover hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.40),inset_0_0_0_1px_rgba(255,255,255,0.22)]',
}
