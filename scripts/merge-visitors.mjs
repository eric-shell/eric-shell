#!/usr/bin/env node
/**
 * Fold one visitor record into another.
 *
 *   node scripts/merge-visitors.mjs <keepId> <mergeId>           # dry run
 *   node scripts/merge-visitors.mjs <keepId> <mergeId> --apply   # commit
 *
 * For the case where one human ended up as two rows: a visitor id that changed
 * mid-visit forks every later write onto a second record. `/api/track` and
 * `upsertVisitor` now resolve identity through the session's established owner
 * (see api/_lib/visitor.ts), so new forks shouldn't appear — this repairs the
 * ones that already did.
 *
 * `keepId` should be the id that owns the shared `visitor_sessions` row, so the
 * repaired data agrees with the rule the server now enforces. The script says so
 * if the pair disagrees, and refuses ids it can't find.
 *
 * Everything runs in one transaction: child rows are repointed, the surviving
 * row's null columns are backfilled from the loser (never overwritten — the
 * earlier sighting wins, same rule as the upserts), timestamps take the widest
 * span, and the merged row is deleted.
 */
import { readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const [keepId, mergeId, ...flags] = process.argv.slice(2)
const apply = flags.includes('--apply')

if (!UUID_RE.test(keepId ?? '') || !UUID_RE.test(mergeId ?? '')) {
  console.error('usage: node scripts/merge-visitors.mjs <keepId> <mergeId> [--apply]')
  process.exit(1)
}
if (keepId.toLowerCase() === mergeId.toLowerCase()) {
  console.error('keepId and mergeId are the same visitor')
  process.exit(1)
}

const url = process.env.POSTGRES_URL
  ?? readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .match(/^POSTGRES_URL="?([^"\n]+)"?/m)?.[1]
if (!url) throw new Error('POSTGRES_URL not set and not found in .env.local')
const sql = neon(url)

const CHILDREN = ['page_views', 'chat_messages', 'visitor_events', 'contact_submissions', 'visitor_sessions']

const [keep] = await sql`select * from visitors where id = ${keepId}::uuid`
const [merge] = await sql`select * from visitors where id = ${mergeId}::uuid`
if (!keep)  { console.error(`no visitor ${keepId}`);  process.exit(1) }
if (!merge) { console.error(`no visitor ${mergeId}`); process.exit(1) }

console.log(`keep  ${keep.id}  first_seen ${keep.first_seen_at.toISOString()}  notes: ${keep.notes ?? '—'}`)
console.log(`merge ${merge.id}  first_seen ${merge.first_seen_at.toISOString()}  notes: ${merge.notes ?? '—'}`)

for (const table of CHILDREN) {
  const [row] = await sql.query(`select count(*)::int as n from ${table} where visitor_id = $1`, [mergeId])
  console.log(`  ${table.padEnd(20)} ${row.n} row(s) to repoint`)
}

// The rule the server now enforces: whoever owns the session owns the identity.
const shared = await sql`
  select id, visitor_id from visitor_sessions
  where id in (select distinct session_id from page_views where visitor_id in (${keepId}::uuid, ${mergeId}::uuid))
`
for (const s of shared) {
  const owner = s.visitor_id === keepId ? 'keep' : s.visitor_id === mergeId ? 'MERGE' : 'a third visitor'
  console.log(`  session ${s.id} is owned by ${owner}`)
  if (s.visitor_id === mergeId) {
    console.log('  ⚠️  the session belongs to mergeId — consider running this the other way round')
  }
}

if (!apply) {
  console.log('\ndry run — nothing written. Re-run with --apply to commit.')
  process.exit(0)
}

await sql.transaction([
  sql`update page_views          set visitor_id = ${keepId}::uuid where visitor_id = ${mergeId}::uuid`,
  sql`update chat_messages       set visitor_id = ${keepId}::uuid where visitor_id = ${mergeId}::uuid`,
  sql`update visitor_events      set visitor_id = ${keepId}::uuid where visitor_id = ${mergeId}::uuid`,
  sql`update contact_submissions set visitor_id = ${keepId}::uuid where visitor_id = ${mergeId}::uuid`,
  sql`update visitor_sessions    set visitor_id = ${keepId}::uuid where visitor_id = ${mergeId}::uuid`,
  // Backfill only. The surviving row's own values are the earlier sighting and
  // stay authoritative; notes are concatenated because they are hand-written and
  // losing one silently would be worse than a slightly long field.
  sql`
    update visitors k set
      first_seen_at   = least(k.first_seen_at, m.first_seen_at),
      last_seen_at    = greatest(k.last_seen_at, m.last_seen_at),
      user_agent      = coalesce(k.user_agent, m.user_agent),
      country         = coalesce(k.country, m.country),
      city            = coalesce(k.city, m.city),
      region          = coalesce(k.region, m.region),
      timezone        = coalesce(k.timezone, m.timezone),
      client_timezone = coalesce(k.client_timezone, m.client_timezone),
      language        = coalesce(k.language, m.language),
      referrer        = coalesce(k.referrer, m.referrer),
      location_override = coalesce(k.location_override, m.location_override),
      notes = case
        when k.notes is null then m.notes
        when m.notes is null or m.notes = k.notes then k.notes
        else k.notes || E'\n' || m.notes
      end
    from visitors m
    where k.id = ${keepId}::uuid and m.id = ${mergeId}::uuid
  `,
  sql`delete from visitors where id = ${mergeId}::uuid`,
])

const [after] = await sql`
  select v.*,
    (select count(*)::int from page_views          where visitor_id = v.id) as page_views,
    (select count(*)::int from chat_messages       where visitor_id = v.id) as chat_messages,
    (select count(*)::int from visitor_events      where visitor_id = v.id) as events,
    (select count(*)::int from contact_submissions where visitor_id = v.id) as submissions,
    (select count(*)::int from visitor_sessions    where visitor_id = v.id) as sessions
  from visitors v where v.id = ${keepId}::uuid
`
console.log('\nmerged:', JSON.stringify(after, null, 1))
