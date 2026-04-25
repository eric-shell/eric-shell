export type Variant =
  | 'primary'
  | 'ghost'
  | 'glass-light'
  | 'glass-dark'

export type Size = 'sm' | 'md' | 'lg'

export const SURFACE: Record<Variant, string> = {
  primary: 'bg-white text-blue-800',
  ghost:   'text-blue-950/60',
  'glass-light': 'glass-blur bg-white/10 border border-white/20 text-white',
  'glass-dark':  'glass-blur bg-blue-950/20 border border-blue-950/20 text-white',
}

export const SURFACE_HOVER: Record<Variant, string> = {
  primary: 'hover:bg-blue-700 hover:text-white',
  ghost:   'hover:text-blue-950',
  'glass-light': 'hover:bg-blue-950/50 hover:border-blue-950/20 transition-all',
  'glass-dark':  'hover:bg-blue-950/50 hover:border-blue-950/20 transition-all',
}
