import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'

type ContactPayload = {
  name?: unknown
  email?: unknown
  message?: unknown
  website?: unknown
}

function isString(v: unknown): v is string {
  return typeof v === 'string'
}

function validate(body: ContactPayload): { ok: true; name: string; email: string; message: string } | { ok: false; error: string } {
  const { name, email, message } = body

  if (!isString(name) || !name.trim()) return { ok: false, error: 'Please enter your name.' }
  if (name.length > 100) return { ok: false, error: 'Name must be 100 characters or less.' }
  if (!isString(email) || !email.trim()) return { ok: false, error: 'Please enter your email.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Please enter a valid email address.' }
  if (email.length > 100) return { ok: false, error: 'Email must be 100 characters or less.' }
  if (!isString(message) || !message.trim()) return { ok: false, error: 'Please enter a message.' }
  if (message.length < 10) return { ok: false, error: 'Message must be at least 10 characters.' }
  if (message.length > 2000) return { ok: false, error: 'Message must be 2000 characters or less.' }

  return { ok: true, name: name.trim(), email: email.trim(), message: message.trim() }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const body = (req.body ?? {}) as ContactPayload

  if (isString(body.website) && body.website.trim() !== '') {
    res.status(200).json({ ok: true })
    return
  }

  const result = validate(body)
  if (!result.ok) {
    res.status(400).json({ error: result.error })
    return
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set')
    res.status(500).json({ error: 'Failed to send message. Please try again.' })
    return
  }

  const resend = new Resend(apiKey)
  const { name, email, message } = result

  try {
    const { error } = await resend.emails.send({
      from: 'Eric Shell Website Form Submission <onboarding@resend.dev>',
      to: 'ericjshell@gmail.com',
      replyTo: email,
      subject: `New message from ${name} via eric.sh`,
      text: `From: ${name} <${email}>\n\n${message}`,
    })

    if (error) {
      console.error('Resend error:', error)
      res.status(500).json({ error: 'Failed to send message. Please try again.' })
      return
    }

    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Unexpected error sending email:', err)
    res.status(500).json({ error: 'Failed to send message. Please try again.' })
  }
}
