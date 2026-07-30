import type { VisitorSummary } from '@/../api/_lib/types'

export type TagTone = 'danger' | 'warn' | 'muted'

export interface VisitorTag {
  /** Short label rendered in the row. */
  label: string
  tone: TagTone
  /** Why it fired — surfaced as a title so a judgement is never unexplained. */
  reason: string
}

/**
 * Heuristic labelling of low-value traffic.
 *
 * This is PRESENTATIONAL ONLY. Nothing is hidden, filtered, or deleted on the
 * strength of a tag — it exists so a real lead isn't buried under crawler noise.
 * Every tag carries a `reason`, because an unexplained "spam" badge on a
 * genuine visitor is worse than no badge at all.
 *
 * Signals are limited to what a list row actually has. Anything needing message
 * bodies or scroll depth belongs in the detail view, not here.
 */

// Curated rather than a bare /bot/ test. "CUBOT" is a real Android phone brand,
// so anything matching `bot` mid-word mislabels genuine mobile visitors — hence
// \b word boundaries and an explicit `Bot/` version form, never a loose
// `[a-z]bot` (which does match CUBOT NOTE 20; don't reintroduce it).
const BOT_UA = [
  /\bbot\b/i, /bot\//i, /\bcrawler\b/i, /\bspider\b/i, /\bslurp\b/i,
  /googlebot/i, /bingbot/i, /duckduckbot/i, /yandex(bot)?/i, /baiduspider/i,
  /ahrefs/i, /semrush/i, /mj12bot/i, /dotbot/i, /petalbot/i, /applebot/i,
  /facebookexternalhit/i, /whatsapp/i, /telegrambot/i, /discordbot/i, /slackbot/i,
  /headlesschrome/i, /phantomjs/i, /puppeteer/i, /playwright/i, /selenium/i,
  /python-requests/i, /\bcurl\//i, /\bwget\b/i, /axios/i, /go-http-client/i,
  /okhttp/i, /java\//i, /scrapy/i, /httpclient/i, /libwww/i, /lighthouse/i,
]

// Free/disposable providers are not inherently spam — plenty of real people use
// them — so this only ever contributes alongside another signal.
const THROWAWAY_EMAIL = /@(mailinator|guerrillamail|10minutemail|tempmail|yopmail|trashmail|sharklasers|dispostable|getnada|maildrop)\./i

const URL_IN_TEXT = /(https?:\/\/|www\.|\.(?:ru|top|xyz|click|loan|work)\b)/i

/** Engaged time below this reads as automation rather than a person. */
const NO_DWELL_MS = 2_000
const BOUNCE_MS = 5_000

export function classifyVisitor(v: VisitorSummary): VisitorTag[] {
  const tags: VisitorTag[] = []
  const ua = v.user_agent ?? ''
  const views = v.page_view_count
  const engaged = v.total_engaged_ms
  const converted = v.contact_count > 0
  const chatted = v.chat_message_count > 0

  const uaIsBot = ua !== '' && BOT_UA.some(re => re.test(ua))
  if (uaIsBot) {
    tags.push({
      label: 'Bot',
      tone: 'muted',
      reason: `User agent matches a known crawler or automation client: ${ua.slice(0, 80)}`,
    })
  }

  // Telemetry only runs where JS runs, so a page view with no browser-reported
  // locale means the JS environment was stubbed — a headless client.
  if (!uaIsBot && views > 0 && !v.client_timezone && !v.language) {
    tags.push({
      label: 'Automated',
      tone: 'muted',
      reason: 'Recorded page views but reported no browser timezone or language, which a real browser always sends.',
    })
  }

  // Several pages with effectively no dwell is a scripted fetch, not reading.
  if (!uaIsBot && views >= 3 && engaged < NO_DWELL_MS) {
    tags.push({
      label: 'No dwell',
      tone: 'muted',
      reason: `${views} page views but under ${Math.round(NO_DWELL_MS / 1000)}s of engaged time — pages were fetched, not read.`,
    })
  }

  // Spam only ever applies to something submitted; a quiet visitor is not spam.
  if (converted) {
    const email = v.contact_email ?? ''
    const name = v.contact_name ?? ''
    const spamReasons: string[] = []

    if (URL_IN_TEXT.test(name)) spamReasons.push('the submitted name contains a URL')
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) spamReasons.push('the email is malformed')
    if (THROWAWAY_EMAIL.test(email)) spamReasons.push('a disposable email domain')
    // Submitting without ever loading a page is the classic direct-POST bot.
    if (views === 0 && !chatted) spamReasons.push('the form was submitted with no page view recorded')

    if (spamReasons.length > 0) {
      tags.push({
        label: 'Spam?',
        tone: 'danger',
        reason: `Possible spam submission — ${spamReasons.join(', ')}. Worth reading before replying.`,
      })
    }
  }

  // Only label a bounce when nothing else already explains the row, and never
  // when the visitor actually engaged — a one-page visit that led to a contact
  // form is the opposite of low value.
  if (tags.length === 0 && !converted && !chatted && views > 0 && views <= 1 && engaged < BOUNCE_MS) {
    tags.push({
      label: 'Bounce',
      tone: 'warn',
      reason: `A single page view with under ${Math.round(BOUNCE_MS / 1000)}s of engaged time.`,
    })
  }

  return tags
}
