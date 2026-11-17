import { describe, expect, it } from 'vitest'
import { contact, updated } from '../src/data/resume'
import { resumeQr } from '../src/data/resumeQr'

describe('resume PDF data', () => {
  // The QR code is generated once (`npm run qr`) and printed on paper, where a
  // stale one cannot be fixed. If the site moves, this fails before the PDF
  // starts sending people to the old address.
  it('points the QR code at this site\'s resume', () => {
    // `contact.site` is display text and may or may not carry its scheme.
    const host = contact.site.replace(/^https?:\/\//, '').replace(/\/$/, '')
    expect(resumeQr.url.startsWith(`https://${host}/resume`)).toBe(true)
  })

  it('carries a QR path for every row of its grid', () => {
    expect(resumeQr.size).toBeGreaterThanOrEqual(21)
    const rows = new Set([...resumeQr.path.matchAll(/M\d+ (\d+)/g)].map(m => Number(m[1])))
    expect(rows.size).toBe(resumeQr.size)
  })

  it('has a real ISO date for the footer', () => {
    expect(updated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(Number.isNaN(Date.parse(updated))).toBe(false)
  })
})
