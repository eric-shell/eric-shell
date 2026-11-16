import type { VercelRequest, VercelResponse } from '@vercel/node'
import Groq from 'groq-sdk'
import { buildSystemPrompt } from '../src/data/chat-context.js'
import { sql } from './_lib/db.js'
import { upsertVisitor } from './_lib/visitor.js'
import { checkRateLimit, send429 } from './_lib/ratelimit.js'

type Role = 'user' | 'assistant'
type Message = { role: Role; content: string }
type ChatPayload = { messages?: unknown; website?: unknown }

const MAX_MESSAGES = 20
const MAX_USER_LENGTH = 2000
const MAX_TOKENS = 700
/**
 * Ceiling on an assistant turn the client sends back as history.
 *
 * The thread is stateless: the browser replays every earlier turn, including
 * the ones that claim to be ours, and nothing proves a turn marked `assistant`
 * ever came from this endpoint. Only `user` turns were length-checked, so a
 * caller could post twenty megabyte-sized "assistant" messages and have each
 * request spend a full context window of input tokens — a handful of those
 * drains the Groq quota and takes the chat down for every real visitor.
 *
 * Derived from `MAX_TOKENS`, because that is the only thing that bounds a
 * genuine reply: 8 characters per token is about double what English averages,
 * so no reply this endpoint actually produced can reach it.
 *
 * Clamped, not rejected. A 400 here would lock a real visitor out of their own
 * conversation until they cleared it, on the strength of a turn they did not
 * write; cutting the tail off a forged one costs nobody anything.
 */
const MAX_ASSISTANT_LENGTH = MAX_TOKENS * 8
// Groq retired every Llama chat model; gpt-oss-120b is the closest replacement.
// It reasons before answering, and those tokens count against max_tokens, so
// effort stays low and the budget carries headroom over the old 500.
const MODEL = 'openai/gpt-oss-120b'

function isMessage(v: unknown): v is Message {
  if (!v || typeof v !== 'object') return false
  const m = v as { role?: unknown; content?: unknown }
  return (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
}

function validate(body: ChatPayload): { ok: true; messages: Message[] } | { ok: false; error: string } {
  if (!Array.isArray(body.messages) || !body.messages.every(isMessage)) {
    return { ok: false, error: 'Invalid messages.' }
  }
  const messages = body.messages
  if (messages.length === 0) return { ok: false, error: 'Please ask a question.' }
  if (messages.length > MAX_MESSAGES) return { ok: false, error: 'This conversation has gotten long — please refresh to start a new one.' }
  if (messages[messages.length - 1].role !== 'user') return { ok: false, error: 'Last message must be from the visitor.' }
  for (const m of messages) {
    if (!m.content.trim()) return { ok: false, error: 'Messages cannot be empty.' }
    if (m.role === 'user' && m.content.length > MAX_USER_LENGTH) {
      return { ok: false, error: `Message must be ${MAX_USER_LENGTH} characters or less.` }
    }
  }
  return {
    ok: true,
    // Rebuilt field by field: only `role` and `content` go upstream, whatever
    // else the client attached, and assistant turns are clamped (see above).
    messages: messages.map(m => ({
      role: m.role,
      content: m.role === 'assistant' ? m.content.slice(0, MAX_ASSISTANT_LENGTH) : m.content,
    })),
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const body = (req.body ?? {}) as ChatPayload

  if (typeof body.website === 'string' && body.website.trim() !== '') {
    res.status(200).json({ reply: '' })
    return
  }

  const rate = await checkRateLimit(req, 'chat', [
    { name: 'burst',  windowMs: 60_000,    max: 20 },
    { name: 'hourly', windowMs: 3_600_000, max: 100 },
  ])
  if (rate.limited) {
    send429(res, rate.retryAfterSeconds)
    return
  }

  const result = validate(body)
  if (result.ok === false) {
    res.status(400).json({ error: result.error })
    return
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.error('GROQ_API_KEY is not set')
    res.status(500).json({ error: 'Chat is unavailable right now. Please try again later.' })
    return
  }

  const groq = new Groq({ apiKey })

  let visitorId: string | null = null
  try {
    visitorId = await upsertVisitor(req)
  } catch (err) {
    console.error('Visitor upsert failed:', err)
  }

  let stream
  try {
    stream = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.5,
      max_tokens: MAX_TOKENS,
      reasoning_effort: 'low',
      stream: true,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        ...result.messages,
      ],
    })
  } catch (err) {
    console.error('Groq error (pre-stream):', err)
    res.status(500).json({ error: 'Chat failed. Please try again.' })
    return
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('X-Accel-Buffering', 'no')
  res.status(200)

  let assistantReply = ''
  try {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) {
        assistantReply += delta
        res.write(delta)
      }
    }
  } catch (err) {
    console.error('Groq error (mid-stream):', err)
  } finally {
    res.end()
  }

  if (visitorId && assistantReply) {
    const lastUser = result.messages[result.messages.length - 1].content
    try {
      const db = sql()
      await db`
        insert into chat_messages (visitor_id, role, content)
        values
          (${visitorId}, 'user', ${lastUser}),
          (${visitorId}, 'assistant', ${assistantReply})
      `
    } catch (err) {
      console.error('Chat persistence failed:', err)
    }
  }
}
