# Admin CRM — Reference

A password-gated admin page at `/dashboard` (sign-in at `/login`) for viewing every chat thread and contact form submission, keyed by an anonymous client-generated visitor UUID. Persistence runs alongside the existing chat stream and contact email — they are best-effort and never block the public response.

## File map

| Concern | File |
|---|---|
| Schema (apply once via Neon SQL editor) | [db/schema.sql](db/schema.sql) |
| Neon HTTP client (cached `sql()` helper) | [api/_lib/db.ts](api/_lib/db.ts) |
| Visitor upsert (validates `X-Visitor-Id` header) | [api/_lib/visitor.ts](api/_lib/visitor.ts) |
| Admin auth (HMAC cookie, password check, 2FA challenge, `requireAdmin`) | [api/_lib/auth.ts](api/_lib/auth.ts) |
| Admin endpoints | [api/admin/login.ts](api/admin/login.ts), [api/admin/verify.ts](api/admin/verify.ts), [api/admin/logout.ts](api/admin/logout.ts), [api/admin/session.ts](api/admin/session.ts), [api/admin/visitors.ts](api/admin/visitors.ts), [api/admin/visitors/[id].ts](api/admin/visitors/%5Bid%5D.ts) |
| Chat persistence wiring | [api/chat.ts](api/chat.ts) (after `res.end()`) |
| Contact persistence wiring | [api/contact.ts](api/contact.ts) (visitor resolved before the send, row inserted before `res.json()`) |
| Page-view / session telemetry endpoint | [api/track.ts](api/track.ts) — `pageview` + `heartbeat` ops |
| Client telemetry beacon | [src/lib/telemetry.ts](src/lib/telemetry.ts) — init'd from [src/main.tsx](src/main.tsx), outside the React tree |
| Location display resolver | [src/admin/lib/location.ts](src/admin/lib/location.ts) — `resolveLocation()` |
| Page-view cache for visitor detail | [src/admin/lib/detailCache.ts](src/admin/lib/detailCache.ts) — `detailStamp()` / `readDetail()` |
| Client visitor ID generator | [src/lib/visitorId.ts](src/lib/visitorId.ts) — `localStorage['eric.sh:vid']` |
| Client session ID | [src/lib/telemetry.ts](src/lib/telemetry.ts) — `localStorage['eric.sh:sess']`, 30-min inactivity rollover |
| Visitor ID is sent on | [src/hooks/useChat.ts](src/hooks/useChat.ts), [src/components/ui/ContactForm/ContactForm.tsx](src/components/ui/ContactForm/ContactForm.tsx) — `X-Visitor-Id` header |
| Admin SPA entry | [dashboard.html](dashboard.html) → [src/admin/main.tsx](src/admin/main.tsx) → [src/admin/App.tsx](src/admin/App.tsx) |
| Admin SPA components | [src/admin/components/](src/admin/components/) — Login, Dashboard, VisitorList, VisitorDetail, VisitorMetaGrid, ConversationTimeline, ActivityTimeline, ContactSubmissionList |
| Route map (`/login`, `/dashboard`, `/403`) | [vercel.json](vercel.json) — `rewrites` |
| Multi-page Vite config | [vite.config.ts](vite.config.ts) — `rollupOptions.input` includes both `main` and `dashboard` |
| Sign-out / error pages sharing the login layout | [public/404.html](public/404.html), [public/403.html](public/403.html) |
| Indexer hint | [public/robots.txt](public/robots.txt) — disallows `/dashboard` and `/api/admin/` |

## Architecture facts

