import type { VisitorSummary } from '@/../api/_lib/types'

export type TagTone = 'danger' | 'warn' | 'muted' | 'good' | 'neutral'

export interface VisitorTag {
  /** Short label rendered in the row. */
  label: string
  tone: TagTone
  /** Why it fired — surfaced as a title so a judgement is never unexplained. */
  reason: string
  /**
   * This row is a machine, not a person, and is safe to hide behind the
   * "Hide bots" toggle.
   *
   * Deliberately NOT set on `Bounce` or `Spam?`:
   *  - A bounce is a real human who left quickly. Brief is not bogus, and
   *    hiding those would quietly delete most of the genuine traffic.
   *  - A spam flag is a prompt to READ a submission, not a verdict on it. The
   *    heuristics have false positives, and hiding a real enquiry costs far
   *    more than showing a junk one. A spammer that is also a bot is hidden by
   *    the bot rule anyway.
   */
  automated?: true
}

/**
 * What kind of visit was this?
 *
 * ## The shape
 *
 * Every row gets **exactly one nature tag** — what the client is, or failing
 * that, what it did — and then **any number of qualifiers** on top. Nothing is
 * ever unlabelled, so a blank Flags cell now means a bug rather than a shrug.
 *
 *   nature (one, always)   Test · LLM · Bot · Proxy · Headless · No dwell ·
 *                          Converted · Chatted · Reader · Bounce · Skimmed ·
 *                          Untracked
 *   qualifiers (any)       Returning · Spam? · VPN? · Burst
 *
 * Most signals come off a single row. Two do not: `VPN?` compares the browser's
 * clock against the one its IP implies, and `Burst` needs the whole list to see
 * that several rows arrived together. The latter is why `classifyVisitor` takes
 * an optional `BurstMap` — compute it once per list with `detectProxyBursts`
 * and pass it down. Omit it and every cross-row rule simply doesn't fire, which
 * is the safe direction to fail.
 *
 * The nature ladder is ordered by how much it explains: what the client IS
 * outranks what it did, and a contact form beats a chat beats a long read beats
 * a bounce. The first rung that matches wins, so the tag answers "why is this
 * row here" rather than piling up near-synonyms.
 *
 * ## Honesty
 *
 * This replaces an earlier rule where unremarkable rows stayed blank, on the
 * grounds that absence of bot signals is not evidence of a person. That is still
 * true, and the wording carries the weight instead: every baseline tag names an
 * OBSERVATION (`Skimmed`, `Untracked`) and none of them asserts humanity. There
 * is deliberately no `Real` or `Human` tag, because nothing here can establish
 * either.
 *
 * The cost of full coverage is that the column no longer spots exceptions by
 * being mostly empty, so tone does that job: the ordinary states are `neutral`
 * and recede, and only `Spam?` is loud.
 *
 * Nothing is ever DELETED on the strength of a tag, and by default nothing is
 * hidden either. The one exception is opt-in: the "Hide bots & tests" toggle
 * filters rows carrying an `automated` tag, and it reports how many it removed
 * so the hiding is never silent. Everything else — including `Spam?` — stays
 * visible.
 *
 * Every tag carries a `reason`, because an unexplained "spam" badge on a genuine
 * visitor is worse than no badge at all.
 *
 * Tags are derived at render time from stored columns, never persisted. Changing
 * a rule here relabels the entire history on the next paint — there is nothing
 * to backfill, and equally nothing to migrate if a rule turns out to be wrong.
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
  /python-requests/i, /\bcurl\//i, /\bwget\b/i, /axios/i, /go-http-client/i,
  /okhttp/i, /java\//i, /scrapy/i, /httpclient/i, /libwww/i,
]

/**
 * Browser-automation stacks — the tools *we* drive, not somebody else's crawler.
 *
 * Split out of BOT_UA because "a stranger's crawler indexed the site" and "I ran
 * my own checks against production" are different facts, and only one of them
 * says anything about reach. Both are still machines, so both carry
 * `automated` and both disappear behind the same toggle.
 */
