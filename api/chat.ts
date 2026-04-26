import type { VercelRequest, VercelResponse } from '@vercel/node'
import Groq from 'groq-sdk'
import { buildSystemPrompt } from '../src/data/chat-context.js'

type Role = 'user' | 'assistant'
type Message = { role: Role; content: string }
type ChatPayload = { messages?: unknown; website?: unknown }

const MAX_MESSAGES = 20
const MAX_USER_LENGTH = 2000
const MODEL = 'llama-3.3-70b-versatile'

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
  return { ok: true, messages }
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

  const result = validate(body)
  if (!result.ok) {
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

  let stream
  try {
    stream = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.5,
      max_tokens: 500,
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

  try {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) res.write(delta)
    }
  } catch (err) {
    console.error('Groq error (mid-stream):', err)
  } finally {
    res.end()
  }
}
