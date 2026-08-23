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
 * ONE SIZE, no variants. There was a `hero` flag that drew the KPI at 34px and
 * the other two at 22px, on the theory that the panel needed a headline. Three
 * identical rings on one line with one number visibly larger than the others
 * did not read as hierarchy, it read as a mistake, so the three now match and
 * 34px is the size they match at. The insight row is deliberately a set of
 * peers.
 *
 * Rendered as HTML over the svg rather than as `<text>`: it inherits the site's
 * sans and its proportional figures. `tabular-nums` would make a value like
 * 12% look loose at this size.
 */
export default function RingCentre({ value, sub }: {
  value: ReactNode
  sub: ReactNode
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      {/* Comfortably inside the ring: the track's inner diameter is 75 viewBox
          units, about 132px at this card's width, against roughly 52px of
          stacked type. A four-figure total still clears it. */}
      <span className="font-sans text-[34px] font-semibold leading-none text-white">{value}</span>
      <span className="mt-1 text-[11px] text-white/70">{sub}</span>
    </div>
  )
}