const TOOLING_UA = [
  /headlesschrome/i, /phantomjs/i, /puppeteer/i, /playwright/i, /selenium/i,
  /lighthouse/i, /chrome-lighthouse/i,
]

/**
 * AI crawlers and assistants, checked BEFORE the general bot list — most of
 * these match `/\bbot\b/` too, and "an AI assistant read this page" is a
 * different fact from "a search engine indexed it".
 *
 * Two kinds sit here together on purpose:
 *  - training / index crawlers (GPTBot, ClaudeBot, CCBot, Bytespider…)
 *  - live fetches made because a person asked something (ChatGPT-User,
 *    Claude-User, Perplexity-User, MistralAI-User)
 * The second kind is a person at one remove, which is arguably reach — it just
 * isn't a browser, and it will never appear in engagement or scroll data.
 *
 * The user-agent is the only signal available: it is the one request header
 * stored (see api/_lib/visitor.ts), and it is self-reported, so this catches the
 * agents that identify themselves and cannot catch one that doesn't want to be
 * caught. Anything stronger — the `Signature-Agent` header of Web Bot Auth,
 * published IP ranges, reverse-DNS — would mean collecting more per request and
 * disclosing it on the privacy page, which is a decision, not a detail.
 */
const LLM_UA = [
  // OpenAI
  /gptbot/i, /chatgpt-user/i, /oai-searchbot/i,
  // Anthropic
  /claudebot/i, /claude-user/i, /claude-searchbot/i, /anthropic-ai/i,
  // Google, Meta, Apple, Amazon, ByteDance
  /google-extended/i, /google-cloudvertexbot/i, /meta-externalagent/i,
  /meta-externalfetcher/i, /applebot-extended/i, /amazonbot/i, /bytespider/i,
  // Search-and-answer engines and the rest of the field
  /perplexitybot/i, /perplexity-user/i, /mistralai-user/i, /duckassistbot/i,
  /youbot/i, /cohere-ai/i, /cohere-training-data-crawler/i, /ai2bot/i,
  /ccbot/i, /diffbot/i, /timpibot/i, /omgilibot/i, /firecrawl/i, /pangubot/i,
]

// Free/disposable providers are not inherently spam — plenty of real people use
// them — so this only ever contributes alongside another signal.
const THROWAWAY_EMAIL = /@(mailinator|guerrillamail|10minutemail|tempmail|yopmail|trashmail|sharklasers|dispostable|getnada|maildrop)\./i

const URL_IN_TEXT = /(https?:\/\/|www\.|\.(?:ru|top|xyz|click|loan|work)\b)/i

/** Engaged time below this reads as automation rather than a person. */
const NO_DWELL_MS = 2_000
const BOUNCE_MS = 5_000

/**
 * Minutes east of UTC for an IANA zone at a given instant, or null if the zone
 * name is one `Intl` won't take.
 *
 * Evaluated at the visit's own timestamp rather than "now", because the answer
 * moves: Europe/Berlin is +1 in January and +2 in July, and the northern and
 * southern hemispheres change over on different dates. Comparing two zones at
 * the wrong instant manufactures an hour of disagreement that wasn't there.
 */
function tzOffsetMinutes(tz: string, at: Date): number | null {
  try {
    const name = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
      .formatToParts(at).find(p => p.type === 'timeZoneName')?.value
    if (!name) return null
    // "GMT" | "GMT+2" | "GMT-7" | "GMT+5:30"
    const m = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(name)
    if (!m) return name === 'GMT' ? 0 : null
    return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0))
  } catch {
    // An unknown zone throws RangeError. Unknown is not evidence of anything.
    return null
  }
}

