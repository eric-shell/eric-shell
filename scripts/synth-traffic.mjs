/**
 * Drive the LIVE site with a browser to produce real telemetry.
 *
 * Unlike `seed:crm`, which writes rows straight into Postgres, this exercises
 * the actual pipeline: the client script, /api/track, /api/events, the rate
 * limiter, and the SQL behind the dashboard. If a row lands from this, the
 * feature genuinely works end to end.
 *
 *   node scripts/synth-traffic.mjs [baseUrl]
 *
 * EVERY visit carries `utm_campaign=synthetic-test`, and the visitor UUIDs are
 * written to scripts/.synth-visitors.json, so the data is removable both ways.
 * Cleanup SQL is printed at the end.
 *
 * PACING IS NOT OPTIONAL. The rate limiters key on IP, and every visit here
 * shares one: /api/track allows 60 per 10 minutes, /api/events 10 per minute.
 * Exceed either and the endpoint returns 204 without writing, silently — the
 * client cannot tell a dropped beat from a stored one, so the only defence is
 * to stay under budget. The gaps below are sized for that, not for realism.
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const BASE = process.argv[2] ?? 'https://eric.sh'

/**
 * `--fast` collapses every dwell and gap to a fraction.
 *
 * ONLY for validating this script's own mechanics against a local server that
 * records nothing. Against a real deployment it guarantees rate-limit drops —
 * the pacing below is the whole reason the data lands.
 */
const FAST = process.argv.includes('--fast')
const rate = FAST ? 0.04 : 1

/** Marks every session this script creates, for cleanup. Never charted. */
const CAMPAIGN = 'synthetic-test'

// Playwright's own UA matches /headlesschrome/i and /playwright/i in the CRM's
// bot list, which would hide every one of these rows behind "Hide bots".
const UA = {
  desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  tablet: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/604.1',
}
const VIEWPORT = {
  desktop: { width: 1512, height: 900 },
  mobile: { width: 390, height: 844 },
  tablet: { width: 834, height: 1112 },
}

/**
 * The visits, deliberately uneven.
 *
 * A dashboard where every session scrolled the same amount and stayed the same
 * length proves nothing about the charts — the funnel, the viewport mix and the
 * hour column all need spread to be worth reading. `sessions: 2` reuses the
 * visitor with the session key cleared, which is the multi-document path where
 * the engaged-time baseline is carried forward.
 */
const VISITS = [
  { source: 'linkedin-profile', medium: 'profile', device: 'desktop', path: '/',        scroll: 65,  dwell: 22, clicks: 1 },
  { source: 'github-profile',   medium: 'profile', device: 'desktop', path: '/',        scroll: 95,  dwell: 26, clicks: 2 },
  { source: 'resume-pdf',       medium: 'pdf',     device: 'desktop', path: '/resume',  scroll: 100, dwell: 24, clicks: 1, then: '/' },
  { source: 'linkedin-dm',      medium: 'dm',      device: 'mobile',  path: '/',        scroll: 80,  dwell: 20, clicks: 1, then: '/resume' },
  { source: 'email-sig',        medium: 'email',   device: 'mobile',  path: '/',        scroll: 35,  dwell: 18, clicks: 0 },
  { source: null,               medium: null,      device: 'desktop', path: '/',        scroll: 90,  dwell: 25, clicks: 2, sessions: 2 },
  { source: 'instagram-bio',    medium: 'profile', device: 'mobile',  path: '/',        scroll: 55,  dwell: 19, clicks: 1 },
  { source: null,               medium: null,      device: 'tablet',  path: '/privacy', scroll: 100, dwell: 17, clicks: 0 },
  { source: 'outreach',         medium: 'email',   device: 'desktop', path: '/resume',  scroll: 70,  dwell: 21, clicks: 1 },
  { source: null,               medium: null,      device: 'mobile',  path: '/',        scroll: 12,  dwell: 16, clicks: 0 },
]

const sleep = ms => new Promise(r => setTimeout(r, ms))

function entryUrl({ path, source, medium }) {
  const q = new URLSearchParams()
  if (source) q.set('utm_source', source)
  if (medium) q.set('utm_medium', medium)
  q.set('utm_campaign', CAMPAIGN)
  return `${BASE}${path}?${q}`
}

/** Cancel navigation in the bubble phase, which runs AFTER the telemetry
 *  listener's capture phase — so the click is recorded, then discarded. */
async function blockNavigation(page) {
  await page.evaluate(() => {
    if (window.__synthNoNav) return
    window.__synthNoNav = true
    document.addEventListener('click', e => {
      if (e.target instanceof Element && e.target.closest('a')) e.preventDefault()
    })
  })
}

