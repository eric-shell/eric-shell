import type { CSSProperties } from 'react'

/**
 * Shared paint + helpers for the admin's charts.
 *
 * SVG and CSS both accept custom properties, so every colour here stays tied to
 * the single definition in index.css rather than restating a hex the theme could
 * drift from.
 *
 * WHY THERE IS NO CATEGORICAL PALETTE HERE. Every step of the brand blue ramp
 * sits below the dataviz chroma floor (blue-600 is C 0.091) and "reads gray" as
 * a data mark, so the palette cannot carry a multi-series categorical chart —
 * this is documented in CLAUDE.md and was learned the hard way. Every chart in
 * the insights panel is therefore a **single series** or an **ordinal ramp**,
 * which is exactly what one hue is good at.
 */

/** oklch(0.720 0.150 225) → #03b5e4. 7.71:1 on the blue-950 canvas. */
export const ACCENT = 'var(--color-accent)'
/** oklch(0.450 0.130 240) → #005b88. 2.47:1 on the canvas — marks only, always labelled. */
export const ACCENT_DEEP = 'var(--color-accent-deep)'
/** The canvas the marks sit on; used for surface gaps and mark rings. */
export const SURFACE = 'var(--color-blue-950)'

/**
 * A step of the ordinal ramp, `t` from 0 (deep) to 1 (bright).
 *
 * Validated with the dataviz skill's `validate_palette.js --ordinal --mode dark
 * --surface "#111521"`, at both the 3-step and 4-step resolutions used here:
 *
 *   4 steps  #005b88,#0078a7,#0196c6,#03b5e4  → ALL PASS
 *   3 steps  #005b88,#0087b7,#03b5e4          → ALL PASS
 *
 * (monotone L, adjacent ΔL ≥ 0.06, hue spread 15°, dark end 2.47:1 vs surface).
 * The dark end clears the 2.0:1 ordinal floor but not the 3:1 mark floor, so
 * every ramp step in this panel also carries a visible label — never colour
 * alone. `color-mix` in oklch reproduces the same interpolation the validated
 * hexes came from, so the tokens stay the single source of truth.
 */
export function ordinalStep(t: number): string {
  const pct = Math.round(Math.min(1, Math.max(0, t)) * 100)
  return `color-mix(in oklch, ${ACCENT} ${pct}%, ${ACCENT_DEEP})`
}

/**
 * Where the smallest *non-zero* value in a series sits on the ramp, 0 being
 * ACCENT_DEEP and 1 being ACCENT. See `magnitudeStep`.
 */
export const MAGNITUDE_FLOOR = 0.2

/**
 * A ramp step for one bar in a single series, keyed to its share of the
 * largest bar: the peak is ACCENT, the tail runs deep. Zero returns
 * ACCENT_DEEP — callers dim it separately, because "no data" is a state and
 * not a small value.
 *
 * This deliberately re-encodes what bar length already says. The redundancy is
 * the point: these charts are 8px-tall rows and 4px-wide columns in a third of
 * a dashboard row, where a 3px bar and a 5px bar are the same bar. Colour is
 * what separates them at a glance, and it keeps every chart in the panel
 * drawing from one vocabulary instead of one flat cyan and one ramp.
 *
 * MAGNITUDE_FLOOR is load-bearing. A raw `value / max` puts a 1-of-40 row at
 * t≈0.02, and the bottom of the ramp is 2.55:1 on the blue-950 canvas — under
 * the 3:1 floor for a non-text mark, on exactly the marks that are hardest to
 * find. Starting at 0.2 makes the dimmest bar #006da6 at 3.23:1; the peak is
 * #00b6eb at 7.73:1. Lower the floor and the tail stops being locatable.
 *
 * Scaled to `max` rather than the total, so a series with one dominant row
 * still shows shape in its tail.
 */
export function magnitudeStep(value: number, max: number): string {
  if (value <= 0 || max <= 0) return ACCENT_DEEP
  return ordinalStep(MAGNITUDE_FLOOR + (1 - MAGNITUDE_FLOOR) * Math.min(1, value / max))
}

/** Soft glow for a data mark. Paint-only — it never changes layout. */
export const GLOW = `drop-shadow(0 0 6px color-mix(in oklch, ${ACCENT} 45%, transparent))`

/**
 * Tooltip chrome, shared by every chart that has one.
 *
 * Spread over `defaultStyles` from @visx/tooltip at the call site, which is
 * where the positioning comes from. Lives here because two charts draw one and
 * a third will: a readout that is 11px on one card and 12px on another is the
 * same disconnect the hourly strip's paint used to have.
 */
export const TOOLTIP_STYLE: CSSProperties = {
  background: `color-mix(in oklch, ${SURFACE} 92%, transparent)`,
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 8,
  color: '#fff',
  padding: '6px 10px',
  fontSize: 11,
  lineHeight: 1.3,
  boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
  // The pointer must never be able to land on the readout it just summoned —
  // that flickers the tooltip it is standing on.
  pointerEvents: 'none',
}

/**
 * Read once at module scope rather than per render: these charts only need it
 * to decide whether to run an entrance transition at all, and a hook would make
 * every leaf component stateful for a value that effectively never changes
 * mid-session.
 */
export const PREFERS_REDUCED_MOTION =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** `12` → `12%`, with the sign of an empty denominator handled honestly. */
export function share(value: number, total: number): number {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

/**
 * Label a referrer host for display.
 *
 * An empty host means the browser sent no referrer — typed, bookmarked, or a
 * privacy-stripped link. That is genuinely "direct", not "unknown". A host
 * matching this page's own is an internal navigation that started a fresh
 * session, which is a different thing again and should not be counted as an
 * external source.
 */
export function labelSource(host: string): string {
  if (!host) return 'Direct / none'
  if (typeof window !== 'undefined' && host === window.location.hostname.replace(/^www\./, '')) {
    return `${host} (internal)`
  }
  return host
}

/**
 * Whole-hour offset from UTC, or `null` when the reader's zone is not a whole
 * number of hours off (India, Nepal, parts of Australia). The hourly chart
 * buckets in UTC, so a half-hour zone cannot be shifted without misplacing
 * counts — it falls back to labelling the axis as UTC instead of quietly
 * showing the wrong hour.
 */
export function localHourOffset(): number | null {
  const minutes = -new Date().getTimezoneOffset()
  return minutes % 60 === 0 ? minutes / 60 : null
}

/** `0` → `12am`, `13` → `1pm`. Compact enough for a 24-column axis. */
export function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24
  if (h === 0) return '12am'
  if (h === 12) return '12pm'
  return h < 12 ? `${h}am` : `${h - 12}pm`
}
