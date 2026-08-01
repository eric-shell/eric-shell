import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'
import { sql } from './_lib/db.js'
import { upsertVisitor } from './_lib/visitor.js'
import { checkRateLimit, send429 } from './_lib/ratelimit.js'

type ContactPayload = {
  name?: unknown
  email?: unknown
  message?: unknown
  website?: unknown
}

function isString(v: unknown): v is string {
  return typeof v === 'string'
}

/**
 * Absolute link to this visitor's row in the admin CRM.
 *
 * `?v=<id>` is the deep link `VisitorList` already restores from on mount — it
 * finds the row, pages to it, and opens the drawer. Built from the request's own
 * host so a preview deployment links to its own dashboard rather than sending
 * you to production for a submission that never landed there.
 */
function crmLink(req: VercelRequest, visitorId: string): string {
  const host = req.headers['x-forwarded-host'] ?? req.headers.host
  if (typeof host !== 'string' || !host) return `https://eric.sh/dashboard?v=${visitorId}`
  const proto = req.headers['x-forwarded-proto']
  const scheme = typeof proto === 'string' && proto ? proto.split(',')[0] : 'https'
  return `${scheme}://${host}/dashboard?v=${visitorId}`
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

  const rate = await checkRateLimit(req, 'contact', [
    { name: 'short', windowMs: 600_000,    max: 5  },
    { name: 'daily', windowMs: 86_400_000, max: 30 },
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

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set')
    res.status(500).json({ error: 'Failed to send message. Please try again.' })
    return
  }

  const resend = new Resend(apiKey)
  const { name, email, message } = result

  try {
    const rawCity = req.headers['x-vercel-ip-city']
    const rawCountry = req.headers['x-vercel-ip-country']
    const city = typeof rawCity === 'string' ? decodeURIComponent(rawCity) : null
    const country = typeof rawCountry === 'string' ? rawCountry : null
    const locationLine = [city, country].filter(Boolean).join(', ')

    // Resolved BEFORE the send so the notification can carry a link straight to
    // this person's CRM row — the moment you hear about a lead is the moment you
    // have the least context on them, and hunting for the row by hand is the
    // step that was missing. Its own try/catch: a Postgres outage costs the link,
    // never the email. Persistence below reuses the id rather than upserting a
    // second time.
    let visitorId: string | null = null
    try {
      visitorId = await upsertVisitor(req)
    } catch (err) {
      console.error('Contact visitor upsert failed:', err)
    }

    const { error } = await resend.emails.send({
      from: 'Eric Shell Website Form Submission <onboarding@resend.dev>',
      to: 'ericjshell@gmail.com',
      replyTo: email,
      subject: `New message from ${name} via eric.sh`,
      text: [
        `From: ${name} <${email}>`,
        locationLine ? `Location: ${locationLine}` : null,
        visitorId ? `CRM: ${crmLink(req, visitorId)}` : null,
        '',
        message,
      ].filter(l => l !== null).join('\n'),
    })

    if (error) {
      console.error('Resend error:', error)
      res.status(500).json({ error: 'Failed to send message. Please try again.' })
      return
    }

    // Persist BEFORE responding. Vercel can freeze the function container
    // as soon as the response is flushed, dropping any trailing async work.
    try {
      const db = sql()
      await db`
        insert into contact_submissions (visitor_id, name, email, message)
        values (${visitorId}, ${name}, ${email}, ${message})
      `
    } catch (err) {
      console.error('Contact persistence failed:', err)
    }

    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Unexpected error sending email:', err)
    res.status(500).json({ error: 'Failed to send message. Please try again.' })
  }
}
