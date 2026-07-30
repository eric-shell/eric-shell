// Deterministic fake CRM data, shared by the DB seeder (scripts/seed-crm.mjs)
// and the UI harness (scripts/crm-ui-check.mjs) so both show the same thing.
//
// Every generated id starts with ID_PREFIX followed by a 4-hex counter, e.g.
// `5eed0007-…`. That is the cleanup contract: `like '5eed%'` matches all of it.
// The counter lives in the first segment on purpose — the admin list shows only
// `id.slice(0, 8)`, so a shared 8-char prefix would render every row identically.
export const ID_PREFIX = '5eed'

/** Mulberry32 — tiny seeded PRNG so successive runs produce identical data. */
function rng(seed) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = (r, xs) => xs[Math.floor(r() * xs.length)]
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1))

/** Build a valid v4-shaped UUID inside the fixture namespace. */
function fakeId(r, n) {
  const hex = (len) => Array.from({ length: len }, () => '0123456789abcdef'[Math.floor(r() * 16)]).join('')
  const counter = n.toString(16).padStart(4, '0').slice(-4)
  return `${ID_PREFIX}${counter}-${hex(4)}-4${hex(3)}-8${hex(3)}-${hex(12)}`
}

const CITIES = [
  // [city, region, country, ip-timezone, client-timezone]
  ['San Luis Obispo', 'CA', 'US', 'America/Los_Angeles', 'America/Los_Angeles'],
  ['Redding',         'CA', 'US', 'America/Los_Angeles', 'America/Los_Angeles'],
  ['Brooklyn',        'NY', 'US', 'America/New_York',    'America/New_York'],
  ['Austin',          'TX', 'US', 'America/Chicago',     'America/Chicago'],
  ['Portland',        'OR', 'US', 'America/Los_Angeles', 'America/Los_Angeles'],
  ['London',          'ENG','GB', 'Europe/London',       'Europe/London'],
  ['Toronto',         'ON', 'CA', 'America/Toronto',     'America/Toronto'],
  ['Berlin',          'BE', 'DE', 'Europe/Berlin',       'Europe/Berlin'],
  ['Zürich',          'ZH', 'CH', 'Europe/Zurich',       'Europe/Zurich'],
  ['Sydney',          'NSW','AU', 'Australia/Sydney',    'Australia/Sydney'],
]

const UAS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  // Deliberately includes a CUBOT device: the classifier must NOT flag it.
  'Mozilla/5.0 (Linux; Android 11; CUBOT NOTE 20) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0 Mobile Safari/537.36',
]

// Crawlers and automation, so the classifier's tags are actually exercised by
// the fixture set rather than only by unit cases.
const BOT_UAS = [
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
  'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'python-requests/2.31.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/126.0.0.0 Safari/537.36',
]

const SPAM_CONTACTS = [
  ['SEO Services', 'promo@mailinator.com', 'Rank #1 on Google — visit http://cheap-seo.ru for a free audit.'],
  ['crypto invest http://gains.top', 'x@yopmail.com', 'Double your money in 24h. Click now!!!'],
]

const REFERRERS = [
  null, null,
  'https://news.ycombinator.com/',
  'https://www.google.com/',
  'https://www.linkedin.com/feed/',
  'https://dribbble.com/shots/popular',
  'https://t.co/aBcDeFgH',
  'https://read.cv/ericshell',
]

const LANGS = ['en-US', 'en-US', 'en-GB', 'de-DE', 'fr-CA', 'en-AU']
const PATHS = ['/', '/', '/', '/resume', '/privacy']
const VIEWPORTS = [
  [1512, 856, 3024, 1964], [1440, 900, 2560, 1440], [1280, 720, 1920, 1080],
  [390, 844, 390, 844], [430, 932, 430, 932], [820, 1180, 1024, 1366],
  [3440, 1440, 3440, 1440],
]

