#!/usr/bin/env node
import { readFile, writeFile, stat } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import sharp from 'sharp'
import manifest from './responsive-images.config.mjs'

const QUALITY = { avif: 55, webp: 78, jpg: 80, png: 90 }

async function generateVariant(buffer, { width, format, outPath }) {
  const pipeline = sharp(buffer).resize({ width, withoutEnlargement: true })
  const opts = { quality: QUALITY[format] }
  if (format === 'jpg') await pipeline.jpeg(opts).toFile(outPath)
  else if (format === 'png') await pipeline.png({ compressionLevel: 9 }).toFile(outPath)
  else if (format === 'webp') await pipeline.webp(opts).toFile(outPath)
  else if (format === 'avif') await pipeline.avif({ quality: QUALITY.avif, effort: 6 }).toFile(outPath)
  else throw new Error(`unknown format: ${format}`)
  const { size } = await stat(outPath)
  return size
}

async function processEntry({ src, widths, formats }) {
  const buffer = await readFile(src)
  const ext = extname(src)
  const base = basename(src, ext)
  const dir = dirname(src)
  const results = []
  for (const width of widths) {
    for (const format of formats) {
      const outPath = join(dir, `${base}-${width}.${format}`)
      const size = await generateVariant(buffer, { width, format, outPath })
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
  const results = await processEntry(entry)
  for (const { outPath, size } of results) console.log(`  ${fmt(size).padStart(6)}  ${outPath}`)
}
console.log(`\nDone in ${((Date.now() - start) / 1000).toFixed(1)}s`)
