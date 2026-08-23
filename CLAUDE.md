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
│   │   ├── Notes/         # /notes index (Notes.tsx) + /notes/<slug> article (Note.tsx)
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
│       ├── MultiSelect/   # Multi-value listbox dropdown — set selection, optional filter field, drop-up placement
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
├── data/                  # Typed data files (work.ts, testimonials.ts, instagram.ts, navigation.ts, resume.ts, notes.ts, chat-context.ts)
├── hooks/                 # useChat, useCarousel, useIntersectionObserver, useParallax, useTitleCycle
├── lib/                   # Browser-side helpers (visitorId.ts, telemetry.ts, markdown.tsx)
├── App.tsx                # Root component — assembles sections, routes /resume and /privacy
├── main.tsx               # React entry point
└── index.css              # Global CSS + Tailwind import + custom utilities (animate-genie-out, etc.)

api/                       # Vercel serverless functions (auto-discovered)
├── _lib/                  # Shared helpers (auth, db, visitor, ratelimit, types) — leading underscore = not a route
├── admin/                 # Password-gated CRM endpoints — see /crm
├── cron/                  # Scheduled jobs (see vercel.json `crons`) — prune.ts retention pass
├── chat.ts                # Groq streaming + chat persistence (rate-limited)
├── contact.ts             # Resend email (with a CRM deep link) + contact persistence (rate-limited)
├── events.ts              # visitor interaction + error event log (rate-limited)
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
  - `as="span"` renders the button's appearance on a non-interactive `<span>`, for a button inside something already clickable (a whole-card `<a>`, where nesting a button or link is invalid HTML). It exists so those call sites can still use a variant instead of hand-rolling surface classes. Never for something clickable in its own right.
- `Panel` is a div-only wrapping surface (default `variant="secondary"`). For clickable cards, wrap `<Panel>` in an `<a>` — it is not polymorphic. `Card` (in `components/ui`) already packages this pattern for image/title/description/tag-pill cards — prefer it over hand-rolling a new one.
- `Dropdown` is light-theme by default; swap border/bg classes via `className` if needed in a dark section.
- `MultiSelect` is the multi-value form of `Dropdown` — same trigger, portal, and keyboard model, but selection is a set and choosing an option keeps the panel open. Used by the `Work` grid and the notes index for tag filtering. Its option list is **derived** from the data in both places, never hand-listed. Run `/ui` before changing its focus handling, drop-up placement, or scroll re-measurement — each of those fixes a specific bug and the reasons are recorded there.
- `Pill` is a tag/filter chip. Set `active` for filled state, `onClick` for interactive use (adds `aria-pressed`), `onDismiss` for a dismissible badge with X icon. Handles `e.preventDefault()` + `e.stopPropagation()` internally — safe inside card links.
- `CascadeGroup` wraps a group of elements and fires when it enters the viewport (`react-intersection-observer`, `triggerOnce: true`). Use `mountOnly` for above-the-fold content (Header, Hero) — animates on mount instead of scroll. Accepts `threshold` (default `0.1`) and `stagger` (default `75ms`). Use `as` to render as any HTML element (e.g. `as="ul"`).
- `CascadeItem` wraps a single item inside a `CascadeGroup`. Reads `inView` from context and fades up (`opacity-0 translate-y-[6px]` → visible) with a delay of `Math.min(index, 7) * stagger`. Use `as="li"` inside `<ul>` grids to preserve semantic HTML. The stagger index caps at 7 so long lists don't wait seconds.
- `Markdown` is the **only** place react-markdown may be imported as a value. It carries micromark + hast (~35KB gzipped) and used to sit in the shared `ui` chunk that every homepage visit downloads before first paint; splitting it took that chunk from 61KB gzipped to 28KB. A plain `import ReactMarkdown from 'react-markdown'` anywhere else puts it straight back. Render with `<Markdown components={…}>{rawText}</Markdown>` — it applies `linkifyEmail` itself, so callers must not pre-apply it. `prefetchMarkdown()` (in `lib/markdown.tsx`) warms the chunk on idle; `Chat` already calls it.
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
npm run shots     # capture note screenshots into assets-source/notes/ (needs a server; see /note)
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
- `/notes` renders the `Notes` index; `/notes/<slug>` renders a single `Note`

