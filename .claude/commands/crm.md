# Admin CRM — Reference

A password-gated admin page at `/crm.html` for viewing every chat thread and contact form submission, keyed by an anonymous client-generated visitor UUID. Persistence runs alongside the existing chat stream and contact email — they are best-effort and never block the public response.

## File map

| Concern | File |
|---|---|
| Schema (apply once via Neon SQL editor) | [db/schema.sql](db/schema.sql) |
| Neon HTTP client (cached `sql()` helper) | [api/_lib/db.ts](api/_lib/db.ts) |
| Visitor upsert (validates `X-Visitor-Id` header) | [api/_lib/visitor.ts](api/_lib/visitor.ts) |
| Admin auth (HMAC cookie, password check, `requireAdmin`) | [api/_lib/auth.ts](api/_lib/auth.ts) |
| Admin endpoints | [api/admin/login.ts](api/admin/login.ts), [api/admin/logout.ts](api/admin/logout.ts), [api/admin/visitors.ts](api/admin/visitors.ts), [api/admin/visitors/[id].ts](api/admin/visitors/%5Bid%5D.ts) |
| Chat persistence wiring | [api/chat.ts](api/chat.ts) (after `res.end()`) |
| Contact persistence wiring | [api/contact.ts](api/contact.ts) (after Resend send) |
| Client visitor ID generator | [src/lib/visitorId.ts](src/lib/visitorId.ts) — `localStorage['eric.sh:vid']` |
| Visitor ID is sent on | [src/hooks/useChat.ts](src/hooks/useChat.ts), [src/components/ui/ContactForm/ContactForm.tsx](src/components/ui/ContactForm/ContactForm.tsx) — `X-Visitor-Id` header |
| Admin SPA entry | [crm.html](crm.html) → [src/admin/main.tsx](src/admin/main.tsx) → [src/admin/App.tsx](src/admin/App.tsx) |
| Admin SPA components | [src/admin/components/](src/admin/components/) — Login, Dashboard, VisitorList, VisitorDetail |
| Multi-page Vite config | [vite.config.ts](vite.config.ts) — `rollupOptions.input` includes both `main` and `admin` |
| Indexer hint | [public/robots.txt](public/robots.txt) — disallows `/crm` and `/api/admin/` |

## Architecture facts

- **Storage**: Neon Postgres (Vercel marketplace integration). Three tables: `visitors`, `chat_messages`, `contact_submissions`. Schema is checked into [db/schema.sql](db/schema.sql) and applied manually — no migration tool.
- **DB client**: `@neondatabase/serverless` over HTTP (not the WebSocket pool). The `sql()` helper in [api/_lib/db.ts](api/_lib/db.ts) caches one client per process.
- **Visitor identity**: client generates `crypto.randomUUID()` on first interaction, stores at `localStorage['eric.sh:vid']`, sends as `X-Visitor-Id` on every `/api/chat` and `/api/contact` POST. Server validates the format with a UUID regex before any DB write. **Trust model: anonymous, best-effort attribution.** Anyone with someone else's UUID could write to that visitor's thread; UUIDs are random so this is impractical to exploit but worth knowing.
- **Persistence is best-effort and order matters.** Both handlers wrap DB writes in try/catch so a Postgres outage can't break the public surface. **`contact.ts` persists BEFORE `res.json()`** — Vercel can freeze the function container as soon as a discrete response is flushed, silently dropping any trailing async work (we hit this on first deploy: chat persisted, contact didn't). **`chat.ts` persists AFTER `res.end()`** because the assistant reply isn't known until the stream completes; this works in practice (the streaming socket keeps the function alive long enough for the trailing DB write to land), but if it ever stops working, switch to `waitUntil()` from `@vercel/functions`.
- **Admin auth**: shared password (`ADMIN_PASSWORD` env) → HMAC-SHA256-signed timestamp cookie (`ADMIN_SESSION_SECRET` env, 30-day max-age, `HttpOnly` + `Secure` + `SameSite=Lax`). Verified with `timingSafeEqual`. Login endpoint sleeps a constant `LOGIN_DELAY_MS` (1500ms) on every attempt regardless of outcome — invisible to a human, lethal to brute-force. Single user only; no multi-account support.
- **Admin SPA is a separate Vite entry point** (`crm.html` at project root) so the admin bundle never ships with the public site (~7KB vs the main 60KB+). Login state is detected by probing `/api/admin/visitors` on mount; 401 → show login, 200 → show dashboard.
- **No analytics on the admin path** — admin is internal-only and shouldn't fire gtag events.

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
| `ADMIN_PASSWORD` | Set per-environment with `npx vercel env add ADMIN_PASSWORD <env>`. | The password typed into `/crm.html`. |
| `ADMIN_SESSION_SECRET` | Set per-environment; 32+ random chars, e.g. `openssl rand -base64 48`. Rotating this invalidates all admin sessions immediately. | HMAC key for the admin session cookie. |