- **Storage**: Neon Postgres (Vercel marketplace integration). Tables: `visitors`, `chat_messages`, `contact_submissions`, `visitor_events`, `visitor_sessions`, `page_views`. Schema is checked into [db/schema.sql](db/schema.sql) and applied manually — no migration tool.
- **DB client**: `@neondatabase/serverless` over HTTP (not the WebSocket pool). The `sql()` helper in [api/_lib/db.ts](api/_lib/db.ts) caches one client per process.
- **Visitor identity**: client generates `crypto.randomUUID()` on first interaction, stores at `localStorage['eric.sh:vid']`, sends as `X-Visitor-Id` on every `/api/chat` and `/api/contact` POST. Server validates the format with a UUID regex before any DB write. **Trust model: anonymous, best-effort attribution.** Anyone with someone else's UUID could write to that visitor's thread; UUIDs are random so this is impractical to exploit but worth knowing.
- **The session owns the identity, not the visitor id.** Requests also carry `X-Session-Id` (`identityHeaders()` in [src/lib/telemetry.ts](src/lib/telemetry.ts)), and every visitor write resolves through `coalesce((select visitor_id from visitor_sessions where id = $sess), $vid)` — the first page view of a visit establishes the owner and `visitor_sessions` never reassigns `visitor_id`, so later requests in that visit land on the owner no matter what the browser now thinks its id is. This exists because a visitor id that changed mid-visit forked one real visit into two CRM rows (page views under the id `initTelemetry()` pinned at load, chat/contact/clicks under the id read at call time). **Callers must persist against the id `upsertVisitor()` returns, never the one they read off the header** — `events.ts` inserts its event row against the return value for exactly this reason. `getVisitorId()` also caches per document, so one page is always one identity. Repair a historical fork with `node scripts/merge-visitors.mjs <keepId> <mergeId> [--apply]` (dry run by default; keep the id that owns the session).
- **Persistence is best-effort and order matters.** Both handlers wrap DB writes in try/catch so a Postgres outage can't break the public surface. **`contact.ts` persists BEFORE `res.json()`** — Vercel can freeze the function container as soon as a discrete response is flushed, silently dropping any trailing async work (we hit this on first deploy: chat persisted, contact didn't). **`chat.ts` persists AFTER `res.end()`** because the assistant reply isn't known until the stream completes; this works in practice (the streaming socket keeps the function alive long enough for the trailing DB write to land), but if it ever stops working, switch to `waitUntil()` from `@vercel/functions`.
- **Admin SPA is a separate Vite entry point** (`dashboard.html` at project root) so the admin bundle never ships with the public site. Session state is detected by probing `/api/admin/session` on mount — a cookie-only check that touches no database, unlike the old probe against `/api/admin/visitors`, which ran the whole aggregate query just to read its status code.
- **No analytics on the admin path** — admin is internal-only and shouldn't fire gtag events.
- **Location is IP-derived and genuinely unreliable.** `country` / `city` / `region` / `timezone` come from Vercel edge headers (`x-vercel-ip-country`, `-city`, `-country-region`, `-timezone`). Mobile carriers, CGNAT, and VPNs routinely report a city hundreds of miles off — we saw a San Luis Obispo visitor land as "Redding". `location_override` is the human-entered correction; it always wins on display, and the raw IP values are kept so the original claim stays auditable. Resolve for display with `resolveLocation()` in [src/admin/lib/location.ts](src/admin/lib/location.ts) — never concatenate `city`/`country` at a call site, and always mark IP-derived values as approximate in the UI.
- **All geo headers are absent outside the edge**, so local `vercel dev` legitimately writes nulls. A blank location with a non-null `user_agent` is almost always a dev-session row.
- **Every visitor-row writer must go through `upsertVisitor`** ([api/_lib/visitor.ts](api/_lib/visitor.ts)). `events.ts` originally did a bare `insert into visitors (id)`, which stranded events-only visitors (opened the chat, toggled high-contrast, never sent a message) with no UA, geo, or referrer — permanently, since nothing later backfills them. The `on conflict` clause uses `coalesce(existing, new)`, which keeps the first non-null sighting *and* backfills columns still null, so a later edge request repairs an incomplete row.
- **`x-vercel-ip-city` is percent-encoded.** Decode via `readGeoHeader`, which try/catches `decodeURIComponent` — a malformed sequence used to reject the whole `upsertVisitor` promise, and in `chat.ts` that discarded the entire transcript, not just the city.
- **The contact notification email carries a link to the visitor's CRM row.** `contact.ts` therefore resolves `upsertVisitor(req)` *before* the Resend send rather than after, and reuses the returned id for the insert — don't upsert twice. It has its own try/catch: a Postgres outage costs the link, never the email, and the submission still inserts with a null `visitor_id`. The URL is built from the request's own host (`crmLink`), so a preview deployment links to its own dashboard.

## Auth: `/login`, `/dashboard`, and the second factor

**One bundle, two routes.** `vercel.json` rewrites both `/login` and `/dashboard` to the same `dashboard.html`; [src/admin/App.tsx](src/admin/App.tsx) reads `window.location.pathname` and decides which of `Login` / `Dashboard` to render. There is deliberately no separate `login.html` entry — a second Vite entry would mean a second React runtime and a second copy of the auth probe for a page that is two form fields.

- **Neither UI can flash before its redirect lands.** App.tsx renders the loading state until the probe has resolved *and* the route agrees with the answer (`authed !== isLogin`). An authenticated visitor on `/login` is `replace`d to `/dashboard`; a logged-out one on `/dashboard` is `replace`d to `/login`. `replace`, not `assign`, so the back button can't bounce off a redirect.
- **Sign-in is two steps.** `POST /api/admin/login` with the right password establishes **no session**. It mints a random opaque `challengeId`, stores an HMAC of a 6-digit code in Upstash under a 5-minute TTL, emails the code to `ADMIN_2FA_EMAIL` via Resend, and returns `{ ok: true, mfa: true, challengeId }`. `POST /api/admin/verify` takes `{ challengeId, code }`, compares in constant time, allows **5 attempts**, deletes the challenge once spent or exhausted (single use, no replay), and only then sets the session cookie. Both endpoints sleep the same constant 1500ms and both are rate-limited (`admin-login` 10/10min + 50/day, `admin-verify` 15/10min + 60/day).
- **THE SECOND FACTOR FAILS OPEN, ON PURPOSE.** If `ADMIN_2FA_EMAIL` is unset, or `RESEND_API_KEY` is unset, or the Upstash vars are unset or unreachable, or the Resend send throws, `login.ts` logs the reason and issues the session on the password alone (`{ ok: true, mfa: false }`, cookie already set). The owner must never be locked out of their own dashboard by a third-party outage, and what this gate protects is read-only analytics about their own visitors. The `signIn()` fallback branches in [api/admin/login.ts](api/admin/login.ts) are the only lines to change if that stops being acceptable. **Verification does *not* fail open** — once a challenge exists, an Upstash error is a failed verification, never a pass.
- **The code is never logged, and neither is the address or the challenge id.** Every verify failure — unknown id, expired, wrong code, attempts exhausted, store down — returns the same 401 and the same message, so a caller can't learn whether a challenge id is live.
- **The stored code is an HMAC keyed on `ADMIN_SESSION_SECRET`**, not a bare digest. Six digits is trivially enumerable offline, so a plain SHA-256 sitting in Redis would be equivalent to storing the code in clear.
- **Session cookie**: HMAC-SHA256-signed timestamp, `HttpOnly` + `Secure` + `SameSite=Strict` + `Path=/`, **24-hour** max-age (was 7 days), verified with `timingSafeEqual`. Still no server-side revocation list — rotating `ADMIN_SESSION_SECRET` is how you kill every session.
- **The cookie has two names and that is not a bug.** Deployed environments get `__Host-admin_session`; the prefix makes a browser refuse the cookie unless it is `Secure`, `Path=/` and `Domain`-less, so no sibling subdomain can plant or overwrite an admin session. The prefix is not dependably settable on `http://localhost`, so `vercel dev` keeps the unprefixed `admin_session` (plain `Secure` has always worked there — localhost is a trustworthy origin). `requireAdmin` reads either, preferring the prefixed one; `clearSessionCookie` expires both. Don't "simplify" this to one name without testing local sign-in.
- Single user only; no multi-account support.

