---
paths:
  - "src/admin/**"
  - "api/**"
  - "db/**"
  - "dashboard.html"
  - "src/lib/telemetry.ts"
  - "src/lib/visitorId.ts"
  - "src/components/sections/Privacy/**"
  - "public/404.html"
  - "public/403.html"
  - "scripts/seed-crm.mjs"
  - "scripts/crm-ui-check.mjs"
  - "tests/visitor*"
  - "tests/chat*"
  - "tests/unsaved*"
  - "vercel.json"
  - ".env.example"
---
# Admin CRM, telemetry and the api/ functions

A password-gated admin page at `/dashboard` (sign-in at `/login`, both served from `dashboard.html`) records page views, session engagement, every chat thread, and every contact submission to Neon Postgres, keyed by an anonymous client-generated visitor UUID. Persistence is best-effort (wrapped in try/catch after the user-visible response) — DB outages can never break the public chat or contact form.

- Reference: run `/crm` for the full file map, schema, auth model, security caveats, and gotchas.
- **`/login` and `/dashboard` are one bundle, not two entries.** `vercel.json` rewrites both to `dashboard.html`; [src/admin/App.tsx](src/admin/App.tsx) routes on `window.location.pathname` and redirects between them after a cookie-only probe of `/api/admin/session`. Neither UI renders until the probe resolves *and* the route agrees, so there is no flash of the wrong screen.
- **Sign-in is two steps: password, then a 6-digit code emailed to `ADMIN_2FA_EMAIL`.** `POST /api/admin/login` sets no session — it stores an HMAC of the code in Upstash under a 5-minute TTL and returns an opaque `challengeId`; `POST /api/admin/verify` spends it (constant-time compare, 5 attempts, single use) and only then issues the cookie. Both sleep a constant 1500ms and both are rate-limited.
- **The second factor deliberately fails open.** Missing `ADMIN_2FA_EMAIL` / `RESEND_API_KEY` / Upstash vars, or a Resend send that throws, all fall back to password-only sign-in with a log line. A third-party outage must never lock the owner out of their own dashboard. Verification does *not* fail open. Don't "fix" this without reading the tradeoff note in [api/_lib/auth.ts](api/_lib/auth.ts).
- **The session cookie has two names on purpose**: `__Host-admin_session` everywhere deployed, plain `admin_session` on localhost where the prefix isn't dependable under `vercel dev`. Reads accept either. Max-age is 24 hours.
- **`/login`, `public/404.html` and `public/403.html` share one layout.** The two static pages hand-port the ink field, the Display headline and the `luminous` button because Vercel serves them with no React and no Tailwind build. Their `<style>` blocks are duplicated between the two files deliberately and **must be byte-identical**, with `--ink` / `--lum` / `--lum-deep` equal to the tokens; `tests/ui-vocabulary.test.ts` checks both. Restyle one, paste into the other, and match `/login`.
- **`X-Visitor-Id` is client-controlled and pseudonymous only** — any caller can send any UUID. Never use it for authorization or any trusted decision; gate sensitive endpoints with `requireAdmin` instead.
- **The session owns the identity.** Every visitor write resolves through the `visitor_sessions` row's `visitor_id` (`X-Session-Id`, sent alongside `X-Visitor-Id`), so a browser id that changes mid-visit can't fork one visit into two CRM rows. Persist against the id `upsertVisitor()` *returns*, never the header value. Run `/crm` before touching this.
- Schema lives in [db/schema.sql](db/schema.sql) (apply manually via Neon SQL editor).
- **Stored location is IP-derived and unreliable** — it can be hundreds of miles off. Render it via `resolveLocation()` ([src/admin/lib/location.ts](src/admin/lib/location.ts)), which prefers the human-entered `location_override` and flags anything IP-derived as approximate. Never concatenate `city`/`country` at a call site.
- **Telemetry honors Global Privacy Control / Do Not Track** — [src/lib/telemetry.ts](src/lib/telemetry.ts) sends nothing when either is set. Deliberate product decision; don't remove it.
- **Any new field the telemetry collects must be disclosed** in [Privacy.tsx](src/components/sections/Privacy/Privacy.tsx) in the same commit.
- Required env vars: `POSTGRES_URL` (auto-set by Neon ↔ Vercel integration; **always verify the value isn't empty** with `npx vercel env pull`), `ADMIN_PASSWORD` (absent → every sign-in is rejected), `ADMIN_SESSION_SECRET` (absent → sign-in 500s; it keys both the session cookie and the 2FA code hash), `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (the Upstash vars enable rate limiting on `/api/chat`, `/api/contact`, `/api/events`, and `/api/track` **and** store the 2FA challenge; if absent the limiter soft-fails open and sign-in falls back to password-only).
- Optional env var: `ADMIN_2FA_EMAIL` — where the sign-in code is emailed. Absent → no second factor, the correct password alone signs you in. Same fallback if `RESEND_API_KEY` (already required by `/api/contact`) is absent or the send fails.
- Adding admin endpoints: first line of every handler under `api/admin/` must be `if (!requireAdmin(req, res)) return`. **One deliberate exception:** the `DELETE` branch of `session.ts` (sign-out) runs before the guard, so a stale cookie can always be cleared — run `/crm` before touching it.
- The admin SPA is a separate Vite entry (`dashboard.html`); admin code never ships to public visitors.
- **The admin stands on `ink`**, the same dark field the public site's hero and footer use: a flat `bg-ink` root with `focus-on-field`, `Eyebrow`+`H2` headers, `raised-dark` panels and `luminous` CTAs. This is not "dark mode" — the public site stays light-first; the admin is a separate bundle. Never hand-roll its surfaces, and it is inside the vocabulary test's scope like everything else.
- **`--color-data` / `--color-data-deep` (index.css) are admin-only.** They exist because a muted brand ramp reads gray as a data mark. They are for **non-text marks only** (chart series, the tab underline, the live dot) — white ink on `data` is 2.36:1, so it must never back a label. The palette still cannot carry a multi-series categorical chart. Named `data` rather than "accent" so nobody reaches for it as a UI colour.
- **Telemetry is metered and tuned** — visible-only dashboard polling, one batched round trip per page view, backing-off heartbeats. Run `/crm` before changing any cadence; the cost table explains why each number is what it is.
- **`api/` is one function below the Hobby plan's 12-function cap.** Adding a file under `api/` fails the production deploy *after* a green build, with the reason visible only in the Vercel REST API. Free a slot first — run `/crm`.
- **`page_views` / `visitor_sessions` are pruned on a schedule** — [api/cron/prune.ts](api/cron/prune.ts), daily at 04:00 UTC via the `crons` block in `vercel.json`, 6-month window matching [db/schema.sql](db/schema.sql). Requires `CRON_SECRET`; **absent → it 503s and never runs**, deliberately, since the endpoint deletes data.
- **The contact notification email links to the visitor's CRM row**, which is why `contact.ts` resolves `upsertVisitor()` before the Resend send. Don't upsert twice, and keep the link's try/catch — a DB outage must cost the link, not the email.
- **Every close path for the visitor drawer is guarded against unsaved Notes.** The flag lives in [src/admin/lib/unsavedEdits.ts](src/admin/lib/unsavedEdits.ts) (module scope, set per drawer by `onDirtyChange`), because the close paths span three components: `handleSelect` / `goToPage` in VisitorList (X, Escape, another row, a page turn), `changeQuery` in VisitorsPanel (a search that stops matching the open row), `mayFilter` in Dashboard (timeframe and the two chips), `logout`, and a `beforeunload` listener for reload / tab close / the 401 redirect. A new way of removing the open row must call `confirmDiscard()` first.
- **The visitor list's page follows the open row** (`currentPage` in VisitorList, derived during render). The drawer is rendered inside its row, so a row that leaves the page takes the drawer and its unsaved text with it; a poll or a sort used to do exactly that. Only `resetKey` (search / timeframe / chips) sends the pager to page 1 — never the `visitors` prop, whose identity changes on every poll.


### Event types

- **Adding a `VisitorEventType` is a three-file change plus a manual migration.** `src/lib/telemetry.ts` (the union), `api/events.ts` (`VALID_TYPES`), and the `type` check constraint on `visitor_events` in [db/schema.sql](db/schema.sql) — and the constraint has to be widened by hand in the Neon SQL editor, because `create table if not exists` will not alter a table that already exists. Until that ALTER runs, `/api/events` accepts the event and the insert is swallowed by its best-effort catch: **the event silently vanishes.** The ALTER is kept ready to paste at the bottom of schema.sql.
