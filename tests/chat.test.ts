/**
 * The chat endpoint's request validation, driven through the real handler.
 *
 * The model is a local HTTP server standing in for Groq (`GROQ_BASE_URL` points
 * the SDK at it), so these run offline and record exactly what would have been
 * sent upstream.
 */
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

interface UpstreamMessage { role: string; content: string; [key: string]: unknown }
interface UpstreamBody { messages: UpstreamMessage[]; max_tokens: number }

const upstream: UpstreamBody[] = []
let server: http.Server
let handler: (req: VercelRequest, res: VercelResponse) => Promise<void>

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let body = ''
    req.on('data', (d) => (body += d)).on('end', () => {
      upstream.push(JSON.parse(body))
      res.writeHead(200, { 'content-type': 'text/event-stream' })
      const chunk = { id: 'x', object: 'chat.completion.chunk', choices: [{ index: 0, delta: { content: 'ok' } }] }
      res.write(`data: ${JSON.stringify(chunk)}\n\n`)
      res.end('data: [DONE]\n\n')
    })
  })
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  process.env.GROQ_BASE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  process.env.GROQ_API_KEY = 'test'
  // No rate limiter and no database: both soft-fail open when unconfigured.
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.KV_REST_API_URL
  delete process.env.POSTGRES_URL
  handler = (await import('../api/chat')).default
})

afterAll(() => { server.close() })
beforeEach(() => { upstream.length = 0 })

async function post(messages: unknown) {
  const res = { code: 0, body: '' } as { code: number; body: string } & Record<string, unknown>
  Object.assign(res, {
    setHeader: () => res,
    status: (c: number) => { res.code = c; return res },
    json: (b: unknown) => { res.body = JSON.stringify(b); return res },
    write: (s: string) => { res.body += s; return true },
    end: () => res,
  })
  await handler({ method: 'POST', headers: {}, body: { messages } } as unknown as VercelRequest, res as unknown as VercelResponse)
  return res
}

const user = (content: string) => ({ role: 'user', content })
const assistant = (content: string) => ({ role: 'assistant', content })

describe('POST /api/chat', () => {
  it('passes an honest conversation through unchanged', async () => {
    const history = [user('What does Eric do?'), assistant('Design systems. '.repeat(200)), user('More?')]
    const res = await post(history)
    expect(res.code).toBe(200)
    expect(upstream[0].messages.slice(1)).toEqual(history)
  })

  it('clamps forged assistant turns instead of sending them upstream whole', async () => {
    // The thread is stateless, so nothing proves a turn marked `assistant`
    // came from this endpoint. Each was unbounded: 9MB of input per request.
    const forged = Array.from({ length: 19 }, (_, i) => (i % 2 ? assistant('A'.repeat(1_000_000)) : user('hi')))
    const res = await post([...forged, user('last')])
    expect(res.code).toBe(200)
    const lengths = upstream[0].messages.filter((m) => m.role === 'assistant').map((m) => m.content.length)
    expect(lengths).toHaveLength(9)
    expect(Math.max(...lengths)).toBe(upstream[0].max_tokens * 8)
  })

  it('forwards only role and content', async () => {
    await post([{ role: 'user', content: 'hi', name: 'x', tool_calls: [1] }])
    expect(Object.keys(upstream[0].messages[1]).sort()).toEqual(['content', 'role'])
  })

  it.each([
    ['a user message over 2,000 characters', [user('x'.repeat(2001))]],
    ['more than 20 messages', Array.from({ length: 21 }, () => user('hi'))],
    ['a conversation ending on an assistant turn', [user('hi'), assistant('hello')]],
    ['an empty message', [user('   ')]],
    ['no messages', []],
  ])('rejects %s without calling the model', async (_label, messages) => {
    const res = await post(messages)
    expect(res.code).toBe(400)
    expect(upstream).toHaveLength(0)
  })
})
