/**
 * Where the link sits.
 *   lum      in body copy on white: Luminous Blue text (7.0:1), a soft underline.
 *   field    in copy on a lum or ink field: the field's own text colour.
 *   inherit  in small print, where the link should stay as quiet as its sentence.
 */
export type TextLinkTone = 'lum' | 'field' | 'inherit'

export const TEXT_LINK: Record<TextLinkTone, string> = {
  lum: 'font-semibold text-lum-deep underline decoration-lum/40 underline-offset-[3px] hover:decoration-lum transition-colors',
  field: 'grad-hover underline underline-offset-4 decoration-white/50 hover:decoration-white',
  inherit: 'underline underline-offset-2 hover:opacity-80 transition-opacity',
}