### The sign-in / error page family

`/login`, `public/404.html` and `public/403.html` share **one layout**: logo pair, `Eyebrow`, Display headline on a single `clamp(2.25rem, 9vw, 4.5rem)`, lede, CTA — same vertical rhythm in all three, so they read as one system.

- **The two static pages hand-port the design system.** Vercel serves them straight out of `/public`, so there is no React, no Tailwind build and no shared stylesheet: the dark `Backdrop` (three drifting blobs + 48s hue sweep), the film grain data-URI, the Display headline and the `primary` button gradient (including the chroma-not-lightness hover) are all rewritten as plain CSS. **Their CSS is duplicated between the two files on purpose** — extracting it would make an error page depend on a second network request that may itself be what is failing, and two hand-written files don't justify a template pipeline. Change one, change the other.
- `prefers-reduced-motion` freezes the drift but keeps the blobs visible, matching what [src/index.css](src/index.css) does.
- **404 needs no rewrite** — Vercel serves `public/404.html` by convention for any unmatched path. **403 has no such convention**, so `vercel.json` gives it the clean `/403` URL. Nothing currently redirects there; it exists as the destination for any future edge deny, and as something to point at rather than leaking a raw 401 body.
- **403's copy is deliberately non-specific.** It is what an unauthorized visitor sees, so it must never confirm what lives at the path they tried — no mention of an admin area, a dashboard, or a sign-in page.

## Page-view / session telemetry

Before this existed the CRM was really a *chat* log: every `visitors` row was a byproduct of `/api/chat`, `/api/contact`, or `/api/events`, so an ordinary reader who never touched the chat widget was invisible, and `user_agent` was only captured if they happened to hit a handler that called `upsertVisitor`.

- **[api/track.ts](api/track.ts) takes two op types.** `pageview` fires once per document load as a real `fetch`, so it carries `X-Visitor-Id` *and* the Vercel edge geo headers — that is the only place enrichment happens. `heartbeat` goes out via `navigator.sendBeacon`, which **cannot set headers**, so it only ever updates engagement. Don't move enrichment into the heartbeat path.
- **Routing is MPA**, so no SPA router integration is needed: [App.tsx](src/App.tsx) reads `window.location.pathname` once and navigation uses real `<a href>` with cross-document view transitions. Every route change is a fresh document load and a fresh `pageview`.
- **`engaged_ms` / `max_scroll_pct` are monotonic.** The client sends *cumulative* totals; the server applies `greatest(existing, incoming)`. A late or out-of-order beacon therefore can't walk a session backwards. Keep that property if you add fields.
- **Engaged time only accrues while the tab is visible** (`visibilitychange`), so a page parked in a background tab doesn't inflate to hours. It is not the same as wall-clock session length.
- **Flush happens on both `visibilitychange→hidden` and `pagehide`**, both via `sendBeacon`. Mobile Safari frequently never fires `pagehide`, so the visibility path is the one that actually saves the last beat there.
- **Sessions live in `localStorage`, not `sessionStorage`** (`eric.sh:sess`), with a 30-minute inactivity rollover, so a visit spanning several tabs stitches into one session. Private mode / disabled storage falls back to a per-load id — pageviews still land, they just don't stitch.
- **GPC / DNT are honored**: `initTelemetry()` returns before sending anything if `navigator.globalPrivacyControl` is true or DNT is `1`/`yes`. This is a deliberate product decision, not a legal requirement — don't "fix" it. Verified with Playwright.
- **`initTelemetry()` is called from [src/main.tsx](src/main.tsx) outside the React tree**, because StrictMode double-invokes effects in dev and would double-count every pageview.
- **Rate limits are much looser than the other endpoints** (burst 20/min, hourly 400) because heartbeats are timer-driven: a continuously-open tab sends ~180/hour at `HEARTBEAT_MS = 20s`. The client also skips no-op beats, so a parked tab stops generating writes. `/api/track` always answers `204`, even when limited or when the payload is junk — telemetry must never surface anything to a visitor.
- **Cast summed durations to `::float8`, never `::bigint`.** The Neon driver returns `int8` as a *string*, which silently violates the numeric types on `VisitorSummary`.
- **`visitor_sessions` and `page_views` both cascade** from `visitors`, so the existing GDPR delete path in [api/admin/visitors/[id].ts](api/admin/visitors/%5Bid%5D.ts) already covers them. Verified.
- **[Privacy.tsx](src/components/sections/Privacy/Privacy.tsx) must stay in sync** with whatever this collects — it discloses pageviews, visit duration, scroll depth, viewport/screen, browser language and timezone, and the GPC/DNT opt-out. Update it in the same commit as any new field.

## Visual language

