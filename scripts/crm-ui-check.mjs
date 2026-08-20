#!/usr/bin/env node
/**
 * Render the admin CRM against fixture data at several viewport widths and
 * screenshot it. Stubs /api/admin/* in the browser, so it touches no database
 * and needs no admin password.
 *
 *   node scripts/crm-ui-check.mjs [baseUrl] [outDir]
 *
 * Reports any page errors plus horizontal-overflow measurements, which is the
 * failure mode a wide table actually has.
 */
import { chromium } from 'playwright'
import { buildFixtures } from './crm-fixtures.mjs'

const BASE = process.argv[2] ?? 'http://localhost:3001'
const OUT = process.argv[3] ?? '.'
// 412 = Pixel 8, 360 = the narrow end of Android. Below `md` the visitor table
// is replaced by cards, so these widths exercise a different rendering path
// entirely and a desktop-only sweep would never see it.
const WIDTHS = [1440, 1280, 1024, 768, 412, 360]

const f = buildFixtures({ count: 28 })
const target = f.visitors.find(v => v.chat_message_count > 0 && v.contact_count > 0) ?? f.visitors[0]

function detailFor(v) {
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

  // The action-rate denominator: every visitor with any recorded activity,
  // unioned across the same tables the real query reads. The numerators below
  // are all subsets of it, which is what keeps the gauge's arc inside its track.
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
      clicked: clicked.size,
      chatted: chatted.size,
      contacted: contacted.size,
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

const insights = buildInsights()

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
 * Elements wider than their own box that nothing can scroll — the failure mode
 * a wide table actually has.
 */
function measureOverflow() {
  const de = document.documentElement
  const offenders = []
  // Walk up for an ancestor that clips. Decorative layers (the ambient
  // Backdrop blobs) intentionally extend past the edges and are clipped by a
  // parent's overflow-hidden — reporting those was pure noise.
  const isClipped = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX
      if (o === 'hidden' || o === 'clip' || o === 'auto' || o === 'scroll') return true
    }
    return false
  }
  for (const el of document.querySelectorAll('table, .overflow-x-auto, main, section, div')) {
    if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
      const style = getComputedStyle(el)
      if (style.overflowX === 'visible' && !el.closest('[aria-hidden="true"]') && !isClipped(el)) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 70),
          scrollW: el.scrollWidth, clientW: el.clientWidth,
        })
      }
    }
  }
  return {
    pageScrollW: de.scrollWidth, pageClientW: de.clientWidth,
    bodyOverflows: de.scrollWidth > de.clientWidth + 1,
    offenders: offenders.slice(0, 6),
  }
}

/**
 * Content that has escaped the page's own gutter.
 *
 * Distinct from the overflow probe: a card can sit flush against the screen
 * edge — or a few pixels past it — without ever making the document scroll, so
 * `bodyOverflows` stays clean while the layout visibly loses its margin. That
 * is exactly how the insights grid failed on a phone. Anything inside a
 * scroller is exempt; the visitor table is meant to extend inside its own.
 */
function measureGutter() {
  const container = document.querySelector('section[aria-labelledby="insights-heading"]')?.parentElement
  if (!container) return { ok: true, offenders: [] }
  const cs = getComputedStyle(container)
  const box = container.getBoundingClientRect()
  const left = box.left + parseFloat(cs.paddingLeft)
  const right = box.right - parseFloat(cs.paddingRight)

  const inScroller = (el) => {
    for (let p = el.parentElement; p && p !== container; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX
      if (o !== 'visible') return true
    }
    return false
  }

  const offenders = []
  for (const el of container.querySelectorAll('*')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    if (el.closest('.sr-only, [aria-hidden="true"]')) continue
    if (r.right <= right + 0.5 && r.left >= left - 0.5) continue
    if (inScroller(el)) continue
    offenders.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className || '').toString().slice(0, 60),
      left: Math.round(r.left), right: Math.round(r.right),
    })
  }
  return { left: Math.round(left), right: Math.round(right), offenders: offenders.slice(0, 5) }
}

function reportGutter(gutter) {
  console.log('gutter           :', gutter.offenders?.length
    ? `BROKEN  content box ${gutter.left}–${gutter.right}` : 'ok')
  for (const o of gutter.offenders ?? []) {
    console.log(`   ${o.tag}.${o.cls} [${o.left} → ${o.right}]`)
  }
}

function reportOverflow(label, o) {
  console.log(`${label.padEnd(17)}:`, o.bodyOverflows
    ? `YES  ${o.pageScrollW} > ${o.pageClientW}` : 'no')
  if (o.offenders.length) {
    console.log('unscrollable overflow:')
    for (const x of o.offenders) console.log(`   ${x.tag}.${x.cls} ${x.scrollW}>${x.clientW}`)
  }
}

const browser = await chromium.launch()
let failures = 0

for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 1200 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()) })

  // Held rather than answered at once, so the skeleton is measurable below.
  const hold = async (route, body) => {
    await new Promise(r => setTimeout(r, HOLD_MS))
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  }
  await page.route('**/api/admin/visitors', r => hold(r, { visitors: f.visitors }))
  await page.route('**/api/admin/visitors/*', r => {
    const id = r.request().url().split('/').pop().split('?')[0]
    const v = f.visitors.find(x => x.id === id) ?? target
    return hold(r, detailFor(v))
  })
  await page.route('**/api/admin/insights', r => hold(r, insights))

  await page.goto(`${BASE}/dashboard.html`, { waitUntil: 'load' })

  // The loading state, while the stubs are still holding.
  await page.waitForTimeout(400)
  const skeletonOverflow = await page.evaluate(measureOverflow)
  await page.screenshot({ path: `${OUT}/crm-${width}-skeleton.png` })

  await page.waitForTimeout(HOLD_MS + 600)

  const overflow = await page.evaluate(measureOverflow)
  const gutter = await page.evaluate(measureGutter)

  await page.screenshot({ path: `${OUT}/crm-${width}-list.png` })

  // Expand the target row and open the Activity tab.
  const rowSelector = width < 768
    ? `li button[aria-expanded]`
    : `td:has-text("${target.id.slice(0, 8)}")`
  await page.locator(rowSelector).first().click()
  await page.waitForTimeout(700)
  await page.getByRole('tab', { name: /Activity/ }).click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/crm-${width}-activity.png` })

  const metaRows = await page.evaluate(() => {
    // How tall is the metadata block before the tabs? Tall = pushes content down.
    const tablist = document.querySelector('[role="tablist"]')
    const panel = tablist?.closest('div')?.parentElement
    const grid = panel?.querySelector('.grid')
    return grid ? { gridHeight: Math.round(grid.getBoundingClientRect().height),
                    fields: grid.children.length } : null
  })

  console.log(`\n=== ${width}px ===`)
  console.log('page errors      :', errors.length ? errors : 'none')
  reportOverflow('skeleton overflow', skeletonOverflow)
  reportOverflow('body h-overflow', overflow)
  reportGutter(gutter)
  console.log('meta block       :', metaRows ? `${metaRows.fields} fields, ${metaRows.gridHeight}px tall` : 'n/a')
  if (errors.length || overflow.bodyOverflows || skeletonOverflow.bodyOverflows || gutter.offenders.length) failures++
  await ctx.close()
}

await browser.close()
console.log(`\n${failures === 0 ? 'PASS' : 'ISSUES at ' + failures + ' width(s)'}`)
