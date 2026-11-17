/**
 * The look of a labelled text field, shared by `Input` and `Textarea` so the
 * two cannot drift. Not exported from the barrel: a call site wants one of
 * those components, not these strings.
 *
 * Two tones, named for the surface the field sits on:
 *   white  on a white card (the contact form). The default.
 *   dark   on the ink canvas (the admin's sign-in).
 *
 * The field shows focus by its border, not the global ring, because the ring
 * around a pill-shaped field inside a card reads as a second border.
 */
export type FieldTone = 'white' | 'dark'

interface FieldState {
  tone: FieldTone
  valid: boolean
  error: boolean
}

const BASE = 'w-full rounded-lg border px-4 py-3 font-sans text-sm focus:outline-none transition disabled:opacity-50'

const TONE: Record<FieldTone, string> = {
  white: 'bg-white text-ink placeholder:text-ink-mute',
  dark: 'bg-white/10 text-white placeholder:text-white/60 focus:bg-white/15',
}

const BORDER: Record<FieldTone, { error: string; valid: string; rest: string }> = {
  white: {
    error: 'border-error focus:border-error',
    valid: 'border-lum focus:border-lum',
    rest: 'border-ink/20 focus:border-lum',
  },
  dark: {
    error: 'border-error-bright focus:border-error-bright',
    valid: 'border-white focus:border-white',
    rest: 'border-white/20 focus:border-white/60',
  },
}

export function fieldClass({ tone, valid, error }: FieldState): string {
  const border = BORDER[tone]
  return `${BASE} ${TONE[tone]} ${error ? border.error : valid ? border.valid : border.rest}`
}

export const FIELD_LABEL: Record<FieldTone, string> = {
  white: 'font-sans text-sm font-semibold text-ink',
  dark: 'font-sans text-sm font-semibold text-white',
}

export const FIELD_COUNT: Record<FieldTone, string> = {
  white: 'font-sans text-xs text-ink-mute text-right',
  dark: 'font-sans text-xs text-white/60 text-right',
}
