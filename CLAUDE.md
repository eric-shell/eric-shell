# eric.sh — Personal Portfolio

Personal portfolio website for Eric Shell. Successor to https://eric.sh/, which is where this project will eventually be hosted.

## Tech Stack

| Layer | Tool |
|---|---|
| Build | Vite |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Package manager | npm |

Key config files:
- `vite.config.ts` — Vite + Tailwind Vite plugin
- `tsconfig.app.json` — main TypeScript config
- `src/index.css` — global styles (`@import "tailwindcss"`)

## Project Structure

```
src/
├── components/
│   ├── layout/            # Site chrome shared across routes
│   │   ├── Header/        # Fixed nav bar with cascade entrance + icon echo animation
│   │   ├── Footer/        # Social links, nav, copyright, privacy link
│   │   └── index.ts
│   ├── sections/          # Full-width page sections — each in its own directory with index.ts barrel
│   │   ├── Hero/          # Above-the-fold: name, title, tagline, CTAs, particle effects
│   │   ├── Work/          # Filterable/sortable grid of work and projects
│   │   ├── Testimonials/  # Two-column: context copy + auto-advancing carousel
│   │   ├── Visuals/       # Editorial copy + Instagram photo grid
│   │   ├── Contact/       # Contact form
│   │   ├── Resume/        # /resume route — full resume page
│   │   ├── Privacy/       # /privacy route — data-handling disclosure
│   │   └── index.ts       # Barrel export for all sections
│   └── ui/                # Reusable primitives — import from 'components/ui'
│       ├── Backdrop/      # Ambient section background — drifting hue-shifting gradient blobs + film grain (tone: light|dark|photo)
│       ├── Button/        # Polymorphic button/anchor — consumes variants.ts; size (sm|md|lg), shape (pill|square)
│       ├── Card/          # <a> + Panel(white) + Pill composition for project/work-grid cards
│       ├── Cascade/       # CascadeGroup + CascadeItem + CascadeContext (scroll/mount entrance animation)
│       ├── Chat/          # Genie-style panel with glass overlay, textarea, submit
│       ├── Colors/        # Storybook-only palette reference (not exported from the barrel)
│       ├── Container/     # 1440px max-width + horizontal padding wrapper
│       ├── ContactForm/   # Name/email/message form w/ validation + toast feedback — used by Contact section
│       ├── Dropdown/      # Accessible select w/ full keyboard nav (arrows, Home/End, Enter)
│       ├── ErrorBoundary/ # Per-section error boundary — name prop labels logs/analytics, optional fallback
│       ├── Eyebrow/       # Small uppercase label above headings (font-sans, GRAD 150)
│       ├── Heading/       # H1, H2, H3 display headings
│       ├── Input/         # Text input primitive
│       ├── Panel/         # Div-only wrapping surface — consumes variants.ts
│       ├── Pill/          # Tag/filter chip — active state, optional dismiss X
│       ├── Post/          # Instagram-grid tile — responsive <picture> + LQIP blur-up
│       ├── SectionHeader/ # Eyebrow + H2 pair, optional action button slot
│       ├── Textarea/      # Multiline text input primitive
│       ├── Toast/         # Imperative toast queue — toast.success/error/info() + <Toaster/>
│       ├── variants.ts    # Shared SURFACE + SURFACE_HOVER maps (single source of truth)
│       └── index.ts       # Barrel export for all ui components
├── admin/                 # Admin CRM SPA (separate Vite entry; see /crm)
│   ├── components/        # Dashboard, Login, VisitorList, VisitorDetail (orchestrator), VisitorMetaGrid, ConversationTimeline, ActivityTimeline, VisitorsChart, ContactSubmissionList, TabBar, Skeleton
│   ├── hooks/             # useVisitorDetail (fetch + notes/location save + delete + dirty flag)
│   └── lib/               # api.ts (apiCall helper), dateFormat.ts, location.ts (resolveLocation), lastVisit.ts, userAgent.ts
├── data/                  # Typed data files (work.ts, testimonials.ts, instagram.ts, navigation.ts, resume.ts, chat-context.ts)
├── hooks/                 # useChat, useCarousel, useIntersectionObserver, useParallax, useTitleCycle
├── lib/                   # Browser-side helpers (visitorId.ts, telemetry.ts, markdown.tsx)
├── utils/                 # Utilities (analytics.ts, htmlToCanvas.ts)
├── assets/                # Images, fonts, static files
├── App.tsx                # Root component — assembles sections, routes /resume and /privacy
├── main.tsx               # React entry point
└── index.css              # Global CSS + Tailwind import + custom utilities (animate-genie-out, etc.)

api/                       # Vercel serverless functions (auto-discovered)
├── _lib/                  # Shared helpers (auth, db, visitor, ratelimit, types) — leading underscore = not a route
├── admin/                 # Password-gated CRM endpoints — see /crm
├── cron/                  # Scheduled jobs (see vercel.json `crons`) — prune.ts retention pass
├── chat.ts                # Groq streaming + chat persistence (rate-limited)
├── contact.ts             # Resend email (with a CRM deep link) + contact persistence (rate-limited)
├── events.ts              # ada_toggle / chat_cleared event log (rate-limited)
└── track.ts               # page views + session engagement beacon (rate-limited)

db/schema.sql              # Postgres schema (Neon) — apply manually, see /crm
```