/**
 * How far apart the browser's clock and the IP's clock are, in minutes, or null
 * when either is missing or unparseable.
 *
 * These are two genuinely independent readings — `client_timezone` is what the
 * browser said, `timezone` is what the edge inferred from the address — so a
 * large gap means one of them is being carried by something other than a person
 * sitting where the packets appear to come from.
 */
function timezoneGapMinutes(v: VisitorSummary): number | null {
  if (!v.client_timezone || !v.timezone) return null
  const at = new Date(v.first_seen_at)
  if (Number.isNaN(at.getTime())) return null
  const browser = tzOffsetMinutes(v.client_timezone, at)
  const ip = tzOffsetMinutes(v.timezone, at)
  if (browser === null || ip === null) return null
  return Math.abs(browser - ip)
}

/**
 * Four hours, not three.
 *
 * Three is exactly the width of the continental US, and someone in Los Angeles
 * whose corporate VPN exits in Virginia is an ordinary thing to be — flagging
 * them would fire on the most privacy-conscious ordinary visitors, which is the
 * mistake `Spam?` already had to be walked back from. Four hours means the two
 * readings are at least a continent apart, which no domestic VPN produces.
 */
const TZ_GAP_MINUTES = 240

/** A coordinated arrival this row was part of. */
export interface BurstInfo {
  /** Distinct visitor rows in the run. */
  size: number
  /** Distinct IP-derived locations across them. */
  locations: number
  /** First to last arrival, in ms. */
  spanMs: number
}

export type BurstMap = ReadonlyMap<string, BurstInfo>

const BURST_WINDOW_MS = 10 * 60_000
const BURST_MIN_VISITORS = 3
const BURST_MIN_LOCATIONS = 2

function locationKey(v: VisitorSummary): string {
  return `${v.city ?? ''}|${v.region ?? ''}|${v.country ?? ''}`.toLowerCase()
}

/**
 * Finds runs of visitors that arrived together behind rotating exit addresses.
 *
 * The tell is a contradiction: several **separate visitor rows**, in a few
 * minutes, reporting byte-identical browser fingerprints but scattered across
 * different IP locations. Distinct rows matter — a visitor id lives in
 * localStorage, so one person reloading stays one row no matter how many times
 * they hit the page. Three rows means three storage contexts.
 *
 * Grouping on `(client_timezone, user_agent)` does most of the work, and it is
 * what keeps ordinary traffic out: the owner testing the site across a laptop,
 * a phone and a tablet in one sitting produces a tight cluster from one city,
 * but three different user agents, so it splits into three groups of one or two
 * and never reaches the threshold. Real people also don't agree on a browser
 * patch version.
 *
 * Two distinct locations is enough BECAUSE of that grouping — one client
 * fingerprint appearing in two cities inside ten minutes is already the
 * contradiction. Nothing here is decided on this alone; see the `Proxy` rung.
 */
export function detectProxyBursts(visitors: VisitorSummary[]): BurstMap {
  const groups = new Map<string, VisitorSummary[]>()
  for (const v of visitors) {
    // A missing fingerprint is not a shared one. Rows with no UA or no browser
    // timezone would otherwise all pile into a single group and burst together.
    if (!v.client_timezone || !v.user_agent) continue
    const key = `${v.client_timezone} ${v.user_agent}`
    const list = groups.get(key)
    if (list) list.push(v)
    else groups.set(key, [v])
  }

  const found = new Map<string, BurstInfo>()
  for (const list of groups.values()) {
    if (list.length < BURST_MIN_VISITORS) continue
    const rows = [...list].sort((a, b) => a.first_seen_at.localeCompare(b.first_seen_at))
    const times = rows.map(r => new Date(r.first_seen_at).getTime())

    for (let i = 0; i < rows.length; i++) {
      let j = i
      while (j + 1 < rows.length && times[j + 1] - times[i] <= BURST_WINDOW_MS) j++
      const run = rows.slice(i, j + 1)
      if (run.length < BURST_MIN_VISITORS) continue
      const locations = new Set(run.map(locationKey)).size
      if (locations < BURST_MIN_LOCATIONS) continue

      const info: BurstInfo = { size: run.length, locations, spanMs: times[j] - times[i] }
      // Windows overlap, so a row can land in several runs. Keep the largest —
      // it is the one that best describes what the row was part of.
      for (const r of run) {
        const prev = found.get(r.id)
        if (!prev || info.size > prev.size) found.set(r.id, info)
      }
    }
  }
  return found
}

