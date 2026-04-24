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
  dark:    'bg-off-black text-white',
  light:   'bg-off-white text-off-black',
  lighter: 'bg-white text-off-black',
  primary: 'bg-white text-blue',
  ghost:   'text-off-black/60',
  'glass-light': 'glass-blur bg-white/10 border border-white/20 text-white',
  'glass-dark':  'glass-blur bg-off-black/20 border border-off-black/20 text-white',
  'glass-white': 'glass-blur bg-off-white/60 border border-off-black/10 text-off-black',
}

export const SURFACE_HOVER: Record<Variant, string> = {
  darker:  'hover:bg-black/90',
  dark:    'hover:bg-off-black/90',
  light:   'hover:bg-off-white/80',
  lighter: 'hover:bg-off-white',
  primary: 'hover:bg-blue hover:text-white',
  ghost:   'hover:text-off-black',
  'glass-light': 'hover:bg-off-black/50 hover:border-off-black/20 transition-all',
  'glass-dark':  'hover:bg-off-black/50 hover:border-off-black/20 transition-all',
  'glass-white': '',
}