Path alias: `@/*` → `src/*` is configured in `vite.config.ts` and `tsconfig.app.json`. Use `@/data`, `@/hooks`, `@/lib/...` rather than long `../../../` chains.

### UI Component conventions

- All components spread `...props` onto the root element and accept `className` for overrides.
- Headings default to `color: inherit` — set text color on the parent or via `className`.
- `Eyebrow` applies `fontVariationSettings: "'GRAD' 150"` for the optical weight effect used across the site.
- **Variant system**: `Button`, `Panel`, and `Pill` all consume `SURFACE` / `SURFACE_HOVER` maps from [src/components/ui/variants.ts](src/components/ui/variants.ts). Variants: `primary | secondary | ghost | glass-light | glass-dark | error-glass | success-glass | white`. Run `/ui` for the full reference, rules, and examples. Never hand-roll surface color classes (`bg-blue-950 text-white`, `glass-blur bg-white/10 border-white/20`, etc.) at call sites — use the variant, or add one if needed.
- `Button` defaults to `variant="secondary"`. Pass `href` to render as `<a>`. Two additional axes:
  - `size` (`sm` | `md` | `lg`, default `md`) — controls text scale and padding.
  - `shape` (`pill` | `square`, default `pill`) — `pill` for text buttons; `square` for icon-only buttons.
- `Panel` is a div-only wrapping surface (default `variant="secondary"`). For clickable cards, wrap `<Panel>` in an `<a>` — it is not polymorphic. `Card` (in `components/ui`) already packages this pattern for image/title/description/tag-pill cards — prefer it over hand-rolling a new one.
- `Dropdown` is light-theme by default; swap border/bg classes via `className` if needed in a dark section.
- `Pill` is a tag/filter chip. Set `active` for filled state, `onClick` for interactive use (adds `aria-pressed`), `onDismiss` for a dismissible badge with X icon. Handles `e.preventDefault()` + `e.stopPropagation()` internally — safe inside card links.
- `CascadeGroup` wraps a group of elements and fires when it enters the viewport (`react-intersection-observer`, `triggerOnce: true`). Use `mountOnly` for above-the-fold content (Header, Hero) — animates on mount instead of scroll. Accepts `threshold` (default `0.1`) and `stagger` (default `75ms`). Use `as` to render as any HTML element (e.g. `as="ul"`).
- `CascadeItem` wraps a single item inside a `CascadeGroup`. Reads `inView` from context and fades up (`opacity-0 translate-y-[6px]` → visible) with a delay of `Math.min(index, 7) * stagger`. Use `as="li"` inside `<ul>` grids to preserve semantic HTML. The stagger index caps at 7 so long lists don't wait seconds.
- Import from the barrel: `import { Button, H2, Eyebrow, Pill, CascadeGroup, CascadeItem } from '../ui'`

### CSS Utilities

