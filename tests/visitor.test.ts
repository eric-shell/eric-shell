import { describe, expect, it } from 'vitest'
import type { VercelRequest } from '@vercel/node'
import { externalReferrer, readVisitorGeo, readVisitorId } from '../api/_lib/visitor'

const req = (headers: Record<string, string>) => ({ headers: { host: 'eric.sh', ...headers } }) as unknown as VercelRequest

describe('readVisitorGeo', () => {
  it('decodes the percent-encoded city Vercel sends', () => {
    expect(readVisitorGeo(req({ 'x-vercel-ip-city': 'Z%C3%BCrich' })).city).toBe('Zürich')
  })

  it('keeps a malformed city as-is instead of throwing', () => {
    // A bare decodeURIComponent threw here, and the contact form answered a
    // valid submission with a 500 without sending it.
    const geo = readVisitorGeo(req({ 'x-vercel-ip-city': 'Z%C3%BCrich%E0%A4%A', 'x-vercel-ip-country': 'CH' }))
    expect(geo.city).toBe('Z%C3%BCrich%E0%A4%A')
    expect(geo.country).toBe('CH')
  })
})

describe('externalReferrer', () => {
  it.each([
    ['https://eric.sh/resume', null],
    ['https://www.eric.sh/', null],
    ['https://www.linkedin.com/', 'https://www.linkedin.com/'],
    ['not a url', null],
  ])('%s -> %s', (value, expected) => {
    expect(externalReferrer(value, req({}))).toBe(expected)
  })
})

describe('readVisitorId', () => {
  it('accepts a UUID and lower-cases it', () => {
    expect(readVisitorId(req({ 'x-visitor-id': '5EED0000-0000-4000-8000-000000000000' }))).toBe('5eed0000-0000-4000-8000-000000000000')
  })

  it('rejects anything else', () => {
    expect(readVisitorId(req({ 'x-visitor-id': "'; drop table visitors; --" }))).toBeNull()
  })
})
