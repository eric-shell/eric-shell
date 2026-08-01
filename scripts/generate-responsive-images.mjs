#!/usr/bin/env node
import { readFile, mkdir, stat } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import sharp from 'sharp'
import manifest from './responsive-images.config.mjs'

/**
 * Defaults. A manifest entry may override any subset via its own `quality`
 * object — see the contact photo, which is a decorative background under a
 * gradient and a grain layer and does not need detail nobody can see.
 */
const QUALITY = { avif: 55, webp: 78, jpg: 80, png: 90 }

async function generateVariant(buffer, { width, format, outPath, quality }) {
  const pipeline = sharp(buffer).resize({ width, withoutEnlargement: true })
  const q = quality[format]
  if (format === 'jpg') await pipeline.jpeg({ quality: q }).toFile(outPath)
  // `quality` on PNG is not a no-op knob — it switches sharp to palette
  // quantisation, which is the only lossy lever PNG has. Without it the
  // `quality` value was silently ignored and every PNG came out fully
  // lossless: the hero subject was 2.5MB of that, for a file that exists only
  // as the <picture> fallback behind AVIF and WebP.
  else if (format === 'png') await pipeline.png({ compressionLevel: 9, quality: q, effort: 10 }).toFile(outPath)
  else if (format === 'webp') await pipeline.webp({ quality: q }).toFile(outPath)
  else if (format === 'avif') await pipeline.avif({ quality: q, effort: 6 }).toFile(outPath)
  else throw new Error(`unknown format: ${format}`)
  const { size } = await stat(outPath)
  return size
}

async function processEntry({ src, outDir, widths, formats, quality }) {
  const buffer = await readFile(src)
  const ext = extname(src)
  const base = basename(src, ext)
  const { width: srcWidth } = await sharp(buffer).metadata()

  // A requested width above the source's own is silently clamped by
  // `withoutEnlargement`, which produces a file whose NAME claims a width it
  // does not have — and the name is what the srcSet advertises. The browser
  // then picks that candidate believing it has more pixels than it does. This
  // is exactly how the contact photo shipped a 2048px file as `-2560`.
  //
  // The tolerance is not squeamishness about exactness: hero/subject.png is
  // 1023px against a requested 1024, and refusing that would drop the variant
  // the markup actually references over a rounding difference no picker can
  // act on. 2% is wide enough to absorb that and far too narrow to let a real
  // overshoot (2560 from 2048 — 25%) through.
  const TOLERANCE = 0.02
  const usable = widths.filter(w => {
    if (w <= srcWidth * (1 + TOLERANCE)) return true
    console.warn(`  ! skipping ${base}-${w}: source is only ${srcWidth}px wide`)
    return false
  })

  await mkdir(outDir, { recursive: true })
  const results = []
  for (const width of usable) {
    for (const format of formats) {
      const outPath = join(outDir, `${base}-${width}.${format}`)
      const size = await generateVariant(buffer, { width, format, outPath, quality })
      results.push({ outPath, size })
    }
  }
  return results
}

function fmt(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}K`
  return `${(bytes / 1024 / 1024).toFixed(2)}M`
}

const start = Date.now()
for (const entry of manifest) {
  console.log(`\n${entry.src}`)
  const results = await processEntry({ ...entry, quality: { ...QUALITY, ...entry.quality } })
  for (const { outPath, size } of results) console.log(`  ${fmt(size).padStart(6)}  ${outPath}`)
}
console.log(`\nDone in ${((Date.now() - start) / 1000).toFixed(1)}s`)