- `.glass-blur` — defined in `src/index.css`. Applies `backdrop-filter: blur(12px)`. Under `prefers-reduced-motion`, the animation is suppressed and blur is applied statically. Used by the `glass-light` / `glass-dark` variants and the Hero glass panel. Not a Tailwind utility — cannot be overridden with `backdrop-blur-*` classes.
- `.animate-ambient-a/b/c` + `.animate-ambient-hue` — slow transform-only blob drift (26/34/42s) and a 48s hue-rotate sweep, consumed by the `Backdrop` ui component. Frozen (static, still visible) under `prefers-reduced-motion`.
- `.bg-noise` / `.noise-overlay` — SVG `feTurbulence` film grain from the shared `--noise-img` data-URI. `bg-noise` tiles it as a background (caller supplies opacity + blend mode); `noise-overlay` renders it as an `::after` film over an already-positioned panel (used by `Card` and the Chat glass panel).
- `.icon-optical` — optical icon sizing for `Button`. The caller sets `--icon-size`, which fixes every icon's layout box; light geometric glyphs (lucide `arrow*`/`chevron*`/`corner*`/`move*`/`plus*`/`minus*`/`check*`/`x*`, matched on the `lucide-<name>` class lucide stamps on every svg) then get `scale: 1.25` so they don't read undersized next to dense pictograms. The bump is paint-only — it never changes a button's height or width, so icon-only buttons in a row stay identical. CSS beats lucide's `size`/`className` on the icon, so `size={14}` or `h-4 w-4` at a call site inside a Button has no effect.
- `.animate-ambient-parallax` — scroll-linked blob drift via `animation-timeline: view()` inside an `@supports` guard; no-op (falls back to time-based drift only) where unsupported.
- `.grad-hover` — optical-weight hover shift on the Google Sans `GRAD` axis (used on footer/contact links). Route changes cross-fade via `@view-transition` (MPA cross-document); the fixed header carries `view-transition-name: site-header` — keep that name unique. Display headings inside a `CascadeItem` settle from `wght` 860→700 as they enter; all of this is disabled under `prefers-reduced-motion` and print.

### Scroll animation requirements

**Every section must use `CascadeGroup` + `CascadeItem`.** This is not optional — it is the standard entrance animation for all page sections.

Pattern:
1. Wrap each distinct visual block (heading row, body copy, card grid, controls) in its own `CascadeGroup`.
2. Each block inside a group gets a `CascadeItem` with an ascending `index` (0, 1, 2…).
3. Card/item grids: use `CascadeGroup as="ul"` on the grid container and `CascadeItem as="li" index={i}` per card.
4. Above-the-fold (Header, Hero): use `CascadeGroup mountOnly` instead of scroll trigger.
5. Threshold guidance: `0.15` for headers, `0.1` for body copy, `0.05` for dense grids.

## Development

```bash
npm run dev       # vercel dev + storybook in parallel; site at http://localhost:3000, storybook at :6006
npm run dev:site  # vercel dev only (site at http://localhost:3000) — runs Vite under the hood and serves /api/* serverless functions
npm run build     # production build → dist/
npm run preview   # preview production build locally
npm run lint      # ESLint
npm run lqip      # regenerate src/data/lqip.ts blur-up placeholders (run after `npm run images` adds Instagram posts)
npm run seed:crm  # seed fake CRM visitors/sessions/page views (see /crm); :clean removes, :status counts
npm run check:crm-ui -- http://localhost:3000 ./out   # screenshot the CRM at 4 widths, report overflow (no DB writes)
```

Env vars for `vercel dev` come from the linked Vercel project (cloud), not `.env.local`. Use `npx vercel env add NAME [development|preview|production]` to add new keys per-environment.

## Design Principles

Inherited from the existing site and maintained going forward:

- **Content-first** — the work speaks; don't let chrome compete with it
- **Professional restraint** — no gratuitous animations or decorative noise
- **Scannable** — tech tags on project cards, clear section hierarchy
- **Fixed palette, no theme switching** — the site is intentionally light-first with deliberate dark sections (Testimonials, Footer, photo sections); there is no dark mode and no `dark:` variants. Decision made 2026-07 — don't reintroduce.
- **Responsive** — mobile-first, 4xl max container width

## Routes & Sections

Routing is handled by `App.tsx` reading `window.location.pathname`:
- `/` (home) renders the section stack below
- `/resume` renders the full `Resume` page
- `/privacy` renders the `Privacy` data-handling page

`Header` and `Footer` (from `components/layout/`) wrap every route.

Home section order in `App.tsx`:
1. `Hero` — name, title, brief tagline, CTAs, Canvas 2D particle effects (`ParticlesSmall`/`ParticlesLarge`, no WebGL/Three.js) ✓
2. `Work` — filterable/sortable grid of work and projects ✓
3. `Testimonials` — two-column: context copy + auto-advancing carousel ✓
4. `Visuals` — 4-col layout: editorial copy + Instagram photo grid (static data in `src/data/instagram.ts`) ✓
5. `Contact` — contact form ✓

## Admin CRM

A password-gated admin page at `/dashboard` (sign-in at `/login`, both served from `dashboard.html`) records page views, session engagement, every chat thread, and every contact submission to Neon Postgres, keyed by an anonymous client-generated visitor UUID. Persistence is best-effort (wrapped in try/catch after the user-visible response) — DB outages can never break the public chat or contact form.

