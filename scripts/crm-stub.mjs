#!/usr/bin/env node
/**
 * Fixture data and browser stubs for the admin CRM, shared by every script
 * that needs to render it without a database.
 *
 * Two consumers so far and they want different things from the same setup:
 * `crm-ui-check.mjs` measures overflow across six widths, and
 * `capture-note-shots.mjs` photographs it for the notes section. Keeping the
 * fixtures in one place is what stops a screenshot in a published note from
 * showing a panel shaped differently to the one the checker passes.
 *
 * Nothing here touches Neon and nothing needs the admin password: the routes
 * are intercepted in the page.
 */
import { buildFixtures } from './crm-fixtures.mjs'

export const fixtures = buildFixtures({ count: 28 })
const f = fixtures
export const target = f.visitors.find(v => v.chat_message_count > 0 && v.contact_count > 0) ?? f.visitors[0]

export function detailFor(v) {
  // Match the real endpoint's `order by started_at desc` so the harness would
  // actually catch an ordering regression in the UI.
  const sessions = f.sessions.filter(s => s.visitor_id === v.id)
    .sort((a, b) => b.started_at.localeCompare(a.started_at))
  return {
    visitor: v,
    messages: f.chats.filter(c => c.visitor_id === v.id)
      .map(({ id, role, content, created_at }) => ({ id, role, content, created_at })),
    submissions: f.contacts.filter(c => c.visitor_id === v.id)
      .map(({ id, name, email, message, created_at }) => ({ id, name, email, message, created_at })),
    events: Object.fromEntries(
      Object.entries(f.events.filter(e => e.visitor_id === v.id)
        .reduce((acc, e) => ({ ...acc, [e.type]: (acc[e.type] ?? 0) + 1 }), {}))),
    clearEvents: [],
    sessions,
    // The real endpoint returns newest-first.
    pageViews: f.pageViews.filter(p => p.visitor_id === v.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  }
}

const days = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(Date.now() - (13 - i) * 86_400_000)
  return { date: d.toISOString().slice(0, 10), visitors: 2 + ((i * 5) % 13) }
})

/**
 * The insights aggregate, computed from the same fixtures so the panel renders
 * numbers that agree with the table. Mirrors the SQL in api/admin/insights.ts,
 * including the derived scroll-depth cutoff — the first session recording a
 * value strictly between 0 and 100 is the earliest the column can be trusted
 * from, because the pre-fix client pinned every session at 100 and 0 is just the
 * column default.
 */