function hours(minutes: number): string {
  const h = minutes / 60
  return `${Number.isInteger(h) ? h : h.toFixed(1)}h`
}

/**
 * Positive evidence threshold.
 *
 * Flags what was OBSERVED, never a verdict on authenticity — see the module
 * comment on why there is no `Real` tag even now that every row carries one.
 */
const READER_MS = 45_000
/**
 * Scroll depth only became a real signal in 2026-07. Before that the client
 * sampled it once at init — before React had committed anything — where an
 * empty document reads as "fits the viewport", so every session was stored at
 * 100 and this test was a tautology: any silent 45s visit was a Reader. Rows
 * predating the fix still carry that 100 and will keep passing it. See the
 * `scrollPct()` comment in src/lib/telemetry.ts.
 */
const READER_SCROLL_PCT = 50

/**
 * The one tag every row is guaranteed: what this client is, or failing that,
 * what it did. First rung that matches wins — see the ladder in the module
 * comment.
 */
function natureOf(v: VisitorSummary, burst: BurstInfo | undefined, gap: number | null): VisitorTag {
  const ua = v.user_agent ?? ''
  const views = v.page_view_count
  const engaged = v.total_engaged_ms
  const seconds = Math.round(engaged / 1000)
  const pages = `${views} ${views === 1 ? 'page' : 'pages'}`

  // --- What the client IS. Machine kinds, most specific first. ---

  // Our own tooling, by either tell: the campaign tag synth-traffic.mjs stamps
  // on every visit it creates, or an automation user-agent. The campaign is the
  // load-bearing one — that script spoofs an ordinary browser UA on purpose, so
  // before this its runs were shaped exactly like strangers in the table.
  if (v.synthetic || (ua !== '' && TOOLING_UA.some(re => re.test(ua)))) {
    return {
      label: 'Test',
      automated: true,
      tone: 'muted',
      reason: v.synthetic
        ? 'Traffic generated by scripts/synth-traffic.mjs — tagged utm_campaign=synthetic-test at the source. Not a real visitor.'
        : `Browser automation, not a person: ${ua.slice(0, 80)}`,
    }
  }

  // Before the general bot list: most of these match /\bbot\b/ too.
  if (ua !== '' && LLM_UA.some(re => re.test(ua))) {
    return {
      label: 'LLM',
      automated: true,
      tone: 'muted',
      reason: `An AI crawler or assistant, self-identified in its user agent: ${ua.slice(0, 80)}. ` +
        'Either training/indexing, or a live fetch because someone asked it something — ' +
        'which is a reader at one remove, but never a browser, so it will never show engagement or scroll.',
    }
  }

  if (ua !== '' && BOT_UA.some(re => re.test(ua))) {
    return {
      label: 'Bot',
      automated: true,
      tone: 'muted',
      reason: `User agent matches a known crawler or HTTP client: ${ua.slice(0, 80)}`,
    }
  }

  // Below the self-identified crawlers, above the inferred ones: a client that
  // names itself has told you more than "it came through a proxy", but this
  // beats anything derived from behaviour.
  //
  // Deliberately requires BOTH halves. A clock that disagrees with the address
  // is a VPN, which plenty of real readers use; arriving alongside others is a
  // coincidence that a popular link can manufacture. Together they are not a
  // coincidence: one browser fingerprint, one frozen clock, several addresses,
  // minutes apart. The addresses are what rotates — the clock is what they
  // forgot to rotate.
  if (burst && gap !== null && gap >= TZ_GAP_MINUTES) {
    return {
      label: 'Proxy',
      automated: true,
      tone: 'muted',
      reason: `Arrived with ${burst.size - 1} other ${burst.size === 2 ? 'visitor' : 'visitors'} inside ` +
        `${Math.round(burst.spanMs / 1000)}s, sharing one browser fingerprint across ${burst.locations} ` +
        `different IP locations — while the browser's clock (${v.client_timezone}) sits ${hours(gap)} from ` +
        `the one its address implies (${v.timezone}). Rotating exit IPs behind a single automated client.`,
    }
  }

  // Telemetry only runs where JS runs, so a page view with no browser-reported
  // locale means the JS environment was stubbed — a headless client.
  if (views > 0 && !v.client_timezone && !v.language) {
    return {
      label: 'Headless',
      automated: true,
      tone: 'muted',
      reason: 'Recorded page views but reported no browser timezone or language, which a real browser always sends.',
    }
  }

  // Several pages with effectively no dwell is a scripted fetch, not reading.
  if (views >= 3 && engaged < NO_DWELL_MS) {
    return {
      label: 'No dwell',
      automated: true,
      tone: 'muted',
      reason: `${views} page views but under ${Math.round(NO_DWELL_MS / 1000)}s of engaged time — pages were fetched, not read.`,
    }
  }

  // --- What the client DID. Strongest outcome first. ---

  if (v.contact_count > 0) {
    return {
      label: 'Converted',
      tone: 'good',
      reason: `Submitted the contact form${views > 0 ? ` after ${pages}` : ' with no page view recorded'}.`,
    }
  }

  if (v.chat_message_count > 0) {
    return {
      label: 'Chatted',
      tone: 'good',
      reason: `Used the assistant — ${v.chat_message_count} messages exchanged — but never sent the contact form.`,
    }
  }

  // Nothing the tracker recorded. Not a judgement: telemetry is suppressed
  // entirely, client-side, for anyone sending Do Not Track or Global Privacy
  // Control, so this is exactly what a privacy-conscious visitor looks like.
  if (views === 0) {
    return {
      label: 'Untracked',
      tone: 'neutral',
      reason: 'No page view was ever recorded. Expected for a Do Not Track / Global Privacy Control ' +
        'opt-out (the tracking code exits before sending anything), and also what a request that never ' +
        'loaded a page looks like.',
    }
  }

  if (engaged >= READER_MS && (v.max_scroll_pct >= READER_SCROLL_PCT || views >= 3)) {
    return {
      label: 'Reader',
      tone: 'good',
      reason: `${seconds}s engaged` +
        (v.max_scroll_pct > 0 ? `, ${v.max_scroll_pct}% scroll depth` : '') +
        ` across ${pages} — read it, but never made contact.`,
    }
  }

  if (views <= 1 && engaged < BOUNCE_MS) {
    return {
      label: 'Bounce',
      tone: 'warn',
      reason: `A single page view with under ${Math.round(BOUNCE_MS / 1000)}s of engaged time.`,
    }
  }

  // Everything left: looked around, didn't stay, didn't leave immediately. The
  // ordinary middle, and the reason it is `neutral` — most traffic lands here
  // and it should recede rather than compete with the exceptions.
  return {
    label: 'Skimmed',
    tone: 'neutral',
    reason: `${pages}, ${seconds}s engaged` +
      (v.max_scroll_pct > 0 ? `, ${v.max_scroll_pct}% scroll depth` : '') +
      ' — more than a bounce, short of a proper read.',
  }
}