const NAMES = [
  ['Dana Reyes', 'dana.reyes@example.com'],
  ['Marcus Feldt', 'm.feldt@studioatlas.example'],
  ['Priya Raghunathan', 'priya@northlightlabs.example'],
  ['Ola Kowalczyk', 'ola.k@example.org'],
  ['Jean-Baptiste Moreau', 'jb.moreau@atelier-nine.example'],
  ['Sam O.', 's@ex.io'],
]

const QUESTIONS = [
  'Do you take on contract design work?',
  'What was your role on the Figma plugin project?',
  'Are you open to full-time roles in the Bay Area, or remote only?',
  'How do you usually scope a design system engagement?',
  'Can you walk me through the photography side of your practice?',
  'What does your typical timeline look like for a marketing site?',
]
const ANSWERS = [
  'Yes — Eric takes on select contract engagements, usually design-systems or front-end heavy work.',
  'He led the interaction design and built the production front-end in React and TypeScript.',
  'He is open to both, with a preference for teams that treat design and engineering as one discipline.',
  'Typically a discovery pass, an audit of existing components, then an incremental migration plan.',
  'The photography work is a personal practice — mostly 35mm, shot on a Leica M6 and developed at home.',
]
const MESSAGES = [
  "Loved the portfolio — the Work section especially. Would like to talk about a contract engagement starting next quarter.",
  "Hi Eric, we're hiring a senior product designer who can also ship front-end. Your resume looks like a strong match.",
  "Quick question about availability for a short design-system audit. Two to three weeks of work, remote.",
  "Reaching out from a small studio in Berlin. We're looking for someone to help us rebuild our component library.",
]
const NOTES = [
  null, null, null,
  'Strong lead — follow up Monday. Budget confirmed.',
  'Recruiter, not a great fit. Politely declined.',
  'Referred by Marcus. Worth a call.',
]

/**
 * Generate a full fixture set.
 *
 * `now` anchors all timestamps so the seeded data lands in the recent past and
 * the dashboard's activity chart has something to draw.
 */
