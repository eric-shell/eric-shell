import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clearSessionCookie, requireAdmin } from '../_lib/auth.js'

/**
 * The admin session, as one resource.
 *
 * `GET` — cookie probe for the SPA's route guard. The app used to answer "am I
 * signed in?" by firing the full `/api/admin/visitors` aggregate — two Neon
 * queries over the whole page-views table — and throwing the result away on the
 * 401 path. This decides the same thing with an HMAC verification and no
 * database at all, which matters because it runs on every load of both /login
 * and /dashboard.
 *
 * `DELETE` — sign out. Formerly `POST /api/admin/logout` and its own serverless
 * function; merged here because Hobby caps a deployment at 12 functions and a
 * whole one for two lines that expire a cookie is the worst trade in the
 * directory. Creating the session is still its own pair of endpoints
 * (`login` → `verify`), which is where the real logic lives.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // DELETE is handled BEFORE the auth check, and that is deliberate — it is the
  // one endpoint under api/admin/ that must not start with `requireAdmin`.
  //
  // Signing out is not a privileged action; it clears your own cookie and
  // nothing else. Gating it would mean an expired or malformed session could
  // never be cleared, which is exactly the state you most need to sign out of:
  // you would be stuck on a dashboard that 401s everything with no way to reset
  // it but devtools. The cookie is SameSite=Strict, so a cross-site forced
  // sign-out isn't reachable either, and the worst a same-site one could do is
  // make the owner log in again.
  if (req.method === 'DELETE') {
    clearSessionCookie(res)
    res.status(200).json({ ok: true })
    return
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, DELETE')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!requireAdmin(req, res)) return

  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({ ok: true })
}
