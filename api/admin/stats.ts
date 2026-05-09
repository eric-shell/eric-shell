import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_lib/auth.js'
import { sql } from '../_lib/db.js'
import type { StatsPayload } from '../_lib/types.js'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!requireAdmin(req, res)) return
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const db = sql()
    const rows = (await db`
      SELECT
        gs::date AS date,
        COUNT(v.id)::int AS visitors
      FROM generate_series(
        current_date - interval '29 days',
        current_date,
        interval '1 day'
      ) AS gs
      LEFT JOIN visitors v ON v.first_seen_at::date = gs::date
      GROUP BY gs
      ORDER BY gs
    `) as { date: string; visitors: number }[]

    const days = rows.map(r => ({
      date: typeof r.date === 'string' ? r.date.slice(0, 10) : new Date(r.date).toISOString().slice(0, 10),
      visitors: r.visitors,
    }))

    const payload: StatsPayload = { days }
    res.status(200).json(payload)
  } catch (err) {
    console.error('Admin stats error:', err)
    res.status(500).json({ error: 'Failed to load stats' })
  }
}
