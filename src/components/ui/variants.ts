export type Variant =
  | 'primary'
  | 'ghost'
  | 'glass-light'
  | 'glass-dark'
  | 'white'

export type Size = 'sm' | 'md' | 'lg'

export const SURFACE: Record<Variant, string> = {
  primary: 'text-blue-800 bg-gradient-to-br from-white to-blue-50',
  ghost:   'text-blue-950/60',
  'glass-light': 'text-white glass-blur bg-white/10 border border-white/20',
  'glass-dark':  'text-white glass-blur bg-blue-950/20 border border-blue-950/20',
  white:   'bg-white border border-blue-950/10 text-blue-950',
}

export const SURFACE_HOVER: Record<Variant, string> = {
  primary: 'hover:text-white hover:from-blue-600 hover:to-blue-700',
  ghost:   'hover:text-blue-950',
  'glass-light': 'hover:bg-blue-950/50 hover:border-blue-950/20 transition-all',
  'glass-dark':  'hover:bg-blue-950/50 hover:border-blue-950/20 transition-all',
  white:   'hover:bg-blue-50 transition-all',
}
