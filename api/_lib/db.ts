import { neon } from '@neondatabase/serverless'

let cached: ReturnType<typeof neon> | null = null

export function sql() {
  if (cached) return cached
  const url = process.env.POSTGRES_URL
  if (!url) throw new Error('POSTGRES_URL is not set')
  cached = neon(url)
  return cached
}
