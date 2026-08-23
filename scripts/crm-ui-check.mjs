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

const BASE = process.argv[2] ?? 'http://localhost:3001'
const OUT = process.argv[3] ?? '.'
// 412 = Pixel 8, 360 = the narrow end of Android. Below `md` the visitor table
// is replaced by cards, so these widths exercise a different rendering path
// entirely and a desktop-only sweep would never see it.
const WIDTHS = [1440, 1280, 1024, 768, 412, 360]

import { stubAdminRoutes, target } from './crm-stub.mjs'


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
  await stubAdminRoutes(page)

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