The admin deliberately reuses the public site's design vocabulary rather than inventing admin chrome — it used to read as generic Tailwind scaffolding. **No new hues were added; the fixed palette decision in CLAUDE.md still holds, and there is no dark mode here either.**

- **Ambient canvas**: [src/admin/App.tsx](src/admin/App.tsx) renders `<Backdrop tone="light" className="fixed" />`. The `fixed` override matters — Backdrop defaults to `absolute`, which on a long scrolling visitor table would stretch the blobs to the full document height. It sits behind every panel, so it never reduces text contrast.
- **Elevation over borders**: panels use `shadow-sm ring-1 ring-blue-950/4` for layered depth. The expanded visitor detail is tinted `bg-blue-50/60` with `shadow-inner` so it reads as a drawer off the selected row, not another flat top-level card.
- **Type**: `Eyebrow` + `H2` pairing in the header and login, matching the site's section headers. Stat-tile labels stay **uppercase micro-type** to match the `Eyebrow` idiom — a deliberate departure from the dataviz skill's sentence-case stat-tile default, since casing is a design-system parameter.
- **Semantic color is reserved for one thing**: a contact submission. Used on the "Converted" tile and the table's `Sent` column, always with a `MailCheck` icon so it is never color-alone. `green-700` is 5.96:1 on white (AA text).

### Chart colors — validated, not eyeballed

[VisitorsChart.tsx](src/admin/components/VisitorsChart.tsx) is a single series, so **it has no legend** (the caption names it). Colors come from the brand ramp and were run through the dataviz skill's `validate_palette.js`:

| Role | Token | Hex | Result |
|---|---|---|---|
| Bar body (de-emphasis) | `blue-400` | `#64a3c0` | light-end contrast 2.78:1 vs white ✅ |
| Current / hovered period (accent) | `blue-700` | `#186b8e` | ordinal pair: monotone L, ΔL ≥ 0.06, hue spread 3° ✅ |

Two findings worth remembering before you touch these:

- **`blue-200` fails** the ordinal light-end floor at **1.60:1** vs white — bars would nearly vanish on a white panel. Don't reach for it as a "subtle" bar fill. `blue-300` (2.05:1) passes but `blue-400` is the comfortable choice.
- **The brand blue is below the validator's chroma floor** (`blue-600` chroma 0.091, "reads gray"). That's fine for a lone series where no adjacent-pair discrimination is needed, but it means **this palette can't carry a multi-series categorical chart** — green↔red already fail CVD separation at ΔE 3.0. If you ever need more than one series, use small multiples or faceting, not more hues.

Mark specs the chart implements (from the skill): bars capped at **24px** with the band's leftover left as air, **4px** rounded data-end and square at the baseline, hairline solid baseline (never dashed), the hit target is the full column (not the few-pixel bar), the direct label is selective (hovered/latest only), and every value is also in an `sr-only` list so nothing is gated behind hover. It's built from divs rather than SVG because the old `preserveAspectRatio="none"` stretched non-uniformly and distorted both the corner radius and the gaps.

### Mobile sort uses a native `<select>`, on purpose

Below `md` the visitor table becomes cards, so there are no column headers to
click and sorting moves to a control in [VisitorList.tsx](src/admin/components/VisitorList.tsx).
That control is a plain `<select>` rather than the shared [Dropdown](src/components/ui/Dropdown/Dropdown.tsx) — **don't "fix" it**:

- It is `md:hidden`, so it only ever renders on a phone. On Android a native select opens the **OS picker** — a full-width sheet with large touch targets — where `Dropdown` renders a `position: fixed` in-page listbox sized for a mouse.
- `Dropdown`'s keyboard navigation is its main advantage, and it does nothing on a touch screen.
- `Dropdown` hardcodes `variant="primary"` on its trigger (a solid blue CTA, far too loud beside a direction toggle) and a light listbox (`bg-white`, `text-blue-950`). Using it here would mean adding a trigger `variant` prop plus dark listbox styling to a shared component, for one mobile-only call site.

Reconsider only if `Dropdown` picks up a dark variant for some other reason, or if a desktop sort control ever appears — sorting on desktop is the column headers.

The direction toggle deliberately uses `ArrowUpNarrowWide` / `ArrowDownWideNarrow`, never a chevron: the native select draws its own chevron immediately to the left, and two side by side read as two dropdowns. It also carries the word Asc/Desc so it never depends on the glyph.

## Traffic quality tags

[classify.ts](src/admin/lib/classify.ts) labels low-value rows; [VisitorTags.tsx](src/admin/components/VisitorTags.tsx) renders them in the Visitor column.

**These are presentational only.** Nothing is hidden, filtered, deleted, or blocked on the strength of a tag — they exist so a real lead isn't buried under crawler noise. Every tag carries a `reason`, shown as a title, because an unexplained "spam" badge on a genuine visitor is worse than no badge.

**Every row carries exactly one nature tag, plus any qualifiers.** A blank Flags cell is a bug, not a shrug. The nature ladder is ordered by how much it explains — what the client IS beats what it did, and the first rung that matches wins:

