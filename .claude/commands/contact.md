# Contact Section

Implemented across two files:
- [src/components/sections/Contact/Contact.tsx](src/components/sections/Contact/Contact.tsx) — section shell (a `lum` field, the copy column and the form)
- [src/components/ui/ContactForm/ContactForm.tsx](src/components/ui/ContactForm/ContactForm.tsx) — the form itself, a standalone `components/ui` primitive (not Contact-specific — reusable anywhere)

Positioned last in the home section stack, between Visuals and Footer. Wrapped in its own `ErrorBoundary` in `App.tsx` with a `mailto:` fallback (`ContactFallback`, also a `lum` Section) if the section itself throws.

## Layout

Two-column (`lg:grid-cols-2`, stacks on mobile) on `<Section tone="lum">`: a solid Luminous Blue field. The photo background, particles and frosted form it once had are gone; the hero is the page's one photographic moment.

- **Left column** — a `SectionTitle` (eyebrow "Say What's up", heading "Get in Touch") with three description paragraphs, the last holding a `TextLink tone="field"` mailto fallback
- **Right column** — `<ContactForm />`, a white card (`Panel variant="outline"`) with `shadow-float`. It has no theme: the old "ADA / WCAG" switch went with the glass it toggled away from

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

- `Button` submit: `variant="luminous"`, `rightIcon={<Send />}`.
- The card carries `focus-on-paper`, so focus rings inside it are blue even though the section around it is a blue field (where rings are white). See [/ui](ui.md).
- Fields are `Input` / `Textarea` at their default `tone="white"`.
- The left column enters through `SectionTitle`; the form is its own `CascadeGroup threshold={0.15}` on the description's beat, per the scroll-animation rules in root CLAUDE.md.

## Footer nav

`#contact` is one of the anchor links in `Footer.tsx`'s nav list.