function buildInsights() {
  const since = f.sessions
    .filter(s => s.max_scroll_pct > 0 && s.max_scroll_pct < 100)
    .map(s => s.started_at)
    .sort()[0] ?? null
  const measured = since ? f.sessions.filter(s => s.started_at >= since) : []
  const reach = pct => measured.filter(s => s.max_scroll_pct >= pct).length

  const tally = (rows, key) => {
    const counts = new Map()
    for (const row of rows) counts.set(row[key], (counts.get(row[key]) ?? 0) + 1)
    return counts
  }

  const host = ref => {
    if (!ref) return ''
    return ref.split('://')[1]?.split('/')[0].replace(/^www\./, '').toLowerCase() ?? ''
  }

  const sourceCounts = new Map()
  for (const s of f.sessions) {
    const h = host(s.referrer)
    sourceCounts.set(h, (sourceCounts.get(h) ?? 0) + 1)
  }

  const pathCounts = tally(f.pageViews, 'path')
  const hourCounts = new Map()
  for (const p of f.pageViews) {
    const h = new Date(p.created_at).getUTCHours()
    hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1)
  }

  // The denominator: every visitor with any recorded activity, unioned across
  // the same tables the real query reads. Everything below is a subset of it,
  // which is what keeps the ring's segments inside their track.
  const active = new Set([
    ...f.sessions.map(s => s.visitor_id),
    ...f.pageViews.map(p => p.visitor_id),
    ...f.chats.map(c => c.visitor_id),
    ...f.events.map(e => e.visitor_id),
    ...f.contacts.map(c => c.visitor_id),
  ])
  const clicked = new Set(f.events.filter(e => e.type === 'outbound_click').map(e => e.visitor_id))
  const chatted = new Set(f.chats.filter(c => c.role === 'user').map(c => c.visitor_id))
  const contacted = new Set(f.contacts.map(c => c.visitor_id))
  const acted = new Set([...clicked, ...chatted, ...contacted])

  return {
    windowDays: 30,
    sessions: {
      total: f.sessions.length,
      scroll: {
        reach: { pct25: reach(25), pct50: reach(50), pct75: reach(75), pct90: reach(90) },
        measured: measured.length,
        excluded: f.sessions.length - measured.length,
        since,
      },
      viewport: {
        known: f.sessions.filter(s => s.viewport_w != null).length,
        phone: f.sessions.filter(s => s.viewport_w < 640).length,
        tablet: f.sessions.filter(s => s.viewport_w >= 640 && s.viewport_w < 1024).length,
        desktop: f.sessions.filter(s => s.viewport_w >= 1024).length,
      },
    },
    visitors: {
      total: active.size,
      acted: acted.size,
      // Overlapping totals. A visitor who did all three is in all three.
      clicked: clicked.size,
      chatted: chatted.size,
      contacted: contacted.size,
      // The exclusive ladder the ring actually draws, mirroring the two
      // not-exists anti-joins in the real query. These must partition `total`
      // together with the `total - acted` remainder, or the card draws a ring
      // that overflows itself.
      chattedOnly: [...chatted].filter(v => !contacted.has(v)).length,
      clickedOnly: [...clicked].filter(v => !contacted.has(v) && !chatted.has(v)).length,
    },
    sources: [...sourceCounts].map(([h, n], i) => ({ host: h, sessions: n, tagged: i % 3 === 0 }))
      .sort((a, b) => b.sessions - a.sessions).slice(0, 8),
    // Deliberately includes a long label and a null one (an icon-only footer
    // link), which are the two cases that break the row layout.
    clicks: [
      { host: 'github.com', label: 'View the source on GitHub', clicks: 31, visitors: 19 },
      { host: 'read.cv', label: 'Read the full case study', clicks: 22, visitors: 14 },
      { host: 'mailto', label: null, clicks: 12, visitors: 11 },
      { host: 'linkedin.com', label: 'LinkedIn', clicks: 9, visitors: 8 },
      { host: 'instagram.com', label: 'Instagram', clicks: 4, visitors: 4 },
    ],
    // Deliberately includes one tag that appears in BOTH sections — that is the
    // case the section prefix on the label exists for, and the case where a
    // missing prefix would look like a duplicated row rather than two answers.
    // Also a long tag, since these labels sit in the same 38% column as the
    // click list's.
    filters: [
      { section: 'work', tag: 'react', uses: 18, visitors: 12 },
      { section: 'notes', tag: 'performance', uses: 14, visitors: 9 },
      { section: 'work', tag: 'design systems', uses: 11, visitors: 8 },
      { section: 'notes', tag: 'react', uses: 7, visitors: 6 },
      { section: 'work', tag: 'accessibility', uses: 3, visitors: 3 },
    ],
    paths: [...pathCounts].map(([path, views]) => ({
      path,
      views,
      visitors: new Set(f.pageViews.filter(p => p.path === path).map(p => p.visitor_id)).size,
    })).sort((a, b) => b.views - a.views).slice(0, 8),
    hourly: Array.from({ length: 24 }, (_, hour) => ({ hour, views: hourCounts.get(hour) ?? 0 })),
    // Formerly stubbed as its own /api/admin/stats route; folded into insights.
    days,
  }
}

export const insights = buildInsights()

/**
 * How long the stubbed endpoints sit on their answers.
 *
 * Long enough to measure the loading skeleton, which is otherwise never on
 * screen here: the stubs used to answer instantly, so every check ran against
 * the loaded page and the skeleton drifted for months without a single failure.
 * It had gone stale (columns that no longer existed, columns that did) and on a
 * phone it was a genuine overflow — a `table-fixed` placeholder outside any
 * scroll container forced the document 181px wider than a Pixel 7.
 */
const HOLD_MS = 1200

/**
 * Intercept every admin endpoint the dashboard calls and answer from fixtures.
 *
 * `HOLD_MS` is the delay, and it is deliberate rather than incidental: the
 * stubs used to answer instantly, so every run rendered the loaded page and the
 * loading skeleton was never once on screen. It drifted stale for months
 * without a single failure. Callers that want the skeleton screenshot it during
 * the hold; callers that do not simply wait it out.
 */
export async function stubAdminRoutes(page) {
  const hold = async (route, body) => {
    await new Promise(r => setTimeout(r, HOLD_MS))
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  }
  await page.route('**/api/admin/session', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }))
  await page.route('**/api/admin/visitors', r => hold(r, { visitors: fixtures.visitors }))
  await page.route('**/api/admin/visitors/*', r => {
    const id = r.request().url().split('/').pop()
    const v = fixtures.visitors.find(x => x.id === id) ?? target
    return hold(r, detailFor(v))
  })
  await page.route('**/api/admin/insights', r => hold(r, insights))
}

export { HOLD_MS }