`Header` and `Footer` (from `components/layout/`) wrap every route.

- **Each public route is its own HTML entry** — `index.html`, `resume.html`, `privacy.html`, all three registered in `vite.config.ts` and all three loading the same `/src/main.tsx`. They exist purely so each route can serve its own `<title>`, description, canonical, OG/Twitter tags, and JSON-LD. **Don't collapse them back into a rewrite onto `index.html`**: that made `/resume` and `/privacy` canonicalize themselves to the homepage, telling Google not to index them while `sitemap.xml` asked it to, and made every social share of `/resume` render the homepage card.
- Head tags are therefore duplicated across the three files by hand, the same deliberate tradeoff as `public/404.html` / `public/403.html`. Change one, check all three. The Google Sans preload comment lives in `index.html`; the others point at it.
- `getRoute()` matches both `/resume` and `/resume.html` (same for privacy). The bare path is what `vercel.json` rewrites to and what visitors see; the `.html` path is served directly as a static file, and without the second case it would render the *home* sections under the resume's title and canonical.
- **A new public route means a new HTML entry, a `vite.config.ts` input, a `vercel.json` rewrite, a `getRoute()` case, and a `sitemap.xml` entry.** Missing any one of them fails silently in a different way. The `/notes` route is the exception that proves it — all five are generated, see below.
- **`useTitleCycle` runs on the homepage only, and holds the static `<title>` for 15s first.** It used to run everywhere and start at 500ms by blanking the title — which meant JS-rendering crawlers could snapshot a half-typed title, and `/resume` never showed a resume title at all. `PHRASES[0]` must stay byte-identical to `index.html`'s `<title>`; the cycle opens by *erasing* it, so a mismatch makes the first frame jump.

Home section order in `App.tsx`:
1. `Hero` — name, title, brief tagline, CTAs, Canvas 2D particle effects (`ParticlesSmall`/`ParticlesLarge`, no WebGL/Three.js) ✓
2. `Work` — filterable/sortable grid of work and projects ✓
3. `Testimonials` — two-column: context copy + auto-advancing carousel ✓
4. `Visuals` — 4-col layout: editorial copy + Instagram photo grid (static data in `src/data/instagram.ts`) ✓
5. `Contact` — contact form ✓

