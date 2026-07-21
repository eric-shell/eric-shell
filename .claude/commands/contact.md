# Contact Section

Implemented across two files:
- [src/components/sections/Contact/Contact.tsx](src/components/sections/Contact/Contact.tsx) — section shell (full-bleed photo background, parallax, particles, copy column)
- [src/components/ui/ContactForm/ContactForm.tsx](src/components/ui/ContactForm/ContactForm.tsx) — the form itself, a standalone `components/ui` primitive (not Contact-specific — reusable anywhere)

Positioned last in the home section stack, between Visuals and Footer. Wrapped in its own `ErrorBoundary` in `App.tsx` with a `mailto:` fallback if the section itself throws.

## Layout

Two-column (`lg:grid-cols-2`, stacks on mobile) over a full-bleed photo background (`/contact/EJS01845-*`) with a parallax scrim, `Backdrop tone="photo"`, and the small/large particle layers reused from Hero.

- **Left column** — Eyebrow "Say What's up" + H2 "Get in Touch" + two lines of copy + a `mailto:ericjshell@gmail.com` fallback line
- **Right column** — `<ContactForm />`, a `Panel` (`variant="white"` or `"glass-light"`, toggle-able via an "ADA / WCAG" high-contrast switch in the corner)

## Form fields

| Field | Type | Validation (client `ContactForm.tsx` + server `api/contact.ts`, kept in sync) |
|---|---|---|
| Name | text | required, max 100 chars |
| Email | email | required, max 100 chars, regex validated |
| Message | textarea | required, min 10, max 2000 chars |
| Website | hidden (honeypot) | must stay empty — sr-only, `tabIndex={-1}`, `autoComplete="off"` |

`Input`/`Textarea` render a live `n/maxLength` character counter automatically whenever `maxLength` is passed. Validation failures set `errorField` (borders the offending field red) and fire a `toast.error(...)` — there is no separate error banner.

## Spam protection

A hidden honeypot field (`website`), not reCAPTCHA. `api/contact.ts` returns a fake `200 { ok: true }` immediately if it's non-empty, without sending an email — indistinguishable from success to a bot. Real submissions are also rate-limited via `checkRateLimit` (5 / 10 min, 30 / day per visitor).

## Submit flow

`ContactForm` posts JSON to `/api/contact` with `X-Visitor-Id` and `X-Referrer` headers. On success: fields clear, `toast.success(...)` fires, `onSuccess?.()` runs. On failure: `toast.error(...)` with the server's message (or a generic fallback on network/parse failure); the form stays populated and editable. There is no inline success/error card swap — feedback is toast-only.

## Backend — `api/contact.ts`

Re-validates everything server-side (never trust the client check alone), then:
1. Honeypot check → fake success if tripped.
2. Rate limit (soft-fails open if Upstash env vars are absent — see root CLAUDE.md).
3. Sends via **Resend** (`RESEND_API_KEY` env var) — `replyTo` is the visitor's email, body includes a best-effort city/country line from Vercel's `x-vercel-ip-*` headers.
4. Persists to `contact_submissions` (Neon/Postgres) **after** the email send succeeds — wrapped in its own try/catch so a DB outage never breaks the visible response. Persistence happens before `res.status(200)` returns, since Vercel can freeze the function the instant the response flushes.

## Styling

- `Button` submit: `variant="primary"`, `rightIcon={<Send />}`.
- Panel surface follows the theme toggle: `white` (light, high-contrast) or `glass-light` (frosted, matches the photo background) — see [/ui](ui.md) for what those variants mean.
- Both columns use `CascadeGroup` + `CascadeItem` (`threshold={0.15}` left / `threshold={0.1}` right) per the scroll-animation rules in root CLAUDE.md.

## Footer nav

`#contact` is one of the anchor links in `Footer.tsx`'s nav list.