- Reference: run `/crm` for the full file map, schema, auth model, security caveats, and gotchas.
- **`/login` and `/dashboard` are one bundle, not two entries.** `vercel.json` rewrites both to `dashboard.html`; [src/admin/App.tsx](src/admin/App.tsx) routes on `window.location.pathname` and redirects between them after a cookie-only probe of `/api/admin/session`. Neither UI renders until the probe resolves *and* the route agrees, so there is no flash of the wrong screen.
- **Sign-in is two steps: password, then a 6-digit code emailed to `ADMIN_2FA_EMAIL`.** `POST /api/admin/login` sets no session — it stores an HMAC of the code in Upstash under a 5-minute TTL and returns an opaque `challengeId`; `POST /api/admin/verify` spends it (constant-time compare, 5 attempts, single use) and only then issues the cookie. Both sleep a constant 1500ms and both are rate-limited.
- **The second factor deliberately fails open.** Missing `ADMIN_2FA_EMAIL` / `RESEND_API_KEY` / Upstash vars, or a Resend send that throws, all fall back to password-only sign-in with a log line. A third-party outage must never lock the owner out of their own dashboard. Verification does *not* fail open. Don't "fix" this without reading the tradeoff note in [api/_lib/auth.ts](api/_lib/auth.ts).
- **The session cookie has two names on purpose**: `__Host-admin_session` everywhere deployed, plain `admin_session` on localhost where the prefix isn't dependable under `vercel dev`. Reads accept either. Max-age is 24 hours.
- **`/login`, `public/404.html` and `public/403.html` share one layout.** The two static pages hand-port the dark vocabulary (Backdrop blobs, grain, Display headline, `primary` button) because Vercel serves them with no React and no Tailwind build; their CSS is duplicated between the two files deliberately. Restyle one, restyle all three.
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
- **The admin is dark**, using the site's dark-section vocabulary (`Backdrop tone="dark"` over `bg-blue-950`, `Eyebrow`+`H2`). This is not "dark mode" — the public site stays light-first; the admin is a separate bundle. Panel surfaces use the `raised-dark` variant and CTAs use `primary`; never hand-roll them.
- **`--color-accent` (index.css) is admin-only.** Every step of the blue ramp is below the dataviz chroma floor and reads gray as a data mark, which is why charts from the ramp looked washed out. It is for **non-text marks only** (chart, focus rings, tab underline) — white ink on it is 2.36:1, so it must never back a label. The palette still cannot carry a multi-series categorical chart.
- **Telemetry is metered and tuned** — visible-only dashboard polling, one batched round trip per page view, backing-off heartbeats. Run `/crm` before changing any cadence; the cost table explains why each number is what it is.
- **`api/` is one function below the Hobby plan's 12-function cap.** Adding a file under `api/` fails the production deploy *after* a green build, with the reason visible only in the Vercel REST API. Free a slot first — run `/crm`.
- **`page_views` / `visitor_sessions` are pruned on a schedule** — [api/cron/prune.ts](api/cron/prune.ts), daily at 04:00 UTC via the `crons` block in `vercel.json`, 6-month window matching [db/schema.sql](db/schema.sql). Requires `CRON_SECRET`; **absent → it 503s and never runs**, deliberately, since the endpoint deletes data.
- **The contact notification email links to the visitor's CRM row**, which is why `contact.ts` resolves `upsertVisitor()` before the Resend send. Don't upsert twice, and keep the link's try/catch — a DB outage must cost the link, not the email.
- **Every close path for the visitor drawer is guarded against unsaved Notes** (`handleSelect` in VisitorList, fed by `onDirtyChange`). Escape closes it and inherits the same guard. New close paths must route through `handleSelect`.

## Deployment

Static site + serverless functions on Vercel. `npm run build` produces `dist/` (with both `index.html` and `dashboard.html` entries) plus the `api/` functions. Final target: **eric.sh**.

## Claude Commands

| Command | What it does |
|---|---|
| `/scaffold` | Scaffold a new page section or reusable UI component |
| `/ui` | Reference for the shared UI primitives + `variants.ts` system (Button / Panel / Pill) |
| `/contact` | Placeholder — Contact section implementation notes |
| `/chat` | Reference for the Hero chat: file map, prompt structure, streaming protocol, persistence, vercel-dev gotchas |
| `/crm` | Reference for the admin CRM: schema, auth model, file map, adding endpoints, env-var gotchas |
