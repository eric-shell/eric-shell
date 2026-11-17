#!/usr/bin/env node
/**
 * Regenerate the PNG icons from public/favicon.svg.
 *
 *   npm run icons
 *
 * The mark is composited onto `ink`, read from @theme in src/index.css so the
 * icons cannot drift from the token (it is also the `theme-color` and the web
 * manifest's background, which tests/ui-vocabulary.test.ts holds to the same
 * value). Run this after changing either the mark or the token.
 *
 * The SVG's artwork is a disc that fills its viewBox. It is drawn at 76% of the
 * icon and centred, which keeps it inside the 80% safe zone a maskable icon is
 * cropped to and matches the icons this script replaced.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'

const ROOT = resolve(import.meta.dirname, '..')
const MARK_SHARE = 0.76

const ICONS = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
]

const css = await readFile(resolve(ROOT, 'src/index.css'), 'utf8')
const ink = /--color-ink:\s*(#[0-9a-fA-F]{6})\s*;/.exec(css)?.[1]
if (!ink) throw new Error('could not read --color-ink from src/index.css')

const svg = await readFile(resolve(ROOT, 'public/favicon.svg'))

for (const { file, size } of ICONS) {
  const drawn = Math.round(size * MARK_SHARE)
  // Rasterise from the vector at the target size rather than scaling a bitmap.
  const mark = await sharp(svg, { density: (72 * drawn) / 600 * 2 })
    .resize(drawn, drawn)
    .png()
    .toBuffer()
  const out = await sharp({ create: { width: size, height: size, channels: 4, background: ink } })
    .composite([{ input: mark, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toBuffer()
  await writeFile(resolve(ROOT, 'public', file), out)
  console.log(`${file}  ${size}x${size}  ${out.length} bytes  on ${ink}`)
}
