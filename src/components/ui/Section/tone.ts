/**
 * The field a section stands on.
 *   lum      solid Luminous Blue, white text.
 *   ink      the dark field (the hero's surround, the footer, the admin).
 *   white    white, ink text.
 *   inherit  a sub-section of a field that is already set (a block on a Sheet).
 */
export type Tone = 'lum' | 'ink' | 'white' | 'inherit'

/**
 * Colour, text colour, and the focus-ring colour that reads on that field. The
 * ring is why a tone is more than a background class: a blue ring on a blue
 * field is 1.4:1.
 */
export const TONE: Record<Tone, string> = {
  lum: 'bg-lum text-white focus-on-field',
  ink: 'bg-ink text-white focus-on-field',
  white: 'bg-white text-ink focus-on-paper',
  inherit: '',
}
