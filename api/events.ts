import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_lib/db.js'
import { checkRateLimit } from './_lib/ratelimit.js'
import { readVisitorId, upsertVisitor } from './_lib/visitor.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Must stay in step with VisitorEventType (src/lib/telemetry.ts) AND with the
// `type` check constraint on visitor_events. A type present here but missing
// from the constraint is dropped silently by the catch below — see db/schema.sql.
const VALID_TYPES = [
  'ada_toggle',
  'chat_cleared',
  'speech_input',
  'outbound_click',
  'filter_apply',
  'chat_error',
  'section_error',
]

/**
 * Ceiling on the serialized metadata blob.
 *
 * `metadata` is a jsonb column fed straight from a client-supplied object, so
 * without a bound any caller can push arbitrarily large documents into the
 * table. The real payloads are a few hundred bytes; anything past this is not a
 * visitor. Dropped rather than truncated — half a JSON document is not JSON,
 * and the event itself is still worth recording without it.
 */
const MAX_METADATA_BYTES = 2048

function safeMetadata(value: unknown): string | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null
  try {
    const json = JSON.stringify(value)
    return json.length > MAX_METADATA_BYTES ? null : json
  } catch {
    // Circular or otherwise unserializable.
    return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const rate = await checkRateLimit(req, 'events', [
    { name: 'burst',  windowMs: 60_000,    max: 10 },
    { name: 'hourly', windowMs: 3_600_000, max: 200 },
  ])
  if (rate.limited) {
    return res.status(204).end()
  }

  const { visitorId, type, metadata } = req.body ?? {}
  const id = typeof visitorId === 'string' ? visitorId.toLowerCase() : null

  if (!id || !UUID_RE.test(id) || !VALID_TYPES.includes(type)) {
    return res.status(204).end()
  }

  try {
    const db = sql()
    // Prefer the shared upsert: it captures user-agent, IP-derived geo, and
    // referrer from this request. Falling back to a bare insert would create a
    // metadata-less row, and an events-only visitor (toggled high-contrast but
    // never sent a message) would never reach chat.ts/contact.ts to be filled in.
    // upsertVisitor keys off the X-Visitor-Id header, so only use it when that
    // agrees with the body id — otherwise we'd enrich one row and FK-insert the
    // event against another that may not exist.
    const upserted = readVisitorId(req) === id ? await upsertVisitor(req) : null
    if (!upserted) {
      await db`
        insert into visitors (id) values (${id})
        on conflict (id) do update set last_seen_at = now()
      `
    }
    // The upsert's return value, not `id`: it resolves through the session's
    // owner, so the two differ exactly when this browser's visitor id has
    // drifted mid-visit. Writing `id` here would recreate the split the
    // resolution exists to close (and FK-fail against a row never written).
    await db`
      insert into visitor_events (visitor_id, type, metadata)
      values (${upserted ?? id}, ${type}, ${safeMetadata(metadata)})
    `
  } catch {
    // best-effort
  }

  res.status(204).end()
}