/** Scroll in steps so the passive scroll listener actually samples on the way. */
async function scrollTo(page, pct) {
  await page.evaluate(async target => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    if (max <= 0) return
    for (let i = 1; i <= 14; i++) {
      window.scrollTo(0, (max * target / 100) * (i / 14))
      await new Promise(r => setTimeout(r, 110))
    }
  }, pct)
}

async function clickOutbound(page, want) {
  if (want < 1) return 0
  await blockNavigation(page)
  const hrefs = await page.evaluate(() => {
    const out = []
    for (const a of document.querySelectorAll('a[href]')) {
      let u
      try { u = new URL(a.getAttribute('href'), location.href) } catch { continue }
      const off = (u.protocol === 'http:' || u.protocol === 'https:') && u.host !== location.host
      if ((off || u.protocol === 'mailto:') && a.getBoundingClientRect().width > 0) {
        out.push(a.getAttribute('href'))
      }
    }
    return [...new Set(out)]
  })

  let done = 0
  for (const href of hrefs.slice(0, want)) {
    try {
      await page.locator(`a[href="${href.replace(/"/g, '\\"')}"]`).first()
        .click({ force: true, timeout: 4000 })
      done++
      // /api/events allows 10 per minute across every visit in this run.
      await sleep(7000 * rate)
    } catch { /* off-screen or detached — not worth failing the run over */ }
  }
  return done
}

async function runVisit(browser, v, i) {
  const ctx = await browser.newContext({
    userAgent: UA[v.device],
    viewport: VIEWPORT[v.device],
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
  })
  const page = await ctx.newPage()
  let clicks = 0

  const rounds = v.sessions ?? 1
  let visitorId = null

  for (let r = 0; r < rounds; r++) {
    await page.goto(entryUrl(v), { waitUntil: 'load' })
    await page.waitForTimeout(1500 * rate)
    visitorId ??= await page.evaluate(() => localStorage.getItem('eric.sh:vid'))

    await scrollTo(page, v.scroll)
    clicks += await clickOutbound(page, v.clicks)

    // Dwell so engaged time accrues and the 15s heartbeat fires at least once.
    await page.waitForTimeout(v.dwell * 1000 * rate)

    if (v.then) {
      // A real in-site navigation: fires pagehide (flushing by beacon) and
      // starts a second document under the same session id.
      await page.goto(`${BASE}${v.then}`, { waitUntil: 'load' })
      await page.waitForTimeout(1500 * rate)
      await scrollTo(page, Math.min(100, v.scroll + 15))
      await page.waitForTimeout(16000 * rate)
    }

    // Unload flushes the final beat via sendBeacon.
    await page.goto('about:blank')
    await page.waitForTimeout(1200 * rate)

    if (r + 1 < rounds) {
      // Same visitor, fresh session — the client rolls a new session id when
      // the stored one is missing, without touching the visitor UUID.
      await ctx.addInitScript(() => {
        try { localStorage.removeItem('eric.sh:sess') } catch { /* ignore */ }
      })
    }
  }

  await ctx.close()
  const tag = v.source ?? 'direct'
  console.log(
    `  ${String(i + 1).padStart(2)}. ${tag.padEnd(17)} ${v.device.padEnd(8)} ` +
    `${v.path.padEnd(9)} scroll ${String(v.scroll).padStart(3)}%  ` +
    `${rounds} session${rounds > 1 ? 's' : ''}  ${clicks} click${clicks === 1 ? '' : 's'}  ${visitorId?.slice(0, 8) ?? '??'}`
  )
  return { visitorId, source: v.source, clicks, sessions: rounds }
}

console.log(`\nDriving ${BASE} with ${VISITS.length} synthetic visits.`)
console.log('Paced for the IP rate limits — this takes several minutes.\n')

const browser = await chromium.launch()
const results = []
for (const [i, v] of VISITS.entries()) {
  results.push(await runVisit(browser, v, i))
  // Spread /api/track calls across the 10-minute window.
  await sleep(4000 * rate)
}
await browser.close()

const ids = results.map(r => r.visitorId).filter(Boolean)
writeFileSync('scripts/.synth-visitors.json', JSON.stringify({ campaign: CAMPAIGN, ids }, null, 2))

console.log(`\nDone. ${ids.length} visitors, ${results.reduce((n, r) => n + r.sessions, 0)} sessions, ` +
            `${results.reduce((n, r) => n + r.clicks, 0)} outbound clicks attempted.`)
console.log('Visitor ids written to scripts/.synth-visitors.json\n')
console.log('To remove every trace of this run:\n')
console.log(`  delete from visitors where id in (\n    ${ids.map(i => `'${i}'`).join(',\n    ')}\n  );\n`)
console.log('  -- or, by tag (also catches visits whose id file was lost):')
console.log(`  delete from visitors where id in (select visitor_id from visitor_sessions where utm_campaign = '${CAMPAIGN}');\n`)
