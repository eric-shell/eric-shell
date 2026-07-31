import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  CHALLENGE_CODE_PATTERN,
  CHALLENGE_ID_PATTERN,
  consumeChallenge,
  createSessionToken,
  setSessionCookie,
} from '../_lib/auth.js'
import { checkRateLimit, send429 } from '../_lib/ratelimit.js'

/** Matches the login endpoint, so neither step is the cheap one to hammer. */
const VERIFY_DELAY_MS = 1500

/**
 * Step 2 of 2. Spends the challenge minted by POST /api/admin/login and, only
 * on a match, establishes the session cookie.
 *
 * Every failure — unknown id, expired challenge, wrong code, attempts
 * exhausted, store unreachable — answers with the same 401 and the same
 * message. Distinguishing them would tell a caller whether a challenge id is
 * live, which is the one thing worth learning here.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const rate = await checkRateLimit(req, 'admin-verify', [
    { name: 'short', windowMs: 600_000,    max: 15 },
    { name: 'daily', windowMs: 86_400_000, max: 60 },
  ])
  if (rate.limited) {
    send429(res, rate.retryAfterSeconds)
    return
  }

  const body = (req.body ?? {}) as { challengeId?: unknown; code?: unknown }
  const challengeId = typeof body.challengeId === 'string' ? body.challengeId : ''
  const code = typeof body.code === 'string' ? body.code.trim() : ''

  await new Promise(resolve => setTimeout(resolve, VERIFY_DELAY_MS))

  const invalid = (): void => {
    res.status(401).json({ error: 'That code is invalid or has expired. Start again to get a new one.' })
  }

  // Shape-check before touching the store, so junk can't run up Upstash calls.
  if (!CHALLENGE_ID_PATTERN.test(challengeId) || !CHALLENGE_CODE_PATTERN.test(code)) {
    invalid()
    return
  }

  if (!(await consumeChallenge(challengeId, code))) {
    invalid()
    return
  }

  try {
    setSessionCookie(req, res, createSessionToken())
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Admin verify error:', err)
    res.status(500).json({ error: 'Sign-in is unavailable. Check ADMIN_SESSION_SECRET.' })
  }
}
