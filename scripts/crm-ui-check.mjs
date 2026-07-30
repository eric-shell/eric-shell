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

const browser = await chromium.launch()
let failures = 0

for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 1200 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()) })

  await page.route('**/api/admin/visitors', r => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ visitors: f.visitors }),
  }))
  await page.route('**/api/admin/visitors/*', r => {
    const id = r.request().url().split('/').pop().split('?')[0]
    const v = f.visitors.find(x => x.id === id) ?? target
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(detailFor(v)) })
  })
  await page.route('**/api/admin/stats', r => r.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ days }),
  }))

  await page.goto(`${BASE}/dashboard.html`, { waitUntil: 'load' })
  await page.waitForTimeout(1000)

  const overflow = await page.evaluate(() => {
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
  })

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
  console.log('body h-overflow  :', overflow.bodyOverflows
    ? `YES  ${overflow.pageScrollW} > ${overflow.pageClientW}` : 'no')
  if (overflow.offenders.length) {
    console.log('unscrollable overflow:')
    for (const o of overflow.offenders) console.log(`   ${o.tag}.${o.cls} ${o.scrollW}>${o.clientW}`)
  }
  console.log('meta block       :', metaRows ? `${metaRows.fields} fields, ${metaRows.gridHeight}px tall` : 'n/a')
  if (errors.length || overflow.bodyOverflows) failures++
  await ctx.close()
}

await browser.close()
console.log(`\n${failures === 0 ? 'PASS' : 'ISSUES at ' + failures + ' width(s)'}`)
