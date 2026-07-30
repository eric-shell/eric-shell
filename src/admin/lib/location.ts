interface GeoFields {
  city: string | null
  region: string | null
  country: string | null
  location_override: string | null
}

export interface ResolvedLocation {
  /** Display string, or null when we know nothing at all. */
  label: string | null
  /** True when the label came from IP geolocation and may be badly wrong. */
  approximate: boolean
}

/**
 * Resolve the location to show for a visitor.
 *
 * IP geolocation is only as good as the client's egress address: mobile
 * carriers, CGNAT, and VPNs regularly report a city hundreds of miles off. So a
 * human-entered `location_override` always wins, and anything IP-derived is
 * flagged `approximate` so the UI can say so rather than presenting it as fact.
 */
export function resolveLocation(v: GeoFields | null | undefined): ResolvedLocation {
  if (!v) return { label: null, approximate: false }

  const override = v.location_override?.trim()
  if (override) return { label: override, approximate: false }

  // Region is a subdivision code (`CA`), so it only reads well next to a city.
  const parts = [v.city, v.city ? v.region : null, v.country].filter(Boolean)
  return { label: parts.length > 0 ? parts.join(', ') : null, approximate: true }
}