| # | Nature tag | Fires when | `automated` |
|---|---|---|---|
| 1 | `Test` | `utm_campaign=synthetic-test` (our synth-traffic script) or an automation UA — Playwright, Puppeteer, HeadlessChrome, Lighthouse | ✓ |
| 2 | `LLM` | UA is a self-identified AI crawler or assistant — GPTBot, ClaudeBot, PerplexityBot, CCBot, YouBot, ChatGPT-User… | ✓ |
| 3 | `Bot` | UA matches the curated crawler / HTTP-client list | ✓ |
| 4 | `Proxy` | In a `Burst` **and** ≥4h of `VPN?` clock disagreement — see below | ✓ |
| 5 | `Headless` | Page views recorded but no browser timezone *or* language — a real browser always sends both | ✓ |
| 6 | `No dwell` | 3+ page views with under 2s engaged — fetched, not read | ✓ |
| 7 | `Converted` | Submitted the contact form | |
| 8 | `Chatted` | Used the assistant, never submitted | |
| 9 | `Untracked` | No page view ever recorded — expected for a GPC/DNT opt-out, since telemetry exits client-side before sending | |
| 10 | `Reader` | 45s+ engaged with deep scroll or 3+ pages | |
| 11 | `Bounce` | A single view under 5s | |
| 12 | `Skimmed` | Everything else with page views — the ordinary middle | |

Qualifiers stack on top:

| Qualifier | Fires when | On machines |
|---|---|---|
| `Returning` | Sessions on 2+ **separate days** — two visits twenty minutes apart is one sitting | |
| `Spam?` | A submission with a URL in the name or a malformed email, or two weaker signals together | |
| `VPN?` | `client_timezone` and IP-derived `timezone` are ≥4h apart at the visit's own instant | ✓ |
| `Burst` | 3+ **separate visitor rows** in 10 minutes sharing one `(client_timezone, user_agent)` across 2+ IP locations | ✓ |

`Returning` and `Spam?` describe a person's behaviour and never fire on a machine. `VPN?` and `Burst` describe infrastructure, so they *do* — knowing a crawler came through rotating addresses is worth as much as knowing a person did. Both are suppressed under `Proxy`, whose own reason already says both things.

### The proxy rules

Added after seven visitors arrived in two tight bursts, all reporting `Europe/Berlin` on an identical Windows Chrome UA while their addresses geolocated to Buffalo, Columbia, Spokane, New York and Milledgeville. Rotating exit IPs behind one automated client: the addresses are what rotates, the clock is what they forgot to rotate.

These are the CRM's only **cross-row** signals. `classifyVisitor` takes an optional `BurstMap` from `detectProxyBursts(visitors)`; omit it and they simply don't fire, which is the safe direction to fail. `Dashboard` computes it once over the **full** list — before the timeframe narrows it, so a cluster straddling midnight doesn't half-dissolve — and threads it through `VisitorsPanel` → `VisitorList` and into `sortVisitors`, so the Flags column sorts by what its cell renders.

- **Neither half convicts alone, and that's the whole design.** A clock that disagrees with the address is a VPN, which plenty of real readers use; arriving alongside others is what a link doing the rounds looks like. Only the confluence is decisive, which is why `Proxy` is a nature and the two halves are qualifiers carrying no `automated`.
- **Four hours, not three.** Three is exactly the width of the continental US — someone in LA whose corporate VPN exits in Virginia is an ordinary thing to be. Verified against real data: a Boydton, VA row (an Azure region) sits at exactly 3h and correctly stays `Skimmed`.
- **Offsets are computed at the visit's own timestamp**, never "now". Europe/Berlin is +1 in January and +2 in July, and the hemispheres change over on different dates; comparing at the wrong instant manufactures an hour of disagreement.
- **Grouping on the UA is what keeps ordinary traffic out.** The owner testing across a laptop, phone and tablet makes a tight one-city cluster — but three user agents, so it splits into groups too small to fire. Verified: ten such rows stayed `Skimmed`. Real people also don't agree on a browser patch version.
- **Two distinct locations is enough** *because* of that grouping — one fingerprint in two cities inside ten minutes is already the contradiction.
- **Rows are the unit, not page views.** A visitor id lives in localStorage, so one person reloading stays one row however many times they hit the page. Three rows means three storage contexts.
- **A missing fingerprint is not a shared one.** Rows with no UA or no browser timezone are skipped, or they'd all pile into one group and burst together.

**There is still deliberately no "Real" or "Authentic" tag.** Absence of bot signals is not evidence of a person. Full coverage is achieved by naming what was OBSERVED — `Skimmed`, `Untracked` — never by asserting humanity. The cost of tagging every row is that the column can't spot exceptions by being mostly empty, so **tone does that job instead**: ordinary states use the `neutral` tone (no fill, faintest ring) and recede; only `Spam?` is loud. Don't promote a baseline tag to a louder tone without re-thinking that.

**Tags are derived at render time, never stored.** Changing a rule relabels the whole history on the next paint — there is nothing to backfill, and nothing to migrate if a rule turns out wrong.

