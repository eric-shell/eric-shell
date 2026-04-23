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

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  let body: ContactPayload
  try {
    body = (await req.json()) as ContactPayload
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }

  if (isString(body.website) && body.website.trim() !== '') {
    return json({ ok: true }, 200)
  }

  const result = validate(body)
  if (!result.ok) return json({ error: result.error }, 400)

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set')
    return json({ error: 'Failed to send message. Please try again.' }, 500)
  }

  const resend = new Resend(apiKey)
  const { name, email, message } = result

  try {
    const { error } = await resend.emails.send({
      from: 'Eric Shell Portfolio <onboarding@resend.dev>',
      to: 'ericjshell@gmail.com',
      replyTo: email,
      subject: `New message from ${name} via eric.sh`,
      text: `From: ${name} <${email}>\n\n${message}`,
    })

    if (error) {
      console.error('Resend error:', error)
      return json({ error: 'Failed to send message. Please try again.' }, 500)
    }

    return json({ ok: true }, 200)
  } catch (err) {
    console.error('Unexpected error sending email:', err)
    return json({ error: 'Failed to send message. Please try again.' }, 500)
  }
}