All three must exist in `development` for `vercel dev` to work, and in `production` for the live site. Add to `preview` if you want preview deploys to function.

## Verifying it works

Locally (with `npm run dev` running):
```bash
# Send a chat message via the UI, then:
curl -s http://localhost:3000/api/admin/visitors -i | head -1
# Expect: HTTP/1.1 401 (no cookie set)
```

Then visit http://localhost:3000/crm.html, sign in, and confirm the visitor row shows up with the right chat-message count.

In production: same flow at `https://<your-vercel-url>/crm.html`.

If `/api/admin/visitors` returns 500, check `vercel dev` terminal output for the actual error. The most common one is `POSTGRES_URL is not set` — the integration didn't populate the value despite the name appearing in `npx vercel env ls`.

## Common edits

| Want to do | Where to go |
|---|---|
| Show a new column in the visitor table | Update the `select` in [api/admin/visitors.ts](api/admin/visitors.ts), then add the field to `VisitorSummary` in [src/admin/components/VisitorList.tsx](src/admin/components/VisitorList.tsx) and a `<td>` for it |
| Capture extra metadata about a chat message | Add a column to `chat_messages` in [db/schema.sql](db/schema.sql), apply the alter to Neon, then write the value in [api/chat.ts](api/chat.ts) |
| Change the login throttle | `LOGIN_DELAY_MS` constant in [api/admin/login.ts](api/admin/login.ts) |
| Bump cookie lifetime | `MAX_AGE_SECONDS` in [api/_lib/auth.ts](api/_lib/auth.ts) |
| Force everyone to re-login | Rotate `ADMIN_SESSION_SECRET` in Vercel env (any environment) |
| Change the URL of the admin page | Rename `crm.html` and update `rollupOptions.input.admin` in [vite.config.ts](vite.config.ts); update `robots.txt` `Disallow` line |

## Things deliberately NOT built

- **No in-app reply.** The admin is read-only by design. There's no email collected at chat time, so there's nothing to reply to. If you ever want a reply path, it requires durable visitor identity + a polling/SSE channel back to the visitor's browser.
- **No pagination.** The visitor list query has `limit 500`. Add pagination when you actually have hundreds of visitors.
- **No GDPR delete-my-data endpoint.** Trivial to add (`delete from visitors where id = $1` cascades to chat_messages and nulls contact_submissions.visitor_id) — write it when you actually need it.
- **No rate-limiting on `/api/chat` or `/api/contact`.** Existing honeypot field on both is the only protection. Add Vercel KV-backed throttling if abuse becomes a problem.
- **No audit log of admin reads.** Single user, low traffic — not worth the noise.

## Vercel-dev gotchas (specific to this feature)

- **Neon integration may set `POSTGRES_URL=""`** in one or more environments. Always verify with `npx vercel env pull --environment=<env> .env.tmp && grep '^POSTGRES_URL=' .env.tmp` before assuming it's wired. If empty, grab the connection string directly from the Neon dashboard and `npx vercel env add POSTGRES_URL <env>` interactively (don't pipe — piping has eaten the value before).
- **Don't pipe values into `vercel env add`.** It's flaky and silently stores empty strings. Always paste interactively when prompted.
- **`vercel dev` caches env vars at startup.** After changing any env var, fully kill and restart `npm run dev` (Ctrl-C the whole `concurrently` process; `lsof -i :3000` to confirm nothing is left).
- **Admin cookie requires `Secure`**, which works on `localhost` in modern browsers but will silently drop in older ones. If login appears to succeed but `/api/admin/visitors` still 401s, check the cookie was set in DevTools.
