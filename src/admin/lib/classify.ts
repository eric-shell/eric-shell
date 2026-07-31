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
 *   nature (one, always)   Test · LLM · Bot · Headless · No dwell ·
 *                          Converted · Chatted · Reader · Bounce · Skimmed ·
 *                          Untracked
 *   qualifiers (any)       Returning · Spam?
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
function natureOf(v: VisitorSummary): VisitorTag {
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

export function classifyVisitor(v: VisitorSummary): VisitorTag[] {
  const nature = natureOf(v)
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
export function isAutomated(v: VisitorSummary): boolean {
  return classifyVisitor(v).some(t => t.automated)
}
