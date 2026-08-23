import type { ReactNode } from 'react'

/**
 * The number in the middle of a ring, and its qualifier underneath.
 *
 * Shared so the three circular cards cannot drift: they had already duplicated
 * this markup byte for byte in two of the three, and the third had its own copy
 * at a different type scale. On identical rings sitting on one line, a 22px
 * centre next to a 26px centre reads as a rendering fault rather than a
 * hierarchy.
 *
 * `hero` is the one sanctioned difference — the KPI's value outranks a stat
 * tile's 26px, which is what marks it as the headline of the panel. Exactly one
 * card in the row may use it.
 *
 * Rendered as HTML over the svg rather than as `<text>`: it inherits the site's
 * sans and its proportional figures. `tabular-nums` would make a value like
 * 12% look loose at this size.
 */
export default function RingCentre({ value, sub, hero = false }: {
  value: ReactNode
  sub: ReactNode
  hero?: boolean
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <span
        className={`font-sans font-semibold leading-none text-white ${hero ? 'text-[34px]' : 'text-[22px]'}`}
      >
        {value}
      </span>
      <span className={`mt-1 text-white/70 ${hero ? 'text-[11px]' : 'text-[10px]'}`}>{sub}</span>
    </div>
  )
}