- **Every particle canvas runs through `visibleRafLoop`** ([src/components/sections/Hero/visibleRafLoop.ts](src/components/sections/Hero/visibleRafLoop.ts)) and paints only while it is on screen. The homepage mounts four of them (Hero and Contact each get a `ParticlesSmall` + `ParticlesLarge`), and the cost is fill rate, not particle count: a full-viewport `clearRect` plus additive `lighter` blending at up to 2x DPR, with Large's sprites drawn at ~half the viewport width. rAF stops itself in a background *tab*; nothing stops it for a canvas merely scrolled past. Verified at 0 draws when scrolled away.
- **Both sims are delta-timed.** `visibleRafLoop` hands `frame` a delta in 60fps units (1 at 60Hz, ~0.5 at 120Hz) and every per-frame increment in the tick functions is multiplied by it. They were fixed-step and therefore ran at literally double speed on a 120Hz display. Two guards make delta-time safe to pause, and removing either reintroduces a real bug: `MAX_DELTA` caps a step at 3 frames so a stalled tab or a slept machine can't teleport every particle, and `last` is re-baselined on every `start()` so the first frame after an off-screen pause is charged as one frame rather than the whole time spent scrolled away. Verified refresh-rate independent at 60/120/144Hz.
- **The work grid's `ItemList` JSON-LD is generated at build time** by the `workSchema()` plugin in `vite.config.ts`, from `src/data/work.ts`, into `index.html` only. Hand-copying 39 entries into the HTML would be stale within a release, and a stale ItemList is worse than none. It deliberately omits `image` (the cards hotlink Unsplash stock that has nothing to do with the projects — asserting that as a project's image tells a crawler something false) and uses `contributor` rather than `author` (client and agency work; Eric contributed front-end architecture, he did not author these properties). Add `image` back when the cards carry real screenshots.
- **Work card images are responsive off Unsplash's own CDN.** `WorkItem.image` holds a photo *id*, not a URL; `workImageSrc` / `workImageSrcSet` / `WORK_IMAGE_SIZES` in [work.ts](src/data/work.ts) derive the rest, and `Card` stays generic via `imageSrcSet` / `imageSizes` props. Before this every device downloaded a flat `w=800` into a 339px slot. 1x displays now transfer 68–76% less; **no device transfers more**, which is a property two things enforce and both are easy to break:
  - **`sizes` must be exact, `calc()` and all.** Plain `50vw` ignores Container's 48px padding and the 12px grid gaps — at 834px it claims 417px for a 387px card, and that 8% overestimate was enough to push tablets onto a bigger candidate and make them *worse* than before the srcSet existed. An inaccurate `sizes` doesn't degrade gracefully, it inverts the optimisation. Keep it in step with Work.tsx's `grid-cols-*` chain.
  - **`CARD_WIDTHS` is capped at 800.** A 3x phone wants 936px and will take a 1024 candidate — 51% more than the old flat `w=800`, on the most likely-metered device class. These are decorative thumbnails. Don't extend the ladder without re-measuring high-DPI mobile.
- **No `twitter:creator` / `twitter:site`** — there is no X/Twitter account in `navigation.ts` or the JSON-LD `sameAs`. Don't add one speculatively; the Twitter card works without it.
- Icons and `site.webmanifest` are generated from `public/favicon.svg` against `#111521` (blue-950, resolved from `oklch(0.198 0.025 269.84)` — the dark canvas every route opens on, which is also `theme-color`).
- **There is no Google Analytics, and no third-party analytics of any kind.** It was removed once measurement showed it cost 149KB, ~40ms of LCP and ~210ms of load, to collect a subset of what `lib/telemetry.ts` already records first-party and more precisely. The CSP was tightened to match — `connect-src` is now `'self'` alone. **Don't reintroduce a tag manager without re-widening the CSP**, and note the site now sets **no cookies at all** on the public routes, which [Privacy.tsx](src/components/sections/Privacy/Privacy.tsx) states plainly.
- `script-src` still needs `'unsafe-inline'` even with GA gone: the JSON-LD blocks are inline `<script>` elements and CSP applies `script-src` to them. Removing it silently kills every structured-data block on the site.
- **Adding a `VisitorEventType` is a three-file change plus a manual migration.** `src/lib/telemetry.ts` (the union), `api/events.ts` (`VALID_TYPES`), and the `type` check constraint on `visitor_events` in [db/schema.sql](db/schema.sql) — and the constraint has to be widened by hand in the Neon SQL editor, because `create table if not exists` will not alter a table that already exists. Until that ALTER runs, `/api/events` accepts the event and the insert is swallowed by its best-effort catch: **the event silently vanishes.** The ALTER is kept ready to paste at the bottom of schema.sql.
- **The logo easter-egg sound is constructed on first play, not on import.** It was a module-scope `new Audio()` pointing at a 750KB WAV — the largest asset on the page, downloaded on every route, for a joke that fires on clicking an already-active nav item. Now 16KB AAC, fetched on first trigger. Don't move the construction back to module scope.

## Notes (`/notes`)