export function classifyVisitor(v: VisitorSummary, bursts?: BurstMap): VisitorTag[] {
  const burst = bursts?.get(v.id)
  const gap = timezoneGapMinutes(v)
  const nature = natureOf(v, burst, gap)
  const tags: VisitorTag[] = [nature]
  const views = v.page_view_count
  const converted = v.contact_count > 0
  const chatted = v.chat_message_count > 0
  // Qualifiers describe a person's behaviour, so they never apply to a machine.
  const isMachine = nature.automated === true

  // Spam only ever applies to something submitted; a quiet visitor is not spam.
  if (converted) {
    const email = v.contact_email ?? ''
    const name = v.contact_name ?? ''
    // Strong signals stand on their own. Weak ones are ambiguous in isolation
    // and only count alongside something else — a disposable address is a
    // preference rather than a tell, and "no page view" is exactly what an
    // honored Do Not Track / GPC opt-out looks like, since telemetry is
    // suppressed client-side before a single beacon goes out. Firing on either
    // alone tagged the most privacy-conscious visitors as junk for a submission
    // that was otherwise perfectly ordinary.
    const strong: string[] = []
    const weak: string[] = []

    if (URL_IN_TEXT.test(name)) strong.push('the submitted name contains a URL')
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) strong.push('the email is malformed')
    if (THROWAWAY_EMAIL.test(email)) weak.push('a disposable email domain')
    // The classic direct-POST bot never loads a page — but neither does anyone
    // sending DNT/GPC, so this cannot convict on its own.
    if (views === 0 && !chatted) weak.push('no page view was recorded (which is also what a Do Not Track opt-out looks like)')

    const spamReasons = [...strong, ...weak]
    if (strong.length > 0 || spamReasons.length >= 2) {
      tags.push({
        label: 'Spam?',
        tone: 'danger',
        reason: `Possible spam submission — ${spamReasons.join(', ')}. Worth reading before replying.`,
      })
    }
  }

  // Infrastructure qualifiers, not behavioural ones, so unlike Returning and
  // Spam? they do apply to a machine — knowing a crawler came through rotating
  // addresses is worth as much as knowing a person did. They are suppressed
  // only under `Proxy`, whose own reason already says both things.
  //
  // Neither carries `automated`. A VPN is a preference, not a tell, and a burst
  // on its own is what a link doing the rounds looks like. Only the confluence
  // is decisive, and that is a nature, not a qualifier.
  if (nature.label !== 'Proxy') {
    if (gap !== null && gap >= TZ_GAP_MINUTES) {
      tags.push({
        label: 'VPN?',
        tone: 'warn',
        reason: `The browser reported ${v.client_timezone} but the address geolocates to ${v.timezone} — ` +
          `${hours(gap)} apart, so at least a continent. Usually a VPN or a remote desktop, both of which ` +
          'ordinary readers use. Not a judgement on its own.',
      })
    }
    if (burst) {
      tags.push({
        label: 'Burst',
        tone: 'warn',
        reason: `One of ${burst.size} separate visitors that arrived within ${Math.round(burst.spanMs / 1000)}s ` +
          `sharing an identical browser fingerprint, across ${burst.locations} IP locations. ` +
          'Could be a link doing the rounds; could be one client behind several addresses.',
      })
    }
  }

  // Came back on a different day. Not merely two sessions — two visits twenty
  // minutes apart is one sitting. Worth surfacing because deliberate return is
  // the strongest interest signal here, and it is invisible everywhere else in
  // the table.
  if (!isMachine && v.session_count >= 2 && v.active_days >= 2) {
    tags.push({
      label: 'Returning',
      tone: 'good',
      reason: `Visited on ${v.active_days} separate days across ${v.session_count} sessions.`,
    })
  }

  return tags
}

/**
 * True when a row is machine traffic rather than a person.
 *
 * This is what the "Hide bots" toggle filters on — see `VisitorTag.automated`
 * for why `Bounce` and `Spam?` are deliberately excluded.
 */
export function isAutomated(v: VisitorSummary, bursts?: BurstMap): boolean {
  return classifyVisitor(v, bursts).some(t => t.automated)
}
