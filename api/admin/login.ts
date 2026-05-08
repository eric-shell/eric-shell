import type { VercelRequest, VercelResponse } from '@vercel/node'
import { checkPassword, createSessionToken, setSessionCookie } from '../_lib/auth.js'

const LOGIN_DELAY_MS = 1500

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
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

  try {
    const token = createSessionToken()
    setSessionCookie(res, token)
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Admin login error:', err)
    res.status(500).json({ error: 'Login is unavailable. Check ADMIN_SESSION_SECRET.' })
  }
}
