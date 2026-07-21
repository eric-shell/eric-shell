import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE_NAME = 'admin_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET
  if (!s || s.length < 16) throw new Error('ADMIN_SESSION_SECRET must be set (32+ chars recommended)')
  return s
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export function createSessionToken(): string {
  const issuedAt = Date.now().toString()
  return `${issuedAt}.${sign(issuedAt)}`
}

function verifyToken(token: string): boolean {
  const [issuedAt, sig] = token.split('.')
  if (!issuedAt || !sig) return false
  const expected = sign(issuedAt)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  if (!timingSafeEqual(a, b)) return false
  const ts = Number(issuedAt)
  if (!Number.isFinite(ts)) return false
  const ageSeconds = (Date.now() - ts) / 1000
  return ageSeconds >= 0 && ageSeconds <= MAX_AGE_SECONDS
}

function readCookie(req: VercelRequest, name: string): string | null {
  const header = req.headers.cookie
  if (!header) return null
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

export function setSessionCookie(res: VercelResponse, token: string): void {
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE_SECONDS}`
  )
}

export function clearSessionCookie(res: VercelResponse): void {
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
  )
}

export function requireAdmin(req: VercelRequest, res: VercelResponse): boolean {
  const token = readCookie(req, COOKIE_NAME)
  if (!token || !verifyToken(token)) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  return true
}

export function checkPassword(supplied: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  if (typeof supplied !== 'string' || supplied.length === 0) return false

  const expectedBuf = Buffer.from(expected)
  const suppliedBuf = Buffer.from(supplied)

  // Compare against a length-matched buffer so timingSafeEqual always runs
  // rather than short-circuiting on a length mismatch first — an early
  // return there would leak the real password's length via response timing.
  const paddedSupplied = Buffer.alloc(expectedBuf.length)
  suppliedBuf.copy(paddedSupplied)

  const lengthsMatch = suppliedBuf.length === expectedBuf.length
  const contentsMatch = timingSafeEqual(paddedSupplied, expectedBuf)

  return lengthsMatch && contentsMatch
}
