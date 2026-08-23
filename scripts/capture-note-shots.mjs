#!/usr/bin/env node
/**
 * Photograph the running site for the notes section.
 *
 *   npm run build && npm run preview &      # or any server on the base URL
 *   npm run shots [baseUrl]
 *
 * Writes assets-source/notes/<name>.png at 2x, one per entry in
 * notes-shots.config.mjs. Run `npm run images` afterwards to emit the AVIF /
 * WebP / PNG ladder into public/notes/ that a note's srcSet points at.
 *
 * Sources are committed and variants are not, the same split the rest of the
 * image pipeline uses: a screenshot is the source of truth for a published
 * figure, and regenerating it from a UI that has since changed would silently
 * rewrite the picture a note's prose describes.
 *
 * `prefers-reduced-motion` is forced on for every capture. Entrance animations
 * are the whole reason a screenshot comes out half-drawn, and the reduced
 * variant is a real rendering of the page rather than a frozen frame of one.
 * `settleMs` then covers anything that still needs to land.
 */
import { mkdir, stat } from 'node:fs/promises'
import { chromium } from 'playwright'
import shots from './notes-shots.config.mjs'
import { stubAdminRoutes } from './crm-stub.mjs'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const OUT = 'assets-source/notes'
/** 2x, so the widest variant in the ladder has real pixels behind it. */
const SCALE = 2

const STUBS = { crm: stubAdminRoutes }

async function capture(browser, shot) {
  const { name, url, width, clip, clipTo, stub, settleMs = 800, height = 1200 } = shot
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: SCALE,
    reducedMotion: 'reduce',
  })
  const page = await ctx.newPage()

  const errors = []
  page.on('pageerror', e => errors.push(e.message))

  if (stub) {
    const apply = STUBS[stub]
    if (!apply) throw new Error(`${name}: unknown stub "${stub}"`)
    await apply(page)
  }

  await page.goto(`${BASE}${url}`, { waitUntil: 'load' })
  await page.waitForTimeout(settleMs)

  const path = `${OUT}/${name}.png`
  // A missing selector must fail loudly. Falling back to a full-page shot would
  // publish a picture of the wrong thing, and the note's caption would end up
  // describing something not in the frame.
  const box = async sel => {
    const el = await page.$(sel)
    if (!el) throw new Error(`${name}: selector not found: ${sel}`)
    const b = await el.boundingBox()
    if (!b) throw new Error(`${name}: selector matched nothing visible: ${sel}`)
    return b
  }

  if (clip && clipTo) {
    // Crop from the top of `clip` down to the bottom of `clipTo`, keeping the
    // former's width. A note is usually about one part of a screen, and the
    // rest of it shrinks that part into illegibility once the figure is scaled
    // into a 672px reading column.
    const top = await box(clip)
    const last = await box(clipTo)
    await page.screenshot({
      path,
      clip: { x: top.x, y: top.y, width: top.width, height: last.y + last.height - top.y },
    })
  } else if (clip) {
    await (await page.$(clip)).screenshot({ path })
  } else {
    await page.screenshot({ path, fullPage: false })
  }

  const { size } = await stat(path)
  await ctx.close()
  return { path, size, errors }
}

const browser = await chromium.launch()
await mkdir(OUT, { recursive: true })

let failed = 0
for (const shot of shots) {
  try {
    const { path, size, errors } = await capture(browser, shot)
    console.log(`${path}  ${(size / 1024).toFixed(0)}KB  @${shot.width}x${SCALE}`)
    // Page errors do not fail the run, but a screenshot of a broken page is
    // not worth publishing and the operator should hear about it.
    for (const e of errors) console.warn(`  page error: ${e}`)
  } catch (err) {
    failed++
    console.error(`${shot.name}: ${err.message}`)
  }
}

await browser.close()
if (failed) {
  console.error(`\n${failed} of ${shots.length} captures failed.`)
  process.exit(1)
}
console.log(`\n${shots.length} captured. Run \`npm run images\` to emit the variants.`)