A changelog of engineering decisions made on this site. Entries live in [src/data/notes.ts](src/data/notes.ts); `/notes` is the index, `/notes/<slug>` is a single entry.

- **A note is for an interesting or substantial change, not for every change.** Run `/note` before writing one. The bar is whether a stranger who works on the web would get something out of it: a measurement that contradicted an assumption, a wrong turn worth describing, a constraint that turned out to be arithmetic rather than taste, a fix whose obvious version made things worse. Routine work does not qualify, and a section padded with filler stops being worth reading. **Don't add an entry just because a task finished** — ask if it isn't clear.
- **Voice: personal, collected, technical where the detail earns it.** First person, past tense, specific numbers over adjectives, and name what went wrong before what fixed it. Beyond the em dash ban below, the things that make prose read as machine-written are worth avoiding too: tricolons in every sentence, "it's not just X, it's Y", restating the heading in the first line of the paragraph, and summarising at the end what was just said.
- **Most notes about something visual should carry a screenshot.** `npm run shots` drives Playwright from [scripts/notes-shots.config.mjs](scripts/notes-shots.config.mjs) into `assets-source/notes/`, and `npm run images` globs that directory to emit the variants into `public/note-shots/`. Reference one from a body as `![Alt](/note-shots/<name> "Caption.")` — a base path with no width and no extension; `noteMdComponents` derives the `<picture>`, the srcSets and the `<figcaption>`. **Alt and caption do different jobs and must not be the same sentence**: alt is what the image shows for someone who cannot see it, the caption is what it means. If a shot is of fixture data rather than real traffic, the caption has to say so.
- **Adding an entry to `notes.ts` is the entire workflow.** Everything the five-item route checklist above demands is derived from that array by `notesEntries()` in `vite.config.ts`: the HTML document, the Vite input, and the `sitemap.xml` line. The `vercel.json` rewrite (`/notes/:slug`) and the `getRoute()` case are written once and cover every slug. **Don't hand-write a document under `notes/`** — it is gitignored and will be overwritten.
- **`notes/*.html` and `public/sitemap.xml` are generated and gitignored.** They are derived from `notes.ts`; a committed copy is a second source of truth waiting to disagree with the first. `sitemap.xml` therefore no longer exists in the repo — it is written at config-evaluation time, which is why both `vite dev` and `vite build` see it. Static routes carry a hand-declared `lastmod` in `STATIC_ROUTES`; `/notes` derives its own from the newest entry.
- **Generation runs while the config is evaluated, not in a plugin hook** — `rollupOptions.input` resolves real paths from disk before any hook fires. `writeIfChanged` exists because rewriting identical bytes on every dev restart bumps mtimes and produces a full-reload loop.
- **A slug is a live URL.** Renaming one breaks every link and the sitemap entry that pointed at it. Add a new entry rather than rewriting an old slug.
- **Append new entries to `entries`; don't hand-slot them by date.** `notes` is `entries` sorted date-descending, and `Array.prototype.sort` is stable, so order *within* a shared date stays hand-controlled while order *across* dates is derived. Everything reads from `notes`: the index, both sort directions, the prev/next pager, the sitemap, and the Blog JSON-LD. This exists because an entry dated `2026-08-01` was once appended after two July entries, and with nothing sorting, "Newest first" put it below a July 19 post while the pager offered it a "Newer" link pointing backwards in time.
- **Every entry must be checkable.** `commit` links a real SHA in the public repo, and the numbers in a body are measurements, not estimates — that verifiability is the whole reason the section exists. An entry that can't be checked doesn't belong.
- **No em dashes in note content.** Not in `title`, `summary`, or `body`, and not in the meta description a summary becomes. Heavy em-dash use is one of the most recognisable tells of machine-written prose, and a section whose entire value rests on the entries being genuinely Eric's cannot afford to read as generated. Use a comma, a colon, parentheses, or two sentences. The rule covers reader-facing copy on the notes route (including `notes.html`'s meta tags and the strings `noteDocument()` bakes into every generated document); code comments are not content and are exempt. The full house style lives at the top of [src/data/notes.ts](src/data/notes.ts) — anything writing a new entry should read it first.
- The index's `Blog` JSON-LD is injected into `notes.html` by the `notesSchema()` plugin, same reasoning as `workSchema()`. Each entry document carries its own `BlogPosting` + `BreadcrumbList`, generated in `noteDocument()`.
- Bodies render through `noteMdComponents` ([src/lib/markdown.tsx](src/lib/markdown.tsx)) — the site's only long-form markdown, and the only place headings, code blocks, and blockquotes come out of markdown. `Note.tsx` calls `prefetchMarkdown()` at **module scope**, not in an effect: the body *is* the page, and `<Markdown>`'s fallback is a single raw-text paragraph.
- The tag filter on the index is client-side and deliberately does not touch the URL — a filtered view has no distinct title or content, and giving it a crawlable address puts near-duplicate URLs in front of a crawler that already has the canonical list. Because of that, `page_views` cannot tell a narrowed list from a whole one: the settled selection is recorded instead as a `filter_apply` event via `useFilterTelemetry`, shared with the Work grid. Run `/crm` before changing its debounce or what it sends.
- `Notes/index.ts` exports **only** the index page. `App.tsx` imports `Notes/Note` past the barrel so the list and the article stay in separate chunks.

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

