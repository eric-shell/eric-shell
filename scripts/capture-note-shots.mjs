#!/usr/bin/env node
/**
 * Photograph the running site for the notes section.
 *
 *   npm run build && npm run preview &      # or any server on the base URL
 *   npm run shots [baseUrl]
 *
 * Writes assets-source/notes/<name>.png at 2x, one per entry in
 * notes-shots.config.mjs. Run `npm run images` afterwards to emit the AVIF /
 * WebP ladder plus the PNG fallback into public/note-shots/, which is what a
 * note's srcSet points at. Not public/notes: that prefix belongs to the note
 * route and vercel.json rewrites it to `:slug.html`.
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
import sharp from 'sharp'
import { chromium } from 'playwright'
import shots from './notes-shots.config.mjs'
import { stubAdminRoutes } from './crm-stub.mjs'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const OUT = 'assets-source/notes'
/** 2x, so the widest variant in the ladder has real pixels behind it. */
const SCALE = 2

/**
 * Breathing room around a cropped capture, in CSS pixels on all four sides.
 *
 * A crop taken at an element's exact bounding box comes out flush: type touches
 * the frame, card edges sit on the border, and in a note the figure reads as
 * something that was cut off rather than framed. The first screenshot published
 * here had a line of text clipped against the right edge.
 *
 * 24 rather than a round 20 because it is the dashboard's own `sm:px-6` gutter,
 * so the margin reads as the page's own continuing past the crop instead of an
 * arbitrary band. The padding is filled by whatever is actually behind the
 * element, which is the page background, so it never looks like a border.
 *
 * Overridable per shot with `pad`, and `pad: 0` is honoured for the rare case
 * where a flush edge is the point.
 */
const PAD = 24

const STUBS = { crm: stubAdminRoutes }

async function capture(browser, shot) {
  const { name, url, width, clip, clipTo, stub, pad = PAD, settleMs = 800, height = 1200 } = shot
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

  if (clip) {
    const top = await box(clip)
    // `clipTo` crops from the top of `clip` down to the bottom of another
    // element, keeping the first one's width. A note is usually about one part
    // of a screen, and the rest of it shrinks that part into illegibility once
    // the figure is scaled into a 672px reading column.
    const last = clipTo ? await box(clipTo) : top
    const bottom = last.y + last.height

    // Clamped to the document, so padding at a page edge shrinks rather than
    // asking for a region that is not there. Playwright throws on a clip that
    // leaves the page, and the element nearest an edge is exactly the one most
    // likely to want the padding.
    const doc = await page.evaluate(() => ({
      w: document.documentElement.scrollWidth,
      h: document.documentElement.scrollHeight,
    }))

    // Never pad INTO the next element. Padding below the last card in a row
    // reached straight across the 12px grid gap and showed a sliver of the row
    // beneath, which reads as a botched crop rather than as breathing room.
    // Whatever gap actually exists is the budget, so the bottom margin is
    // usually smaller than the other three. That asymmetry is much less
    // noticeable than a strip of half a card.
    const nextTop = await page.evaluate(sel => {
      const next = document.querySelector(sel)?.nextElementSibling
      if (!next) return null
      return next.getBoundingClientRect().top + window.scrollY
    }, clipTo ?? clip)
    const padBottom = nextTop === null ? pad : Math.max(0, Math.min(pad, nextTop - bottom))

    const x = Math.max(0, top.x - pad)
    const y = Math.max(0, top.y - pad)

    await page.screenshot({
      path,
      // `fullPage` so a crop reaching below the fold is captured rather than
      // silently cut at the viewport. Coordinates are page-relative, which is
      // what boundingBox returns while the page is still unscrolled.
      fullPage: true,
      clip: {
        x,
        y,
        width: Math.min(doc.w - x, top.width + pad * 2),
        height: Math.min(doc.h - y, bottom - y + padBottom),
      },
    })
  } else {
    await page.screenshot({ path, fullPage: false })
  }

  // Playwright writes a fully lossless PNG, which for a screenshot of a mostly
  // flat UI is a lot of bytes for detail that is not there. Requantise in
  // place: this file is COMMITTED, and at ~1.6MB each a backfill of every note
  // would have added more to the repository than the entire rest of the image
  // pipeline holds. Palette quantisation at 90 is visually lossless on flat
  // fills and hard type edges, which is all a UI screenshot is.
  const raw = (await stat(path)).size
  const shrunk = await sharp(path).png({ compressionLevel: 9, quality: 90, effort: 10 }).toBuffer()
  await sharp(shrunk).toFile(path)

  const { size } = await stat(path)
  await ctx.close()
  return { path, size, raw, errors }
}

const browser = await chromium.launch()
await mkdir(OUT, { recursive: true })

let failed = 0
for (const shot of shots) {
  try {
    const { path, size, raw, errors } = await capture(browser, shot)
    console.log(
      `${path}  ${(size / 1024).toFixed(0)}KB` +
      ` (from ${(raw / 1024).toFixed(0)}KB)  @${shot.width}x${SCALE}`,
    )
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