`LLM` is checked *before* `Bot` because most AI agents also match `/\bbot\b/`. The UA is the only signal available (it's the one request header stored), and it's self-reported: this catches agents that identify themselves and cannot catch one that doesn't want to be. Anything stronger — Web Bot Auth's `Signature-Agent` header, published IP ranges, reverse DNS — means collecting more per request and disclosing it in [Privacy.tsx](src/components/sections/Privacy/Privacy.tsx).

### Filters

Two opt-in toggles sit in a `FILTER` row above the table (not inside the search
field — search is a lookup, these change which rows count at all). Both persist
in `localStorage` and both report how many rows they remove, so hiding is never
silent.

| Toggle | Removes |
|---|---|
| `Hide automated` | Rows whose tags carry `automated` — Test, LLM, Bot, Proxy, Headless, No dwell |
| `Engaged only` | Rows that neither chatted nor submitted the form |

The label names the **predicate**, not the list. It was "Hide bots & tests" while it hid five things and had been inaccurate since `LLM` shipped; a label that enumerates has to be edited every time the classifier grows, and won't be. `VisitorTag.automated` is the contract — keep the label pointed at it.

**They narrow the metric tiles too**, deliberately. Search does not. A filter is
a statement about which traffic counts, so leaving the tiles reading 28 while
the table showed 25 — with conversion percentages still diluted by crawlers —
would defeat the point. Typing a name is just a lookup and must not rewrite the
totals above it.

**`Spam?` and `Bounce` are never auto-hidden.** A bounce is a real person who
left quickly, and hiding those would delete most genuine traffic. A spam flag is
a prompt to *read* a submission, not a verdict — the heuristics have false
positives, and hiding a real enquiry costs far more than showing a junk one. A
spammer that is also a bot disappears under the bot rule anyway. This is encoded
as `VisitorTag.automated`, so the distinction lives with the classifier rather
than in the UI.

Considered and rejected: a "Hide bounces" toggle (hides real humans) and a
"Hide spam" toggle (see above).

**Also rejected: folding `Spam?` into the automated filter, or renaming that
filter around spam.** They measure different things and fail in opposite
directions. `automated` answers "is this a machine" and is safe to hide, because
being wrong costs you a crawler. `Spam?` answers "is this submission worth
reading before replying" — it fires on rows that are, by definition, a human who
filled in your contact form, and being wrong costs you a lead. Naming one filter
after the other would put a question-marked heuristic in charge of whether real
enquiries appear. The question mark in `Spam?` is load-bearing.

Rules that keep it honest, and that you should preserve when tuning:

- **Never match `bot` mid-word.** `CUBOT` is a real Android phone brand, and `Abbott` appears in corporate user agents; a loose `[a-z]bot` pattern flags both. Use `\b` boundaries and the explicit `Bot/` version form.
- **Engagement outranks heuristics.** A visitor who chatted or submitted the form is never tagged `Bounce`, however brief the visit.
- **`Spam?` separates strong signals from weak ones.** A URL in the name or a malformed email fires alone; a disposable domain or a missing page view needs a second signal before the tag appears. Keep new heuristics on the right side of that line.
- **A disposable email alone is never spam** — plenty of real people use them. It only contributes alongside another signal.
- **A missing page view is not evidence of a bot.** Telemetry is suppressed client-side for anyone sending Do Not Track or GPC, so an honored opt-out and a direct-POST bot look identical on that test. It was the sole reason `Spam?` fired on ordinary submissions from privacy-conscious visitors.
- `Spam?` keeps its question mark on purpose. It is a prompt to read the message, not a verdict.

Signals are limited to what a list row carries (`VisitorSummary`) — plus, for the two proxy rules, the other rows in the same list. Anything needing message bodies or scroll depth belongs in the detail view.

**No new data is collected for any of this.** `client_timezone` and `timezone` were both already stored and already disclosed on the privacy page; the proxy rules are inference over columns that existed. Keep it that way — a rule needing a new request header is a privacy decision, not a tuning change.

## Cost & performance

This runs on Vercel + Neon + Upstash, all metered. Telemetry is the highest-volume
surface on the site, so the defaults matter. Per **one open tab for an hour**:

| | Before | After |
|---|---|---|
| Function invocations | 181 | 16 |
| Postgres round trips | 364 | 16 |
| Upstash commands | 362 | 16 |

The levers, and why each one is where it is — don't undo these casually:

- **The dashboard polls only while visible.** Neon bills compute-hours and autosuspends an idle endpoint; a background tab firing two aggregate queries every 60s pinned the compute awake around the clock, for data nobody was looking at. `POLL_MS` is 120s, and `visibilitychange` starts/stops the interval and refetches on return.
- **A pageview is one round trip, not four.** `db.transaction([...])` batches the visitor upsert, session upsert, and page-view insert. The Neon HTTP driver bills and delays *per request*, so the old fan-out cost 4x compute and stacked 4x latency. `readVisitorGeo()` exists so the geo headers can be inlined into that batch instead of paying for a second query.
- **Heartbeats back off**: 15s, 30s, 60s, 120s, then every 5 minutes — 15 beats an hour instead of 180. Periodic beats only bound data loss when `pagehide`/`visibilitychange` never fire (mobile Safari); the final value comes from that flush. A hidden tab schedules nothing, because it accrues no engaged time and every beat would be a guaranteed no-op write.
- **Heartbeats never touch `visitors`.** Rewriting `last_seen_at` every beat dirtied a row for nothing — the session's own `last_beat_at` records recency.
- **Visitor detail is cached for the page view.** [detailCache.ts](src/admin/lib/detailCache.ts) holds up to 20 payloads in memory (LRU), so reopening a row you already looked at costs no invocation and no Neon round trip — comparing two visitors used to refetch both on every switch. Staleness is decided by `detailStamp()`, built from the list row's `last_activity_at` (itself a `greatest()` over last seen / chat / contact / view / heartbeat) plus its counts: anything the detail renders moves the stamp, so a changed visitor invalidates their own entry within one poll and no freshness check ever hits the network. **The stamp is read once per open and then frozen** — the drawer has never refreshed itself while open, and refetching under the cursor would wipe unsaved Notes. Deliberately in memory only, never `sessionStorage`: transcripts and contact details shouldn't outlive the tab or survive a sign-out.
- **`/api/track` uses one rate-limit window, not the burst+hourly pair** the other endpoints use. Each limiter is its own Upstash round trip, and this is the busiest endpoint on the site.
- **`page_views` is the fastest-growing table** (one row per document load) and the admin list aggregates across all of it. `page_views_visitor_idx` keeps that from degrading into a seq scan. There is still **no automated pruning** — see the retention block in [db/schema.sql](db/schema.sql) and run it periodically.

## Fixtures & UI checking

There is **no local Postgres** in this project — `POSTGRES_URL` points at the shared Neon branch. Two tools exist so you can work on the admin UI at realistic density anyway:

| Command | What it does |
|---|---|
| `npm run seed:crm [count]` | Insert `count` (default 28) fake visitors with sessions, page views, chats, contacts, events. Idempotent — reseeding replaces rather than duplicating. |
| `npm run seed:crm:clean` | Remove every fixture row. |
| `npm run seed:crm:status` | Print real vs. fake row counts. Read-only — run it before and after to prove nothing real moved. |
| `npm run check:crm-ui -- <baseUrl> <outDir>` | Render the dashboard at 1440/1280/1024/768 against fixtures, screenshot each, and report page errors + horizontal-overflow offenders. **Stubs `/api/admin/*` in the browser, so it writes nothing and needs no admin password.** |

- **Fixture data is shared** between the seeder and the UI harness via [scripts/crm-fixtures.mjs](scripts/crm-fixtures.mjs), and is deterministic (seeded PRNG), so both show identical data and screenshots are diffable run to run.
- **Cleanup contract**: every fixture visitor id is `5eedNNNN-…`. `clean` deletes `where id::text like '5eed%'` *and* re-checks each id against the full fixture shape, so a real UUID that happens to start with `5eed` is refused rather than deleted.
- **Prefer the UI harness over seeding** when you only need to look at the UI — it never touches the database. Seed only when you need to click through the real app (saving notes, editing a location override, deleting a visitor).
- The fixture population is deliberately shaped like real traffic: ~38% single-view bounces, a slice with no geo/UA at all (mimicking pre-telemetry rows and GPC opt-outs), and only the most engaged tail having chats or contact submissions. If you make the UI look good only on rich rows, you have tested the wrong thing.

## Adding a new admin endpoint

1. Create `api/admin/<name>.ts` (or `api/admin/<group>/<name>.ts` for nesting; dynamic segments use `[id].ts`).
2. **First line of the handler** must be `if (!requireAdmin(req, res)) return` from [api/_lib/auth.ts](api/_lib/auth.ts) — sends 401 if the cookie is missing or invalid.
3. Validate the HTTP method explicitly. Don't trust callers.
4. Use `sql()` from [api/_lib/db.ts](api/_lib/db.ts); always parameterize via the tagged template, never interpolate user input into the SQL string.
5. Validate any path/query params (UUIDs, ids, etc.) before passing to the DB.
6. Cast Neon results when needed: `(await db\`...\`) as Record<string, unknown>[]` — the driver's return type is a union that TS cannot narrow on its own.

## Schema changes

- Edit [db/schema.sql](db/schema.sql) and apply the diff manually via the Neon SQL editor or `psql $POSTGRES_URL`. There is no migration runner.
- All `create table` / `create index` statements should use `if not exists` so the file remains re-runnable.
- For destructive changes (drop/rename), write a separate one-shot SQL snippet and don't commit it — keep `schema.sql` as the canonical end-state.

## Env vars

| Name | Where set | Purpose |
|---|---|---|
| `POSTGRES_URL` | Auto-populated by the Neon ↔ Vercel integration. **Verify it's not empty** in each environment via `npx vercel env pull` — the integration sometimes creates the names without values. | Connection string for the Neon HTTP driver. |
| `ADMIN_PASSWORD` | Set per-environment with `npx vercel env add ADMIN_PASSWORD <env>`. | The password typed into `/login`. **Absent → every sign-in is rejected.** |
| `ADMIN_SESSION_SECRET` | Set per-environment; 32+ random chars, e.g. `openssl rand -base64 48`. Rotating this invalidates all admin sessions immediately. | HMAC key for the admin session cookie *and* for the 2FA code hash. **Absent → sign-in 500s.** |
| `ADMIN_2FA_EMAIL` | **Optional.** `npx vercel env add ADMIN_2FA_EMAIL <env>`. | Where the 6-digit sign-in code is emailed. **Absent → no second factor: the correct password alone signs you in.** Same fallback if `RESEND_API_KEY` or the Upstash vars are absent, or if the Resend send fails at request time. |
| `RESEND_API_KEY` | Already required by `/api/contact`. | Also sends the 2FA code. **Absent → password-only sign-in** (and no contact email). |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Injected as `KV_REST_API_*` by the Vercel ↔ Upstash Marketplace integration; either prefix is accepted. | Rate limiting on every public endpoint, plus the 2FA challenge store. **Absent → limiter soft-fails open and sign-in is password-only.** |

`POSTGRES_URL`, `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` must exist in `development` for `vercel dev` to work, and in `production` for the live site. Add to `preview` if you want preview deploys to function. The rest degrade gracefully — see the fail-open note in the auth section.

## Verifying it works

Locally (with `npm run dev` running):
```bash
# Send a chat message via the UI, then:
curl -s http://localhost:3000/api/admin/visitors -i | head -1
# Expect: HTTP/1.1 401 (no cookie set)

# Route guard: signed out, /dashboard must bounce to /login (and vice versa).
curl -s http://localhost:3000/api/admin/session -i | head -1
# Expect: HTTP/1.1 401
```

Then visit http://localhost:3000/login, sign in (password, then the emailed code if `ADMIN_2FA_EMAIL` is set), and confirm you land on `/dashboard` with the visitor row showing the right chat-message count. Hitting `/login` again while signed in should redirect straight back to `/dashboard`.

In production: same flow at `https://<your-vercel-url>/login`.

If `/api/admin/visitors` returns 500, check `vercel dev` terminal output for the actual error. The most common one is `POSTGRES_URL is not set` — the integration didn't populate the value despite the name appearing in `npx vercel env ls`.

## Common edits

| Want to do | Where to go |
|---|---|
| Show a new column in the visitor table | Update the `select` in [api/admin/visitors.ts](api/admin/visitors.ts), then add the field to `VisitorSummary` in [src/admin/components/VisitorList.tsx](src/admin/components/VisitorList.tsx) and a `<td>` for it |
| Capture extra metadata about a chat message | Add a column to `chat_messages` in [db/schema.sql](db/schema.sql), apply the alter to Neon, then write the value in [api/chat.ts](api/chat.ts) |
| Capture another IP-derived field | Add a `readGeoHeader` call in [api/_lib/visitor.ts](api/_lib/visitor.ts) + the column, the `insert`, and the `on conflict` coalesce; then `Visitor`/`VisitorSummary` in [api/_lib/types.ts](api/_lib/types.ts) and both admin `select`s |
| Add another admin-editable visitor field | Extend the `PATCH` branch in [api/admin/visitors/[id].ts](api/admin/visitors/%5Bid%5D.ts) — it only updates keys actually present in the body, so a partial PATCH can't wipe a sibling field; then thread it through [useVisitorDetail.ts](src/admin/hooks/useVisitorDetail.ts) |
| Change the login throttle | `LOGIN_DELAY_MS` in [api/admin/login.ts](api/admin/login.ts) and `VERIFY_DELAY_MS` in [api/admin/verify.ts](api/admin/verify.ts) — keep them equal, or one step becomes the cheap one to hammer |
| Change the 2FA code lifetime or attempt cap | `CHALLENGE_TTL_SECONDS` / `MAX_CHALLENGE_ATTEMPTS` in [api/_lib/auth.ts](api/_lib/auth.ts) |
| Turn the second factor off | Unset `ADMIN_2FA_EMAIL`. Nothing else changes — `twoFactorConfigured()` reads it every request |
| Make the second factor mandatory (stop failing open) | Replace the `signIn()` fallback branches in [api/admin/login.ts](api/admin/login.ts) with a 503. Read the tradeoff note in [api/_lib/auth.ts](api/_lib/auth.ts) first |
| Restyle the sign-in page | [src/admin/components/Login.tsx](src/admin/components/Login.tsx) — then port the same change to `public/404.html` **and** `public/403.html`, which share its layout |
| Bump cookie lifetime | `MAX_AGE_SECONDS` in [api/_lib/auth.ts](api/_lib/auth.ts) |
| Force everyone to re-login | Rotate `ADMIN_SESSION_SECRET` in Vercel env (any environment). Note this also invalidates any in-flight 2FA challenge, since the code hash is keyed on it |
| Change the URL of the admin page | Rename `dashboard.html`, update `rollupOptions.input.dashboard` in [vite.config.ts](vite.config.ts) and both rewrites in [vercel.json](vercel.json); update `robots.txt` `Disallow` line |

## Things deliberately NOT built

- **No in-app reply.** The admin is read-only by design. There's no email collected at chat time, so there's nothing to reply to. If you ever want a reply path, it requires durable visitor identity + a polling/SSE channel back to the visitor's browser.
- **No pagination.** The visitor list query has `limit 500`. Add pagination when you actually have hundreds of visitors.
- **No retention/pruning job for `page_views`.** It's the fastest-growing table by far (one row per document load). When it gets unwieldy, add a scheduled delete for rows older than N months — nothing depends on old page views.
- **No section-impression or click tracking.** Deliberately scoped out: what someone scrolled past and what they clicked is a meaningfully bigger privacy footprint than "which pages, how long". `visitor_events` already has a `jsonb metadata` column if that changes — widen its `type` check constraint rather than adding tables.
- **No GDPR delete-my-data endpoint.** Trivial to add (`delete from visitors where id = $1` cascades to chat_messages and nulls contact_submissions.visitor_id) — write it when you actually need it.
- **No rate-limiting on `/api/chat` or `/api/contact`.** Existing honeypot field on both is the only protection. Add Vercel KV-backed throttling if abuse becomes a problem.
- **No audit log of admin reads.** Single user, low traffic — not worth the noise.

## Vercel-dev gotchas (specific to this feature)

- **Neon integration may set `POSTGRES_URL=""`** in one or more environments. Always verify with `npx vercel env pull --environment=<env> .env.tmp && grep '^POSTGRES_URL=' .env.tmp` before assuming it's wired. If empty, grab the connection string directly from the Neon dashboard and `npx vercel env add POSTGRES_URL <env>` interactively (don't pipe — piping has eaten the value before).
- **Don't pipe values into `vercel env add`.** It's flaky and silently stores empty strings. Always paste interactively when prompted.
- **`vercel dev` caches env vars at startup.** After changing any env var, fully kill and restart `npm run dev` (Ctrl-C the whole `concurrently` process; `lsof -i :3000` to confirm nothing is left).
- **Admin cookie requires `Secure`**, which works on `localhost` in modern browsers but will silently drop in older ones. If login appears to succeed but `/api/admin/session` still 401s, check the cookie was set in DevTools — and check *which name*: localhost gets `admin_session`, everywhere else gets `__Host-admin_session`.
- **`ADMIN_2FA_EMAIL` in `development` means you have to check your inbox on every local sign-in.** Leaving it unset locally (and set in production) is the sane default — the fail-open path signs you straight in.
