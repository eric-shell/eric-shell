export type Variant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'glass-light'
  | 'glass-dark'
  | 'error-glass'
  | 'success-glass'
  | 'white'

export type Size = 'sm' | 'md' | 'lg'

export const SURFACE: Record<Variant, string> = {
  primary:   'text-white bg-gradient-to-br from-blue-600 to-blue-700',
  secondary: 'text-blue-800 bg-gradient-to-br from-white to-blue-50',
  ghost:     'text-blue-950/60',
  'glass-light': 'text-white glass-blur bg-white/10 border border-white/20',
  'glass-dark':  'text-white glass-blur bg-blue-950/20 border border-blue-950/20',
  'error-glass':   'text-white glass-blur bg-red-600/30 border border-red-300/40',
  'success-glass': 'text-white glass-blur bg-green-700/30 border border-green-300/40',
  white:     'bg-white border border-blue-950/10 text-blue-950',
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
}
