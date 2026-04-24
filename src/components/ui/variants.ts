export type Variant =
  | 'darker'
  | 'dark'
  | 'light'
  | 'lighter'
  | 'primary'
  | 'ghost'
  | 'glass-light'
  | 'glass-dark'
  | 'glass-white'

export type Size = 'sm' | 'md' | 'lg'

export const SURFACE: Record<Variant, string> = {
  darker:  'bg-black text-white',
  dark:    'bg-blue-950 text-white',
  light:   'bg-blue-50 text-blue-950',
  lighter: 'bg-white text-blue-950',
  primary: 'bg-white text-blue-700',
  ghost:   'text-blue-950/60',
  'glass-light': 'glass-blur bg-white/10 border border-white/20 text-white',
  'glass-dark':  'glass-blur bg-blue-950/20 border border-blue-950/20 text-white',
  'glass-white': 'glass-blur bg-blue-50/60 border border-blue-950/10 text-blue-950',
}

export const SURFACE_HOVER: Record<Variant, string> = {
  darker:  'hover:bg-black/90',
  dark:    'hover:bg-blue-950/90',
  light:   'hover:bg-blue-50/80',
  lighter: 'hover:bg-blue-50',
  primary: 'hover:bg-blue-700 hover:text-white',
  ghost:   'hover:text-blue-950',
  'glass-light': 'hover:bg-blue-950/50 hover:border-blue-950/20 transition-all',
  'glass-dark':  'hover:bg-blue-950/50 hover:border-blue-950/20 transition-all',
  'glass-white': '',
}