## Images

`npm run images` regenerates every variant from `assets-source/` per `scripts/responsive-images.config.mjs`.

- **A manifest entry may override quality** via an optional `quality: { avif, webp, jpg, png }` merged over the defaults (`{ avif: 55, webp: 78, jpg: 80, png: 90 }`). Only override where the image's job doesn't need the default fidelity — currently just the Contact background, which is `aria-hidden` under a 75%-black gradient and a grain layer.
- **`quality` on PNG is what enables palette quantisation at all.** Without it sharp encodes fully lossless and ignores the number: that is how `subject-1024.png` came to be 2.5MB for a file that only exists as the `<picture>` fallback behind AVIF and WebP. It is 438KB now, at 42.6dB PSNR over the opaque pixels.
- **A requested width above the source's is skipped with a warning, not clamped** (2% tolerance, so `subject.png`'s 1023-vs-1024 still emits). Clamping produced files whose *name* overstated their width — and the name is what the srcSet advertises, so browsers picked a 2048px `EJS01845-2560` believing it had 2560px. Dropping a width means editing the `srcSet` at the call site too.
- Run `npm run lqip` after adding Instagram posts.

## Deployment

Static site + serverless functions on Vercel. `npm run build` produces `dist/` (with `index.html`, `resume.html`, `privacy.html`, and `dashboard.html` entries) plus the `api/` functions. Final target: **eric.sh**.

- **`public/` assets are cached by explicit `headers` rules in `vercel.json`** — Vercel's default for them is `max-age=0, must-revalidate`, so every repeat visit was revalidating ~8MB of photography. `/fonts/*` is a year + `immutable`; `/hero`, `/posts`, `/contact` get 30 days + `stale-while-revalidate` rather than `immutable`, because those filenames are stable across regeneration and `immutable` would pin a stale image until the name changed. Hashed `/assets/*` is handled by Vercel already.

## Claude Commands

| Command | What it does |
|---|---|
| `/scaffold` | Scaffold a new page section or reusable UI component |
| `/ui` | Reference for the shared UI primitives + `variants.ts` system (Button / Panel / Pill) |
| `/contact` | Placeholder — Contact section implementation notes |
| `/chat` | Reference for the Hero chat: file map, prompt structure, streaming protocol, persistence, vercel-dev gotchas |
| `/crm` | Reference for the admin CRM: schema, auth model, file map, adding endpoints, env-var gotchas |
| `/note` | When a change earns a `/notes` entry, the house voice, and the screenshot pipeline |
