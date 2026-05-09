import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type Limiter = { name: string; limit: Ratelimit }

let cachedRedis: Redis | null = null
const cachedLimiters = new Map<string, Limiter[]>()

function getRedis(): Redis | null {
  if (cachedRedis) return cachedRedis
  // The Vercel ↔ Upstash Marketplace integration injects env vars under the
  // KV_REST_API_* prefix (legacy Vercel KV naming). Standalone Upstash setups
  // use UPSTASH_REDIS_REST_*. Accept either.
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  cachedRedis = new Redis({ url, token })
  return cachedRedis
}

export interface RateConfig {
  windowMs: number
  max: number
  name: string
}

export function getLimiters(prefix: string, configs: RateConfig[]): Limiter[] | null {
  const redis = getRedis()
  if (!redis) return null
  const cached = cachedLimiters.get(prefix)
  if (cached) return cached
  const built = configs.map(c => ({
    name: c.name,
    limit: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(c.max, `${c.windowMs} ms`),
      prefix: `rl:${prefix}:${c.name}`,
      analytics: false,
    }),
  }))
  cachedLimiters.set(prefix, built)
  return built
}

function clientKey(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for']
  const raw = Array.isArray(fwd) ? fwd[0] : fwd
  const ip = (raw ?? '').split(',')[0].trim()
  if (ip) return `ip:${ip}`
  const visitor = req.headers['x-visitor-id']
  const v = Array.isArray(visitor) ? visitor[0] : visitor
  if (typeof v === 'string' && v) return `vid:${v}`
  return 'anon'
}

export type RateLimitResult =
  | { ok: true; limited: false }
  | { ok: true; limited: true; retryAfterSeconds: number; limitName: string }

export async function checkRateLimit(
  req: VercelRequest,
  prefix: string,
  configs: RateConfig[],
): Promise<RateLimitResult> {
  const limiters = getLimiters(prefix, configs)
  if (!limiters) return { ok: true, limited: false }

  const key = clientKey(req)
  try {
    for (const { name, limit } of limiters) {
      const result = await limit.limit(key)
      if (!result.success) {
        const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
        return { ok: true, limited: true, retryAfterSeconds: retryAfter, limitName: name }
      }
    }
  } catch (err) {
    console.error('Ratelimit check failed (soft-failing open):', err)
    return { ok: true, limited: false }
  }
  return { ok: true, limited: false }
}

export function send429(res: VercelResponse, retryAfterSeconds: number): void {
  res.setHeader('Retry-After', String(retryAfterSeconds))
  res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' })
}
