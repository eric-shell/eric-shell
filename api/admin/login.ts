import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'
import {
  checkPassword,
  createSessionToken,
  discardChallenge,
  issueChallenge,
  setSessionCookie,
  twoFactorConfigured,
} from '../_lib/auth.js'
import { checkRateLimit, send429 } from '../_lib/ratelimit.js'

const LOGIN_DELAY_MS = 1500

/** Same sender identity the contact form uses — one verified Resend domain. */
const MAIL_FROM = 'eric.sh admin <onboarding@resend.dev>'

function codeEmail(code: string): { subject: string; text: string; html: string } {
  return {
    subject: 'Your eric.sh admin sign-in code',
    text: `Your sign-in code is ${code}. It expires in 5 minutes and can be used once.\n\nIf you didn't try to sign in, someone has the admin password — change it.`,
    html:
      '<div style="font-family:system-ui,sans-serif;color:#111;line-height:1.6">' +
      '<p style="margin:0 0 12px">Your eric.sh admin sign-in code:</p>' +
      `<p style="margin:0 0 12px;font-size:30px;font-weight:700;letter-spacing:0.18em">${code}</p>` +
      '<p style="margin:0 0 12px;color:#555">It expires in 5 minutes and can be used once.</p>' +
      "<p style=\"margin:0;color:#555\">If you didn't try to sign in, someone has the admin password — change it.</p>" +
      '</div>',
  }
}

/**
 * Step 1 of 2. A correct password does NOT establish a session: it mints a
 * short-lived challenge, mails the code to `ADMIN_2FA_EMAIL`, and hands back an
 * opaque `challengeId` for POST /api/admin/verify to spend.
 *
 * The exception is the fail-open path — see the tradeoff note in
 * api/_lib/auth.ts. When the second factor is not configured, or the challenge
 * store or the mail provider is unavailable, this signs the user in on the
 * password alone rather than locking the owner out of their own site. The
 * `signIn()` fallbacks below are the only lines to change if that ever stops
 * being acceptable.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const rate = await checkRateLimit(req, 'admin-login', [
    { name: 'short', windowMs: 600_000,    max: 10 },
    { name: 'daily', windowMs: 86_400_000, max: 50 },
  ])
  if (rate.limited) {
    send429(res, rate.retryAfterSeconds)
    return
  }

  const body = (req.body ?? {}) as { password?: unknown }

  // Constant delay on every attempt (success or failure) makes brute-force
  // against the single shared password impractical. Invisible to a human
  // signing in occasionally; lethal to a script.
  await new Promise(resolve => setTimeout(resolve, LOGIN_DELAY_MS))

  if (!checkPassword(body.password)) {
    res.status(401).json({ error: 'Invalid password' })
    return
  }

  // Establishes the session directly. Only reached on the fail-open paths.
  const signIn = (): void => {
    try {
      setSessionCookie(req, res, createSessionToken())
      res.status(200).json({ ok: true, mfa: false })
    } catch (err) {
      console.error('Admin login error:', err)
      res.status(500).json({ error: 'Login is unavailable. Check ADMIN_SESSION_SECRET.' })
    }
  }

  if (!twoFactorConfigured()) {
    signIn()
    return
  }

  const challenge = await issueChallenge()
  if (!challenge) {
    console.warn('Admin 2FA: challenge store unavailable — falling back to password-only.')
    signIn()
    return
  }

  try {
    const { subject, text, html } = codeEmail(challenge.code)
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: MAIL_FROM,
      to: process.env.ADMIN_2FA_EMAIL as string,
      subject,
      text,
      html,
    })
    // Resend reports a rejected send in the payload rather than by throwing.
    if (error) throw new Error(error.message)
  } catch (err) {
    // Never log the code, the challenge id, or the recipient.
    console.error('Admin 2FA: code email failed — falling back to password-only:', err)
    await discardChallenge(challenge.challengeId)
    signIn()
    return
  }

  // No session yet — the client must spend the challenge at /api/admin/verify.
  res.status(200).json({ ok: true, mfa: true, challengeId: challenge.challengeId })
}
