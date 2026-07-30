#!/usr/bin/env node
/**
 * Seed / remove fake CRM data for local UI work.
 *
 *   node scripts/seed-crm.mjs seed [count]   # insert fixtures
 *   node scripts/seed-crm.mjs clean          # remove ALL fixtures
 *   node scripts/seed-crm.mjs status         # count real vs fake rows
 *
 * SAFETY: every fake visitor id looks like `5eedNNNN-…`, and `clean` deletes
 * exactly `where id::text like '5eed%'`. Sessions, page views, chat messages,
 * and events cascade from visitors; contact_submissions is `on delete set null`,
 * so those are deleted explicitly first — same order the admin delete endpoint
 * uses. A genuine random UUID starting `5eed` is a 1-in-65536 coincidence, so
 * `clean` additionally refuses any row that doesn't match the full fixture
 * shape before deleting it.
 *
 * There is no local Postgres in this project: POSTGRES_URL points at the shared
 * Neon branch. `status` prints the real-row count before and after so you can
 * confirm nothing real moved.
 */
import { readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'
import { buildFixtures, ID_PREFIX } from './crm-fixtures.mjs'

const LIKE = `${ID_PREFIX}%`
// Second gate so a real UUID that happens to start with '5eed' is never deleted.
const FIXTURE_RE = new RegExp(`^${ID_PREFIX}[0-9a-f]{4}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$`)

function connect() {
  const url = process.env.POSTGRES_URL
    ?? readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
      .match(/^POSTGRES_URL="?([^"\n]+)"?/m)?.[1]
  if (!url) throw new Error('POSTGRES_URL not set and not found in .env.local')
  return neon(url)
}

async function counts(sql) {
  const [row] = await sql`
    select
      (select count(*)::int from visitors where id::text not like ${LIKE})       as real_visitors,
      (select count(*)::int from visitors where id::text like ${LIKE})           as fake_visitors,
      (select count(*)::int from visitor_sessions)                              as sessions,
      (select count(*)::int from page_views)                                    as page_views,
      (select count(*)::int from chat_messages)                                 as chat_messages,
      (select count(*)::int from contact_submissions)                           as contacts`
  return row
}

async function clean(sql) {
  const candidates = await sql`select id from visitors where id::text like ${LIKE}`
  const ids = candidates.filter(({ id }) => FIXTURE_RE.test(id))
  const skipped = candidates.length - ids.length
  if (skipped > 0) console.warn(`refused ${skipped} row(s) matching '${LIKE}' but not the fixture shape`)
  for (const { id } of ids) {
    await sql`delete from contact_submissions where visitor_id = ${id}`
    await sql`delete from visitors where id = ${id}`
  }
  return ids.length
}

async function seed(sql, count) {
  const f = buildFixtures({ count })

  for (const v of f.visitors) {
    await sql`
      insert into visitors (id, first_seen_at, last_seen_at, user_agent, country, city,
                            region, timezone, location_override, client_timezone, language,
                            referrer, notes)
      values (${v.id}, ${v.first_seen_at}, ${v.last_seen_at}, ${v.user_agent}, ${v.country},
              ${v.city}, ${v.region}, ${v.timezone}, ${v.location_override},
              ${v.client_timezone}, ${v.language}, ${v.referrer}, ${v.notes})
      on conflict (id) do nothing`
  }
  for (const s of f.sessions) {
    await sql`
      insert into visitor_sessions (id, visitor_id, started_at, last_beat_at, engaged_ms,
                                    max_scroll_pct, entry_path, referrer,
                                    viewport_w, viewport_h, screen_w, screen_h)
      values (${s.id}, ${s.visitor_id}, ${s.started_at}, ${s.last_beat_at}, ${s.engaged_ms},
              ${s.max_scroll_pct}, ${s.entry_path}, ${s.referrer},
              ${s.viewport_w}, ${s.viewport_h}, ${s.screen_w}, ${s.screen_h})
      on conflict (id) do nothing`
  }
  for (const p of f.pageViews) {
    await sql`
      insert into page_views (visitor_id, session_id, path, referrer, created_at)
      values (${p.visitor_id}, ${p.session_id}, ${p.path}, ${p.referrer}, ${p.created_at})`
  }
  for (const c of f.chats) {
    await sql`
      insert into chat_messages (visitor_id, role, content, created_at)
      values (${c.visitor_id}, ${c.role}, ${c.content}, ${c.created_at})`
  }
  for (const c of f.contacts) {
    await sql`
      insert into contact_submissions (visitor_id, name, email, message, created_at)
      values (${c.visitor_id}, ${c.name}, ${c.email}, ${c.message}, ${c.created_at})`
  }
  for (const e of f.events) {
    await sql`
      insert into visitor_events (visitor_id, type, metadata)
      values (${e.visitor_id}, ${e.type}, ${e.metadata ? JSON.stringify(e.metadata) : null})`
  }
  return f
}

const cmd = process.argv[2] ?? 'status'
const count = Number(process.argv[3]) || 28
const sql = connect()

console.log('before:', await counts(sql))

if (cmd === 'seed') {
  const removed = await clean(sql) // idempotent: reseeding replaces, never duplicates
  if (removed) console.log(`(removed ${removed} existing fixture visitors first)`)
  const f = await seed(sql, count)
  console.log(`seeded ${f.visitors.length} visitors, ${f.sessions.length} sessions, ` +
              `${f.pageViews.length} page views, ${f.chats.length} chat messages, ` +
              `${f.contacts.length} contacts, ${f.events.length} events`)
} else if (cmd === 'clean') {
  console.log(`removed ${await clean(sql)} fixture visitors`)
} else if (cmd !== 'status') {
  console.error(`unknown command: ${cmd} (use seed | clean | status)`)
  process.exit(1)
}

console.log('after: ', await counts(sql))
