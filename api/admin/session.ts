import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_lib/auth.js'

/**
 * Cookie probe for the admin SPA's route guard. The app used to answer "am I
 * signed in?" by firing the full `/api/admin/visitors` aggregate — two Neon
 * queries over the whole page-views table — and throwing the result away on the
 * 401 path. This decides the same thing with an HMAC verification and no
 * database at all, which matters because it now runs on every load of both
 * /login and /dashboard.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!requireAdmin(req, res)) return

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({ ok: true })
}
