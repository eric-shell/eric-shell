import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { Redis } from '@upstash/redis'

/**
 * Two cookie names, one session. `__Host-` is the hardened form: a browser
 * refuses to accept it unless it is `Secure`, `Path=/` and carries no `Domain`,
 * which makes it impossible for a sibling subdomain (or a network attacker on a
 * plain-http origin) to plant or overwrite the admin session. It is the name we
 * write everywhere except localhost.
 *
 * The prefix is not dependably settable on `http://localhost` under
 * `vercel dev`. Plain `Secure` already works there (localhost is a trustworthy
 * origin) and is what this project has always used, so local dev keeps the
 * unprefixed name. Reads accept either, preferring the prefixed one, so an
 * existing session survives the change.
 */
const COOKIE_NAME = 'admin_session'
const HOST_COOKIE_NAME = '__Host-admin_session'

/**
 * 24 hours, down from 7 days. Single user, and re-establishing a session is
 * cheap (password + emailed code), so a leaked cookie is worth a day at most.
 * There is still no server-side revocation list — rotating
 * `ADMIN_SESSION_SECRET` remains the way to kill every session at once.
 */
const MAX_AGE_SECONDS = 60 * 60 * 24

/** Sign-in challenge lifetime and attempt ceiling. */
const CHALLENGE_TTL_SECONDS = 300
const MAX_CHALLENGE_ATTEMPTS = 5

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

/**
 * `vercel dev` serves the admin over plain http on localhost, where the
 * `__Host-` prefix can be rejected outright. Localhost therefore keeps the
 * unprefixed name; every deployed environment gets the hardened one.
 */
function isLocalHost(req: VercelRequest): boolean {
  const host = (req.headers.host ?? '').split(':')[0].toLowerCase()
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
}

export function setSessionCookie(req: VercelRequest, res: VercelResponse, token: string): void {
  const name = isLocalHost(req) ? COOKIE_NAME : HOST_COOKIE_NAME
  res.setHeader('Set-Cookie',
    `${name}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE_SECONDS}`
  )
}

/** Clears both names, so a cookie written under the other one can't linger. */
export function clearSessionCookie(res: VercelResponse): void {
  const expire = (name: string) => `${name}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
  res.setHeader('Set-Cookie', [expire(HOST_COOKIE_NAME), expire(COOKIE_NAME)])
}

export function requireAdmin(req: VercelRequest, res: VercelResponse): boolean {
  const token = readCookie(req, HOST_COOKIE_NAME) ?? readCookie(req, COOKIE_NAME)
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

/* ────────────────────────────────────────────────────────────────────────────
   SECOND FACTOR — emailed one-time passcode
   ────────────────────────────────────────────────────────────────────────────

   The password on its own is a single shared secret with no rotation story. A
   six-digit code mailed to `ADMIN_2FA_EMAIL` adds a factor that the password's
   compromise does not carry with it.

   DELIBERATE TRADEOFF — ISSUING A CHALLENGE FAILS OPEN. If `ADMIN_2FA_EMAIL`
   is unset, or Resend has no key, or Upstash is unreachable, or the send
   throws, `api/admin/login.ts` issues a session on the correct password alone
   and logs that it did. The owner must never be locked out of their own site
   by a third-party outage, and what this gate protects is read-only analytics
   about their own visitors — not a payments console. The password, the
   constant 1.5s delay and the rate limit are the floor; the code is the
   ceiling. If the threat model changes, the single line to change is the
   fallback branch in `api/admin/login.ts`.

   VERIFYING A CHALLENGE DOES NOT FAIL OPEN. Once a challenge exists, a store
   error is a failed verification, never a pass. */

let cachedRedis: Redis | null | undefined

/**
 * Its own client rather than one shared with the rate limiter, so the 2FA path
 * carries no dependency on that module's caching. Same env-var resolution: the
 * Vercel ↔ Upstash Marketplace integration injects `KV_REST_API_*`, standalone
 * Upstash uses `UPSTASH_REDIS_REST_*`.
 */
function challengeStore(): Redis | null {
  if (cachedRedis !== undefined) return cachedRedis
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  cachedRedis = url && token ? new Redis({ url, token }) : null
  return cachedRedis
}

/** True only when every piece the second factor needs is present. */
export function twoFactorConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_2FA_EMAIL &&
    process.env.RESEND_API_KEY &&
    challengeStore(),
  )
}

function challengeKey(challengeId: string): string {
  return `admin:2fa:${challengeId}`
}

/**
 * Keyed HMAC, not a bare digest. Six digits is a trivially enumerable space, so
 * a plain SHA-256 sitting in Redis would be equivalent to storing the code in
 * clear. Binding it to `ADMIN_SESSION_SECRET` means a stolen store dump reveals
 * nothing without the app's own key.
 */
function hashCode(challengeId: string, code: string): string {
  return createHmac('sha256', secret()).update(`${challengeId}.${code}`).digest('base64url')
}

export const CHALLENGE_ID_PATTERN = /^[A-Za-z0-9_-]{16,64}$/
export const CHALLENGE_CODE_PATTERN = /^\d{6}$/

export interface Challenge {
  challengeId: string
  code: string
}

/**
 * Mints a challenge and stores only its hash under a random opaque id. Returns
 * null when the store is unavailable or the write fails — the caller reads that
 * as "no second factor available" and falls back to password-only.
 */
export async function issueChallenge(): Promise<Challenge | null> {
  const redis = challengeStore()
  if (!redis) return null

  const challengeId = randomBytes(24).toString('base64url')
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')

  try {
    await redis.set(challengeKey(challengeId), hashCode(challengeId, code), { ex: CHALLENGE_TTL_SECONDS })
  } catch (err) {
    // No id, no code, no address in the log line.
    console.error('Admin 2FA: could not store challenge:', err)
    return null
  }

  return { challengeId, code }
}

/** Best-effort teardown when a challenge is abandoned mid-flight. */
export async function discardChallenge(challengeId: string): Promise<void> {
  const redis = challengeStore()
  if (!redis) return
  try {
    await redis.del(challengeKey(challengeId), `${challengeKey(challengeId)}:n`)
  } catch {
    /* the TTL collects it */
  }
}

/**
 * Single-use, attempt-capped, constant-time. True only for a live challenge
 * whose code matches; the challenge is deleted once it is spent or exhausted,
 * so a code can never be replayed.
 */
export async function consumeChallenge(challengeId: string, code: string): Promise<boolean> {
  const redis = challengeStore()
  if (!redis) return false

  const key = challengeKey(challengeId)
  const attemptsKey = `${key}:n`

  try {
    const stored = await redis.get<string>(key)
    if (!stored) return false

    // Counted before the compare, so a guess costs an attempt whether or not it
    // is right. The counter is given the challenge's own TTL so it can never
    // outlive it and pre-exhaust a later, legitimate challenge.
    const attempts = await redis.incr(attemptsKey)
    await redis.expire(attemptsKey, CHALLENGE_TTL_SECONDS)
    if (attempts > MAX_CHALLENGE_ATTEMPTS) {
      await redis.del(key, attemptsKey)
      return false
    }

    const expected = hashCode(challengeId, code)
    const a = Buffer.from(stored)
    const b = Buffer.from(expected)
    const match = a.length === b.length && timingSafeEqual(a, b)

    if (match) await redis.del(key, attemptsKey)
    return match
  } catch (err) {
    console.error('Admin 2FA: challenge verification failed:', err)
    return false
  }
}