export function buildFixtures({ count = 28, seed = 20260729, now = Date.now() } = {}) {
  const r = rng(seed)
  const visitors = []
  const sessions = []
  const pageViews = []
  const chats = []
  const contacts = []
  const events = []
  let pvId = 1
  let chatId = 1
  let contactId = 1

  for (let i = 0; i < count; i++) {
    const id = fakeId(r, i)
    const [city, region, country, ipTz, clientTz] = pick(r, CITIES)
    const [vw, vh, sw, sh] = pick(r, VIEWPORTS)

    // Shape the population so the UI gets exercised across its real range:
    // most visitors are drive-by readers, a few are deeply engaged.
    // ~11% of the population is crawler traffic, which is realistic and makes
    // the tag column meaningful in the seeded dashboard.
    const isBot = r() < 0.11
    const kind = r()
    const isBounce = kind < 0.38          // one view, seconds on site
    const isReader = kind >= 0.38 && kind < 0.78
    const isEngaged = kind >= 0.78

    // A deliberate slice with no geo/UA at all — mimics the pre-telemetry rows
    // and anyone sending Global Privacy Control.
    const isBlank = r() < 0.12

    const firstSeen = now - int(r, 1, 75) * 86_400_000 - int(r, 0, 82_800_000)
    const sessionCount = isEngaged ? int(r, 2, 4) : isReader ? int(r, 1, 2) : 1

    let lastSeen = firstSeen
    let totalViews = 0

    for (let s = 0; s < sessionCount; s++) {
      const sid = fakeId(r, 900 + i * 10 + s)
      // Clamp forward: later sessions accumulate days and would otherwise land
      // in the future, which reads as a bug when scanning the seeded dashboard.
      const startedAt = Math.min(
        firstSeen + s * int(r, 3_600_000, 6 * 86_400_000),
        now - 60_000,
      )
      const viewCount = isBot ? int(r, 4, 12) : isBounce ? 1 : isReader ? int(r, 1, 3) : int(r, 3, 6)
      const engagedMs = isBot ? int(r, 0, 600)
        : isBounce ? int(r, 900, 14_000)
        : isReader ? int(r, 20_000, 150_000)
        : int(r, 150_000, 900_000)
      const scroll = isBounce ? int(r, 4, 30) : isReader ? int(r, 30, 85) : int(r, 80, 100)
      const referrer = pick(r, REFERRERS)

      if (!isBlank) {
        sessions.push({
          id: sid, visitor_id: id,
          started_at: new Date(startedAt).toISOString(),
          last_beat_at: new Date(startedAt + engagedMs).toISOString(),
          engaged_ms: engagedMs, max_scroll_pct: scroll,
          entry_path: '/', referrer,
          viewport_w: vw, viewport_h: vh, screen_w: sw, screen_h: sh,
          page_view_count: viewCount,
        })
        for (let p = 0; p < viewCount; p++) {
          pageViews.push({
            id: pvId++, visitor_id: id, session_id: sid,
            path: p === 0 ? '/' : pick(r, PATHS),
            referrer: p === 0 ? referrer : null,
            created_at: new Date(startedAt + p * int(r, 4_000, 90_000)).toISOString(),
          })
        }
        totalViews += viewCount
        lastSeen = Math.min(Math.max(lastSeen, startedAt + engagedMs), now - 30_000)
      }
    }

    // Chat / contact only for the more engaged end of the population.
    const didChat = isEngaged && r() < 0.75
    const didContact = isEngaged && r() < 0.4

    if (didChat) {
      const turns = int(r, 1, 3)
      for (let t = 0; t < turns; t++) {
        const at = lastSeen - (turns - t) * 60_000
        chats.push({ id: chatId++, visitor_id: id, role: 'user', content: pick(r, QUESTIONS), created_at: new Date(at).toISOString() })
        chats.push({ id: chatId++, visitor_id: id, role: 'assistant', content: pick(r, ANSWERS), created_at: new Date(at + 4000).toISOString() })
      }
    }
    if (didContact || (isBot && r() < 0.5)) {
      const spam = isBot
      const [name, email] = spam ? pick(r, SPAM_CONTACTS) : pick(r, NAMES)
      contacts.push({
        id: contactId++, visitor_id: id, name, email,
        message: spam ? pick(r, SPAM_CONTACTS)[2] : pick(r, MESSAGES),
        created_at: new Date(lastSeen - 30_000).toISOString(),
      })
    }
    if (r() < 0.2) {
      events.push({ visitor_id: id, type: 'ada_toggle', metadata: { enabled: true } })
    }
    if (didChat && r() < 0.25) {
      events.push({ visitor_id: id, type: 'chat_cleared', metadata: null })
    }

    const contact = contacts.find(c => c.visitor_id === id)
    visitors.push({
      id,
      first_seen_at: new Date(firstSeen).toISOString(),
      last_seen_at: new Date(lastSeen).toISOString(),
      user_agent: isBlank ? null : isBot ? pick(r, BOT_UAS) : pick(r, UAS),
      country: isBlank ? null : country,
      city: isBlank ? null : city,
      region: isBlank ? null : region,
      timezone: isBlank ? null : ipTz,
      // A couple of hand-corrected rows so the override path is visible.
      location_override: !isBlank && r() < 0.15 ? `${city}, ${region}` : null,
      client_timezone: isBlank ? null : clientTz,
      language: isBlank ? null : pick(r, LANGS),
      referrer: isBlank ? null : pick(r, REFERRERS),
      notes: pick(r, NOTES),
      // Denormalized for the list view / UI harness only.
      chat_message_count: chats.filter(c => c.visitor_id === id).length,
      contact_count: contact ? 1 : 0,
      page_view_count: totalViews,
      session_count: sessions.filter(s => s.visitor_id === id).length,
      total_engaged_ms: sessions.filter(s => s.visitor_id === id).reduce((a, s) => a + s.engaged_ms, 0),
      last_activity_at: new Date(lastSeen).toISOString(),
      contact_name: contact?.name ?? null,
      contact_email: contact?.email ?? null,
    })
  }

  visitors.sort((a, b) => b.last_activity_at.localeCompare(a.last_activity_at))
  return { visitors, sessions, pageViews, chats, contacts, events }
}
