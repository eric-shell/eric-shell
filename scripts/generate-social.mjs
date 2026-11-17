#!/usr/bin/env node
/**
 * Render public/social.jpg, the 1200x630 image every page shares as og:image.
 *
 *   npm run social
 *
 * The home page's first screen recomposed for a link card: the duotone forest,
 * the wordmark behind the cutout with an outlined copy in front, a line of copy,
 * and the site icon. Rendered in Chromium from the site's own pieces, so it
 * follows them: colours from @theme in src/index.css, the duotone filter from
 * its `duotone-lum` utility, the Display face from public/fonts, the photo and
 * cutout from public/hero, and the icon from public/favicon.svg (run
 * `npm run icons` first if the icon changed).
 *
 * Needs Playwright's Chromium (`npx playwright install chromium`) and the
 * network, for Google Sans.
 *
 * Platforms cache a card by URL. After replacing it, re-scrape a shared link
 * with each platform's own inspector (LinkedIn's Post Inspector, Facebook's
 * Sharing Debugger) or old posts keep the old image.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import sharp from 'sharp'

const ROOT = resolve(import.meta.dirname, '..')
const PUB = pathToFileURL(resolve(ROOT, 'public')).href
const WIDTH = 1200
const HEIGHT = 630

const css = await readFile(resolve(ROOT, 'src/index.css'), 'utf8')
const token = name => {
  const value = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(css)?.[1]
  if (!value) throw new Error(`could not read --color-${name} from src/index.css`)
  return value
}
const duotone = /@utility duotone-lum\s*\{\s*filter:\s*([^;]+);/.exec(css)?.[1]
if (!duotone) throw new Error('could not read the duotone-lum filter from src/index.css')

const ink = token('ink')
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(' ')

/** The wordmark: one size and position for the solid copy and the outline over it. */
const WORDMARK = 'position:absolute;left:46px;top:140px;font-size:192px;line-height:.8;white-space:nowrap'

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Google+Sans:GRAD,wght@-25..150,400..700&display=block" rel="stylesheet">
<style>
  @font-face { font-family: 'Display'; src: url('${PUB}/fonts/display.woff2') format('woff2'); font-weight: 100 900; font-display: block; }
  * { margin: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body { position: relative; background: ${ink}; color: #fff; font-family: 'Google Sans', system-ui, sans-serif; font-weight: 550; -webkit-font-smoothing: antialiased; }
  .display { font-family: 'Display', system-ui, sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: -0.02em; }
  .label { font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; font-variation-settings: 'GRAD' 150; }
</style></head>
<body>
  <img src="${PUB}/hero/background-1920.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%;transform:scale(1.05);filter:${duotone}">
  <!-- The hero's scrim (hero-scrim in index.css), lifted a little at the top for the label. -->
  <div style="position:absolute;inset:0;background:radial-gradient(60% 55% at 72% 28%, rgb(${rgb(token('glow'))} / .28), transparent 70%), linear-gradient(180deg, rgb(${rgb(ink)} / .45) 0%, transparent 30%, transparent 48%, rgb(${rgb(ink)} / .88) 100%)"></div>
  <div class="label" style="position:absolute;left:56px;top:96px;z-index:5;text-shadow:0 2px 12px rgb(${rgb(ink)} / .5)">AI Design Systems Engineer</div>
  <div class="display" style="${WORDMARK};z-index:2;text-shadow:0 18px 60px rgb(5 10 60 / .35)">Eric Shell</div>
  <img src="${PUB}/hero/subject-1024.png" style="position:absolute;right:40px;bottom:-24px;height:600px;z-index:3">
  <div class="display" style="${WORDMARK};z-index:4;color:transparent;-webkit-text-stroke:2px rgb(255 255 255 / .92)">Eric Shell</div>
  <div style="position:absolute;left:56px;bottom:52px;z-index:5;max-width:520px;font-size:30px;line-height:1.35">Design systems, front-end architecture and AI, for fifteen years of products that shipped.</div>
  <div style="position:absolute;right:56px;bottom:52px;z-index:5;display:flex;align-items:center;gap:16px;font-size:30px;font-weight:700;letter-spacing:-0.01em">
    <img src="${PUB}/favicon.svg" style="width:64px;height:64px">eric.sh
  </div>
</body></html>`

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 })
  // A real file rather than setContent(): an about:blank page may not load
  // file:// assets, so the font, photo and icon would silently fall back.
  // Under node_modules/.cache, like the prerender's scratch build, so a
  // `vercel dev` watching the tree never sees it appear.
  const scratch = resolve(ROOT, 'node_modules/.cache/social')
  await mkdir(scratch, { recursive: true })
  const file = resolve(scratch, 'card.html')
  await writeFile(file, html)
  await page.goto(pathToFileURL(file).href, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const families = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family))
  for (const family of ['Display', 'Google Sans']) {
    if (!families.includes(family)) throw new Error(`${family} did not load; the card would render in a fallback face`)
  }
  // The wordmark has to fit: a clipped name is the one failure a card cannot have.
  const right = await page.evaluate(() => document.querySelector('.display').getBoundingClientRect().right)
  if (right > WIDTH - 40) throw new Error(`the wordmark runs to ${Math.round(right)}px of ${WIDTH}`)

  const png = await page.screenshot({ type: 'png' })
  const jpg = await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toBuffer()
  await writeFile(resolve(ROOT, 'public/social.jpg'), jpg)
  console.log(`social.jpg  ${WIDTH}x${HEIGHT}  ${jpg.length} bytes`)
} finally {
  await browser.close()
}
