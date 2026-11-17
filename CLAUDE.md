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
│   │   ├── Header/        # Floating capsule (logo + menu button naming the current section) + left sidebar with every footer link; icon echo easter egg
│   │   ├── Footer/        # Social links, nav, copyright, privacy link
│   │   ├── DisplayLink.tsx # Display-caps nav link with the hover arrow, shared by the menu and the footer
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
│   └── ui/                # The UI system — import from 'components/ui'. Run /ui before touching it
│       ├── Button/        # Polymorphic button/anchor; required `variant`; size (sm|md|lg), shape (pill|square)
│       ├── Card/          # The white card (Work grid, notes index, note pager): one stretched link, tag pills, hover lift
│       ├── Cascade/       # CascadeGroup + CascadeItem + CascadeContext (scroll/mount entrance animation)
│       ├── Chat/          # Genie-style panel (white card), textarea, submit
│       ├── Code/          # Inline code chip
│       ├── Container/     # 1440px max-width + horizontal padding wrapper
│       ├── ContactForm/   # Name/email/message form w/ validation + toast feedback — used by Contact section
│       ├── Dropdown/      # Accessible select w/ full keyboard nav (arrows, Home/End, Enter)
│       ├── ErrorBoundary/ # Per-section error boundary — name prop labels logs/analytics, optional fallback
│       ├── Eyebrow/       # The kicker above a section heading (font-sans, GRAD 150); used through SectionTitle
│       ├── Field/         # field.ts — the styles Input and Textarea share (tone: white|dark). Not in the barrel
│       ├── FilterBar/     # Sort + tag filter + announced count + Reset, for a filterable grid; pairs with useTagFilter
│       ├── Heading/       # H1, H2, H3 display headings
│       ├── Input/         # Text input primitive
│       ├── Label/         # Small uppercase label (dates, stat captions, nav group heads); as span|p|dt|time
│       ├── Lead/          # The paragraph after a heading; size md|lg
│       ├── Markdown/      # The only react-markdown renderer, its own chunk
│       ├── MultiSelect/   # Multi-value listbox dropdown — set selection, optional filter field, drop-up placement
│       ├── PageHero/      # Inner-route masthead: a lum Section with a Container
│       ├── Panel/         # Div with a variant's surface; required `variant`
│       ├── Pill/          # Tag/filter chip — active state, optional dismiss X
│       ├── RiseText/      # Display heading whose letters rise in order; kerned from src/lib/displayKerning.ts
│       ├── Section/       # Every <section> and <main>: Section (tone lum|ink|white|inherit, rhythm) and Page
│       ├── SectionTitle/  # Every section header: eyebrow + RiseText heading + description, one entrance rhythm (descDelay); as h1|h2, size poster|compact, sticky
│       ├── Sheet/         # A rounded sheet rising over the field above: white under a PageHero, lum + widen for Work
│       ├── SocialLink/    # Round outlined profile link; tone lum|ink
│       ├── TextLink/      # A link inside a sentence; tone lum|field|inherit
│       ├── Textarea/      # Multiline text input primitive
│       ├── Toast/         # Imperative toast queue — toast.success/error/info() + <Toaster/>
│       ├── Tokens/        # Storybook-only: the palette, radii and shadows read out of index.css
│       ├── cn.ts          # tailwind-merge taught the site's token names. The only file that may import tailwind-merge
│       ├── variants.ts    # The surface variants (single source of truth). Private to components/ui
│       └── index.ts       # Barrel export for all ui components
├── admin/                 # Admin CRM SPA (separate Vite entry; see /crm)
│   ├── components/        # Dashboard, Login, VisitorList, VisitorDetail (orchestrator), VisitorMetaGrid, ConversationTimeline, ActivityTimeline, VisitorsChart, ContactSubmissionList, TabBar, Skeleton
│   ├── hooks/             # useVisitorDetail (fetch + notes/location save + delete + dirty flag)
│   └── lib/               # api.ts (apiCall helper), dateFormat.ts, location.ts (resolveLocation), lastVisit.ts, userAgent.ts
├── data/                  # Typed data files (work.ts, testimonials.ts, instagram.ts, navigation.ts, resume.ts, notes.ts, chat-context.ts)
├── hooks/                 # useChat, useCarousel, useIntersectionObserver, useParallax, useTitleCycle, useWaveGrid, useCountUp, useTagFilter
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

tests/                     # Vitest — the UI vocabulary guard, house rules for notes, chat validation, visitor helpers, the CRM unsaved-edits guard
```

Path alias: `@/*` → `src/*` is configured in `vite.config.ts` and `tsconfig.app.json`. Use `@/data`, `@/hooks`, `@/lib/...` rather than long `../../../` chains.

### UI Component conventions

- All components spread `...props` onto the root element and accept `className` for overrides.
- Headings default to `color: inherit` — set text color on the parent or via `className`.
- `Eyebrow` applies `fontVariationSettings: "'GRAD' 150"` for the optical weight effect used across the site.
- **The UI system is closed, and three things enforce it.** Run `/ui` for the full reference before building anything visible.
  - **Tokens.** The `@theme` block in [src/index.css](src/index.css) opens with `--color-*: initial; --shadow-*: initial; --inset-shadow-*: initial`, which deletes Tailwind's own palette and shadow scale. The only colours are the ones declared there (`lum`, `lum-deep`, `ink`, `ink-soft`, `ink-mute`, `ice`, `glow`, the status and `data` tokens), so `bg-blue-950` or `shadow-lg` compiles to nothing. **Don't remove those three lines.** A new colour, radius or shadow is added there and in [cn.ts](src/components/ui/cn.ts).
  - **Types and lint.** `Button` and `Panel` take a **required** `variant` from [variants.ts](src/components/ui/variants.ts): `luminous | white | outline | tint-white | tint-ink | raised-dark | notice-error | notice-success | notice-info | success | error`. There is no default, because no surface is right on every field. ESLint refuses importing the variant maps outside `components/ui` (use `surface()` from the barrel), importing `tailwind-merge` anywhere but `cn.ts` (use `cn`), a raw `<section>` / `<main>` / `<h2>` / `<h3>` in `sections/`, `layout/` and `App.tsx`, and colour, shadow or radius literals in an inline `style`.
  - **`tests/ui-vocabulary.test.ts`.** It parses the source with the TypeScript compiler and fails on any palette class that is not a token, any hex / `rgb()` / `oklch()` literal, any arbitrary `rounded-[…]`, `shadow-[…]` or colour value, `backdrop-*`, `dark:`, and the names of removed variants and utilities. Sizes (`text-[clamp(…)]`, `w-[7.75rem]`, `calc()`) are untouched. The failure message names the token to use. A genuine exception goes in [tests/ui-vocabulary.allowlist.ts](tests/ui-vocabulary.allowlist.ts) with a reason; an unused entry fails the test.
- **Which variant goes on which field**: on `lum`, `white` for the main action and `tint-white` for the second; on `ink`, `luminous` and `tint-ink`, with `raised-dark` panels; on white, `luminous` and `outline`. `white` has no border, so it is invisible on white: that is what `outline` is for.
- **A field is a `Section` (or a `Sheet`), never classes.** `Section tone="lum|ink|white"` sets the background, the text colour and the focus-ring colour together; `rhythm` sets the vertical padding (`section` / `block` / `tight` / `none`). `Page` is a route's `<main>`.
- **Focus rings follow the field.** One global ring, drawn in `--focus-ring` (default `lum`). `focus-on-field` makes it white on `lum` and `ink` (a blue ring on the blue field is 1.4:1); `focus-on-paper` sets it back on a white surface inside a field. `Section`, `Sheet`, `Card`, `Chat`, `ContactForm` and the dropdown panels apply these. Don't write `focus-visible:outline-*` at a call site.
- **Repeated type has a primitive**: `Lead` (the paragraph after a heading), `Label` (small uppercase label), `TextLink` (a link in a sentence), `Code` (inline chip). `text-glow` is for `ink` only; on `lum` it is under 4:1, so labels there stay white.
- `Button` axes besides `variant`:
  - `size` (`sm` | `md` | `lg`, default `md`) — controls text scale and padding.
  - `shape` (`pill` | `square`, default `pill`) — `pill` for text buttons; `square` for icon-only buttons.
  - `as="span"` renders the button's appearance on a non-interactive `<span>`, for a button inside something already clickable (a `Card`'s footer), where a real button would be a second control to the same place. Never for something clickable in its own right.
- `Panel` is a div with a variant's surface, nothing more. **A card is a `Card`**: the Work grid, the notes index and the note pager all use it. Its title is one stretched link that covers the card, so the tag pills inside stay real buttons and the link's accessible name is the title; don't wrap a card in an `<a>`. `useWaveGrid` finds cards by their `data-card` attribute.
- `FilterBar` + `useTagFilter` are the sort / tag-filter / count / reset controls and their state, shared by the Work grid and the notes index. A third filterable grid uses both.
- `Dropdown`'s panel is always the white listbox; its trigger takes a `variant` (default `white`). Focus never enters its list: the trigger keeps it and uses `aria-activedescendant`, the list's `onMouseDown` prevents the default, and `selectAt` refocuses the trigger. Without those a mouse pick focuses an option that is about to unmount and drops focus on `<body>` (the same bug `MultiSelect` documents).
- `MultiSelect` is the multi-value form of `Dropdown` — same trigger, portal, and keyboard model, but selection is a set and choosing an option keeps the panel open. Used by the `Work` grid and the notes index for tag filtering. Its option list is **derived** from the data in both places, never hand-listed. Run `/ui` before changing its focus handling, drop-up placement, or scroll re-measurement — each of those fixes a specific bug and the reasons are recorded there.
- `Pill` is a tag/filter chip (`outline` at rest, `luminous` when `active`). Set `active` for filled state, `onClick` for interactive use (adds `aria-pressed`), `onDismiss` for a dismissible badge with X icon. Handles `e.preventDefault()` + `e.stopPropagation()` internally — safe inside card links.
- `CascadeGroup` wraps a group of elements and fires when it enters the viewport (`react-intersection-observer`, `triggerOnce: true`). Use `mountOnly` for above-the-fold content (Header, Hero) — animates on mount instead of scroll. Accepts `threshold` (default `0.1`) and `stagger` (default `75ms`). Use `as` to render as any HTML element (e.g. `as="ul"`).
- `CascadeItem` wraps a single item inside a `CascadeGroup`. Reads `inView` from context and fades up (`opacity-0 translate-y-[6px]` → visible) with a delay of `Math.min(index, 7) * stagger`. Use `as="li"` inside `<ul>` grids to preserve semantic HTML. The stagger index caps at 7 so long lists don't wait seconds.
- `Markdown` is the only component that renders react-markdown, and `loadMarkdown()` in [src/lib/markdown.tsx](src/lib/markdown.tsx) holds the **only** value import of it (a dynamic one). It carries micromark + hast (~35KB gzipped) and used to sit in the shared `ui` chunk that every homepage visit downloads before first paint; splitting it took that chunk from 61KB gzipped to 28KB. A plain `import ReactMarkdown from 'react-markdown'` anywhere puts it straight back. Render with `<Markdown components={…}>{rawText}</Markdown>` — it applies `linkifyEmail` itself, so callers must not pre-apply it. `prefetchMarkdown()` warms the chunk on idle; `Chat` already calls it. **`Markdown` reads the module with `use(loadMarkdown())`, not `React.lazy`, and that is deliberate** — a lazy component cannot be loaded ahead of its first render, and the prerendered note pages need the parser settled before the article hydrates (see Prerendering).
- Import from the barrel: `import { Button, Section, SectionTitle, Lead, CascadeGroup, CascadeItem } from '../ui'`. The one exception is `cn`, imported from `@/components/ui/cn`.

### CSS Utilities

- **`index.css` is the only home for raw CSS values.** A bespoke effect is a named `@utility` there, built from tokens (`hero-scrim`, `wordmark-outline`, `card-glow`, `card-lift`, `grid-split`, `sheet-widen`), not an arbitrary value at a call site.
- **No glassmorphism.** Nothing on the site uses `backdrop-filter` (decision 2026-11, Luminous redesign), and the vocabulary test fails on it. The old `glass-*` variants are gone, renamed for what they are (`tint-white`, `tint-ink`, `notice-*`). The Chat and ContactForm are always the white card, with no theme prop (the `ada_toggle` event type stays so the CRM can show past counts). Don't reintroduce blur.
- **Tailwind scans prose for class names.** `index.css` carries `@source not` lines for `src/data/notes.ts`, `CLAUDE.md`, `.claude/` and `tests/`, because documents that *describe* classes were making the build emit them (a real `backdrop-filter` utility among them). A new directory of prose about the codebase needs a line there too.
- **Luminous palette** (`index.css` `@theme`): `lum` #2B54FF (fields, primary fills; white text 5.5:1), `lum-deep` (links and tags on white), `ink` #0A1033 (dark fields: hero surround, footer, admin), `ink-soft` (body copy on white), `ink-mute` (dates, captions, placeholders), `ice`, `glow` (non-text accents on `lum`; text only on `ink`). The `luminous` variant is the solid blue button. Named radii (`rounded-card`, `rounded-sheet`, …) and shadows (`shadow-card`, `shadow-float`, …) live in the same block.
- `.tracking-display` — the −0.02em tracking every Display heading uses (`H1`/`H2`/`H3` apply it); a theme token (`--tracking-display`), like `tracking-label` for the uppercase `Label`. `RiseText` splits headings into per-letter inline-blocks, which switches off the font's kerning, so it re-applies the font's own pair values plus the same tracking as margins from **`src/lib/displayKerning.ts` — generated, run `npm run kerning` after changing the font**. Don't hand-tune per-pair spacing: an optical pass was tried and made LL touch.
- `.rise-ch` — one RiseText letter; `data-out` is its pre-entrance state. The prerender's `<noscript>` style reveals it, like `.cascade-item`.
- `.duotone-lum` (hero photo), `.lu-flash` (hero opening wipe), `.lu-wipe-in` (subject rise, on `translate` because the parallax owns `transform`), `.wave-grid` (Work grid drift/lean), `.sheet-widen` (a `Sheet widen` growing to full bleed), `.card-lift` (a `Card`'s hover lift and pointer tilt) — all off under reduced motion.
- `.icon-optical` — optical icon sizing for `Button`. The caller sets `--icon-size`, which fixes every icon's layout box; light geometric glyphs (lucide `arrow*`/`chevron*`/`corner*`/`move*`/`plus*`/`minus*`/`check*`/`x*`, matched on the `lucide-<name>` class lucide stamps on every svg) then get `scale: 1.25` so they don't read undersized next to dense pictograms. The bump is paint-only — it never changes a button's height or width, so icon-only buttons in a row stay identical. CSS beats lucide's `size`/`className` on the icon, so `size={14}` or `h-4 w-4` at a call site inside a Button has no effect.
- `.grad-hover` — optical-weight hover shift on the Google Sans `GRAD` axis (used on footer/contact links). Route changes cross-fade via `@view-transition` (MPA cross-document); the fixed header carries `view-transition-name: site-header` — keep that name unique. All of this is disabled under `prefers-reduced-motion` and print. (There is no heading weight animation: `display.woff2` is a single static black italic, every weight renders identically.)

### Scroll animation requirements

**Every section must use `CascadeGroup` + `CascadeItem`.** This is not optional — it is the standard entrance animation for all page sections.

Pattern:
1. Wrap each distinct visual block (heading row, body copy, card grid, controls) in its own `CascadeGroup`.
2. Each block inside a group gets a `CascadeItem` with an ascending `index` (0, 1, 2…).
3. Card/item grids: use `CascadeGroup as="ul"` on the grid container and `CascadeItem as="li" index={i}` per card.
4. Above-the-fold (Header, Hero): use `CascadeGroup mountOnly` instead of scroll trigger.
5. Threshold guidance: `0.15` for headers, `0.1` for body copy, `0.05` for dense grids.
6. `threshold` is a fraction of the *group*, so a tall group can ask for more than a screen holds and never fire (the notes list, 12,700px on a phone, was invisible on a 548px viewport). `CascadeGroup` measures itself and caps the ask at a quarter of the viewport (`MAX_VIEWPORT_SHARE`) — don't remove the cap, and don't work around it with a per-section `threshold={0}`.

## Development

```bash
npm run dev       # vercel dev + storybook in parallel; site at http://localhost:3000, storybook at :6006
npm run dev:site  # vercel dev only (site at http://localhost:3000) — runs Vite under the hood and serves /api/* serverless functions
npm run build     # production build → dist/, then prerenders every public route into its HTML (scripts/prerender.mjs)
npm run preview   # preview production build locally
npm run lint      # ESLint (src/, api/, scripts/, tests/)
npm run typecheck # tsc -b across the app, api, node and test projects
npm test          # Vitest, tests/ only — see below
npm run lqip      # regenerate src/data/lqip.ts blur-up placeholders (run after `npm run images` adds Instagram posts)
npm run kerning   # regenerate src/lib/displayKerning.ts from public/fonts/display.woff2 (needs Playwright's Chromium)
npm run icons     # regenerate the PNG icons from public/favicon.svg on the ink token
npm run seed:crm  # seed fake CRM visitors/sessions/page views (see /crm); :clean removes, :status counts
npm run check:crm-ui -- http://localhost:3000 ./out   # screenshot the CRM at 4 widths, report overflow (no DB writes)
npm run shots     # capture note screenshots into assets-source/notes/ (needs a server; see /note)
```

- **Tests live in `tests/`, never under `api/`.** Vercel turns every file under `api/` into a function, and the project is one below the 12-function cap: a test file there fails the next production deploy. They run against a separate `vitest.config.ts` because evaluating `vite.config.ts` writes the notes documents and the sitemap. `tests/notes.test.ts` enforces the `/notes` house rules (no em dashes, slug shape, ISO dates, commit SHAs, summary length), so a failing run there usually means an entry, not the test, needs fixing. `tests/ui-vocabulary.test.ts` is the UI system's guard (see UI Component conventions); a failure there means a class or value, not the test, needs fixing, and its message says what to use instead.
- **CI** ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs lint, typecheck, test and build on every push to `main` and every PR, with no secrets. Node is pinned by `.nvmrc`.
- [.env.example](.env.example) is the reference for every environment variable and what breaks without each one. Keep it in step when a function reads a new one.

Env vars for `vercel dev` come from the linked Vercel project (cloud), not `.env.local`. Use `npx vercel env add NAME [development|preview|production]` to add new keys per-environment.

## Design Principles

Inherited from the existing site and maintained going forward:

- **Content-first** — the work speaks; don't let chrome compete with it
- **Motion with one rhythm** — the Luminous redesign (2026-11) chose more motion, but every section header enters the same way: eyebrow, then the heading's letters (RiseText, the hero wordmark's spring), then the description from 340ms (`descDelay`). Use `SectionTitle`; don't invent a per-section entrance.
- **Inner routes share one frame** — `/resume`, `/privacy`, `/notes` and each note open on a `PageHero` (solid `lum` field; a `SectionTitle as="h1" mountOnly` at poster size, except a note, whose sentence-length title stays sans) and put their body on a `Sheet tone="white"`, the white sheet rising over the hero (the Work sheet is the same component, `tone="lum" widen`). The two document pages (resume, privacy) split each section 4/12 sticky head (`SectionTitle size="compact" sticky`) to 8/12 content with the `grid-split` utility. The notes index is the exception: one blue field with Work-style white cards, because it is the site's other filterable index and should read as Work does. A note's body is `max-w-2xl`, which is what `NOTE_IMAGE_SIZES` in `NoteFigure` assumes.
- **The resume's print sheet is keyed to class hooks, not structure** (`resume-hero`, `resume-masthead`, `resume-identity`, `resume-name`, `resume-headline`, `resume-section-title`, `entry-identity`, `values-grid`, `credentials-grid`). Check a print preview after any change to `Resume.tsx` or `SectionTitle`: Chrome lays the printed page out wide enough to take `md:` classes, and it must stay one Letter sheet. `RiseText` prints its plain text, not its letters, so the PDF's text layer reads as words.
- **Scannable** — tech tags on project cards, clear section hierarchy
- **Fixed palette, no theme switching** — three fields and nothing else: Luminous Blue, white, and ink (the hero's surround, Visuals, the footer, the admin). There is no dark mode and no `dark:` variants (the vocabulary test fails on one). Decision made 2026-07 — don't reintroduce.
- **One system, enforced** — every colour, radius and shadow is a token, every surface a variant, every field a `Section`. The Luminous consolidation (2026-11) deleted the pre-redesign layer outright (the muted blue ramp, the gradient button, `Backdrop`, the glass variants) rather than leaving it beside the new one, and closed the palette so the old classes cannot come back by accident. Extend the system; don't route around it.
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
- **Every static page is dated in [src/data/pages.ts](src/data/pages.ts)** (`published`, `updated`), and that one record feeds the footer's visible "Updated" line (plus the privacy masthead's "Last updated"), the page's JSON-LD `dateModified` / `datePublished` (the resume's ProfilePage uses `dateCreated`, which Google's profile-page docs ask for), and its sitemap `<lastmod>`. The HTML entries carry `__PAGE_UPDATED__` / `__PAGE_PUBLISHED__` placeholders that the `pageDates()` plugin in `vite.config.ts` fills; `tests/seo.test.ts` checks every JSON-LD block parses and that the page node uses the placeholders rather than a literal date. **Bump `updated` when a page's content or layout changes in a way a reader would notice**, not for a typo: Google compares the visible date with the structured one. A note is dated in `notes.ts` instead (`date`, plus `updated` once it is revised in substance).
- **A new public route means a new HTML entry, a `vite.config.ts` input, a `vercel.json` rewrite, a `getRoute()` case, and a `sitemap.xml` entry.** Missing any one of them fails silently in a different way. The `/notes` route is the exception that proves it — all five are generated, see below.
- **`useTitleCycle` runs on the homepage only, and holds the static `<title>` for 15s first.** It used to run everywhere and start at 500ms by blanking the title — which meant JS-rendering crawlers could snapshot a half-typed title, and `/resume` never showed a resume title at all. `PHRASES[0]` must stay byte-identical to `index.html`'s `<title>`; the cycle opens by *erasing* it, so a mismatch makes the first frame jump.

Home section order in `App.tsx`:
1. `Hero` — duotone poster: forest in Luminous Blue, full-width RiseText wordmark *behind* the subject cutout plus an outlined copy in front of it, cyan particles, CTAs, white chat card. Layering is by z-index across siblings, so the wordmark must stay outside any `CascadeItem` (its transform is a stacking context) ✓
2. `Work` — blue sheet rising over the hero, four stats counted from `work.ts`, sort + tag filter, type-only cards in a wave grid (`useWaveGrid`) ✓
3. `Testimonials` — white field, segmented progress, quote words rise in and a highlighter sweeps `highlight` (must be an exact substring — `tests/testimonials.test.ts`) ✓
4. `Visuals` — Instagram accordion; ≥1024px with motion it is pinned and opens with a scroll-driven zoom from full screen into the open slice. Decided after hydration, so the prerender is always the plain accordion ✓
5. `Contact` — solid blue field, white contact card ✓

- **Every particle canvas runs through `visibleRafLoop`** ([src/components/sections/Hero/visibleRafLoop.ts](src/components/sections/Hero/visibleRafLoop.ts)) and paints only while it is on screen. The homepage mounts two of them (the Hero's `ParticlesSmall` + `ParticlesLarge`; Contact had two more until the Luminous redesign), and the cost is fill rate, not particle count: a full-viewport `clearRect` plus additive `lighter` blending at up to 2x DPR, with Large's sprites drawn at ~half the viewport width. rAF stops itself in a background *tab*; nothing stops it for a canvas merely scrolled past. Verified at 0 draws when scrolled away.
- **Both sims are delta-timed.** `visibleRafLoop` hands `frame` a delta in 60fps units (1 at 60Hz, ~0.5 at 120Hz) and every per-frame increment in the tick functions is multiplied by it. They were fixed-step and therefore ran at literally double speed on a 120Hz display. Two guards make delta-time safe to pause, and removing either reintroduces a real bug: `MAX_DELTA` caps a step at 3 frames so a stalled tab or a slept machine can't teleport every particle, and `last` is re-baselined on every `start()` so the first frame after an off-screen pause is charged as one frame rather than the whole time spent scrolled away. Verified refresh-rate independent at 60/120/144Hz.
- **The work grid's `ItemList` JSON-LD is generated at build time** by the `workSchema()` plugin in `vite.config.ts`, from `src/data/work.ts`, into `index.html` only. Hand-copying 39 entries into the HTML would be stale within a release, and a stale ItemList is worse than none. It deliberately omits `image` (the cards hotlink Unsplash stock that has nothing to do with the projects — asserting that as a project's image tells a crawler something false) and uses `contributor` rather than `author` (client and agency work; Eric contributed front-end architecture, he did not author these properties). Add `image` back when the cards carry real screenshots.
- **Work cards are type-only since the Luminous redesign** — the grid passes no `image`, so the Unsplash stock is no longer requested. The helpers below still exist in `work.ts` for whenever real screenshots arrive; the notes stand for that day.
- **Work card images were responsive off Unsplash's own CDN.** `WorkItem.image` holds a photo *id*, not a URL; `workImageSrc` / `workImageSrcSet` / `WORK_IMAGE_SIZES` in [work.ts](src/data/work.ts) derive the rest, and `Card` stays generic via `imageSrcSet` / `imageSizes` props. Before this every device downloaded a flat `w=800` into a 339px slot. 1x displays now transfer 68–76% less; **no device transfers more**, which is a property two things enforce and both are easy to break:
  - **`sizes` must be exact, `calc()` and all.** Plain `50vw` ignores Container's 48px padding and the 12px grid gaps — at 834px it claims 417px for a 387px card, and that 8% overestimate was enough to push tablets onto a bigger candidate and make them *worse* than before the srcSet existed. An inaccurate `sizes` doesn't degrade gracefully, it inverts the optimisation. Keep it in step with Work.tsx's `grid-cols-*` chain.
  - **`CARD_WIDTHS` is capped at 800.** A 3x phone wants 936px and will take a 1024 candidate — 51% more than the old flat `w=800`, on the most likely-metered device class. These are decorative thumbnails. Don't extend the ladder without re-measuring high-DPI mobile.
- **No `twitter:creator` / `twitter:site`** — there is no X/Twitter account in `navigation.ts` or the JSON-LD `sameAs`. Don't add one speculatively; the Twitter card works without it.
- **The icon is generated, the SVG included.** `npm run icons` ([scripts/generate-icons.mjs](scripts/generate-icons.mjs)) builds `public/favicon.svg` (the white mark from `public/icon.svg` on a `lum-deep` → `lum` → `glow` gradient, in a squircle), then rasterises it: `icon-192/512.png` (squircle, transparent corners), `icon-maskable-512.png` (full bleed, mark inside the 80% safe zone) and `apple-touch-icon.png` (full bleed, because iOS rounds the corners itself and fills transparent ones with black). Colours come from `@theme`, so don't hand-edit `favicon.svg`: change the token or the mark and re-run. `ink` (#0A1033) is the `theme-color` in every HTML entry, in `noteDocument()`, in the two static error pages and in `site.webmanifest`; `tests/ui-vocabulary.test.ts` fails if any of them drifts from the token.
- **There is no Google Analytics, and no third-party analytics of any kind.** It was removed once measurement showed it cost 149KB, ~40ms of LCP and ~210ms of load, to collect a subset of what `lib/telemetry.ts` already records first-party and more precisely. The CSP was tightened to match — `connect-src` is now `'self'` alone. **Don't reintroduce a tag manager without re-widening the CSP**, and note the site now sets **no cookies at all** on the public routes, which [Privacy.tsx](src/components/sections/Privacy/Privacy.tsx) states plainly.
- `script-src` still needs `'unsafe-inline'` even with GA gone: the JSON-LD blocks are inline `<script>` elements and CSP applies `script-src` to them. Removing it silently kills every structured-data block on the site.
- **Adding a `VisitorEventType` is a three-file change plus a manual migration.** `src/lib/telemetry.ts` (the union), `api/events.ts` (`VALID_TYPES`), and the `type` check constraint on `visitor_events` in [db/schema.sql](db/schema.sql) — and the constraint has to be widened by hand in the Neon SQL editor, because `create table if not exists` will not alter a table that already exists. Until that ALTER runs, `/api/events` accepts the event and the insert is swallowed by its best-effort catch: **the event silently vanishes.** The ALTER is kept ready to paste at the bottom of schema.sql.
- **The logo easter-egg sound is constructed on first play, not on import.** It was a module-scope `new Audio()` pointing at a 750KB WAV — the largest asset on the page, downloaded on every route, for a joke that fires on clicking an already-active nav item. Now 16KB AAC, fetched on first trigger. Don't move the construction back to module scope.

## Prerendering

Every public document is rendered to HTML at build time and hydrated in the browser. `npm run build` ends with [scripts/prerender.mjs](scripts/prerender.mjs), which builds the app a second time for Node from [src/entry-server.tsx](src/entry-server.tsx), renders each route, and writes the markup into that document's `#root`. Before this each document shipped an empty `<div id="root">`: the per-route head tags described content a non-JS crawler never received, and the hero image could not start downloading until React had rendered an `<img>` (1,328ms on a throttled phone; 185ms now).

- **[src/main.tsx](src/main.tsx) hydrates when `#root` has children and client-renders when it is empty.** `vite dev` serves the bare entries, so dev is unchanged — and a build whose prerender step did not run degrades to the old behaviour rather than breaking. `dashboard.html` is never prerendered.
- **The first client render must produce the markup the build produced.** Anything that depends on the browser (localStorage, `matchMedia`, feature detection, the clock) must not be read during render. Gate it on `useHydrated()` ([src/lib/hydration.ts](src/lib/hydration.ts)), which is false on the server and during hydration and true after; **never on `typeof window`**, which gives the server one answer and the hydrating client another. `Chat`, `Toaster` and the particle canvases are client-only for this reason, and the Hero holds the chat's place with a box of `CHAT_RESTING_HEIGHT` (394px, measured — re-measure if the chat's resting layout changes).
- **`App` takes a `pathname` prop and passes `isHome` to `Header`**, because the prerender has no `window.location`. Don't read `window` at render time in anything a public route renders.
- **A Suspense boundary must not sit under a `CascadeGroup` unless everything inside it is already loaded.** `CascadeGroup` is a context provider whose value changes when it scrolls into view, and React answers a context change above a not-yet-hydrated boundary by hydrating it on the spot; if anything inside still suspends, it discards the prerendered HTML and shows the fallback. On a note page that was the article collapsing to one paragraph of raw markdown and re-expanding: CLS 0.47. `NoteArticle` ([Note.tsx](src/components/sections/Notes/Note.tsx)) is the worked example — the boundary wraps the group, and it waits on `loadMarkdown()` before rendering. For the same reason, don't let a component re-render past a boundary it prerendered.
- **`entry-server.tsx` renders until nothing suspends, with `progressiveChunkSize` maxed.** Either one missing and React emits the section as a hidden `<div>` plus an inline script that moves it into place, which is invisible without JavaScript. The loop throws if it does not settle.
- **`CascadeItem` starts at `opacity: 0` and is revealed from JS**, so the prerender script adds a `<noscript>` style that reveals it. Without it a no-JS visitor would get the whole page and see none of it.
- **The server build's scratch dir lives in `node_modules/.cache/prerender-ssr`, not the project root.** `vercel dev` watches the whole tree, and a `dist-ssr/` that appeared and vanished mid-scan crashed it (`ENOENT: scandir dist-ssr`) whenever a build ran beside the dev server. Don't move it back.
- **A prerender failure fails the build**, deliberately. Check with a throttled run, not just a fast local one: the article bug above was invisible until the network was slowed.

## Notes (`/notes`)

A changelog of engineering decisions made on this site. Entries live in [src/data/notes.ts](src/data/notes.ts); `/notes` is the index, `/notes/<slug>` is a single entry.

- **A note is for an interesting or substantial change, not for every change.** Run `/note` before writing one. The bar is whether a stranger who works on the web would get something out of it: a measurement that contradicted an assumption, a wrong turn worth describing, a constraint that turned out to be arithmetic rather than taste, a fix whose obvious version made things worse. Routine work does not qualify, and a section padded with filler stops being worth reading. **Don't add an entry just because a task finished** — ask if it isn't clear.
- **Voice: personal, collected, technical where the detail earns it.** First person, past tense, specific numbers over adjectives, and name what went wrong before what fixed it. Beyond the em dash ban below, the things that make prose read as machine-written are worth avoiding too: tricolons in every sentence, "it's not just X, it's Y", restating the heading in the first line of the paragraph, and summarising at the end what was just said.
- **Most notes about something visual should carry a screenshot.** `npm run shots` drives Playwright from [scripts/notes-shots.config.mjs](scripts/notes-shots.config.mjs) into `assets-source/notes/`, and `npm run images` globs that directory to emit the variants into `public/note-shots/`. Reference one from a body as `![Alt](/note-shots/<name> "Caption.")` — a base path with no width and no extension; `noteMdComponents` derives the `<picture>`, the srcSets and the `<figcaption>`. **Alt and caption do different jobs and must not be the same sentence**: alt is what the image shows for someone who cannot see it, the caption is what it means. If a shot is of fixture data rather than real traffic, the caption has to say so.
- **Nothing under `src/` may import a value from `notes.ts`** (ESLint enforces it). It is one array holding every body, so any client chunk that imports it ships all of them — the index and every article were each downloading the full set, 36KB gzipped. The browser reads [src/data/notes-index.ts](src/data/notes-index.ts) instead: entries minus `body`, plus `noteBody(slug)`, which fetches that one body as its own chunk. Both come from the `notesData()` plugin in `vite.config.ts`, generated from the same array, so the workflow below is unchanged.
- **Adding an entry to `notes.ts` is the entire workflow.** Everything the five-item route checklist above demands is derived from that array by `notesEntries()` in `vite.config.ts`: the HTML document, the Vite input, and the `sitemap.xml` line. The `vercel.json` rewrite (`/notes/:slug`) and the `getRoute()` case are written once and cover every slug. **Don't hand-write a document under `notes/`** — it is gitignored and will be overwritten.
- **`notes/*.html` and `public/sitemap.xml` are generated and gitignored.** They are derived from `notes.ts`; a committed copy is a second source of truth waiting to disagree with the first. `sitemap.xml` therefore no longer exists in the repo — it is written at config-evaluation time, which is why both `vite dev` and `vite build` see it. Static routes carry a hand-declared `lastmod` in `STATIC_ROUTES`; `/notes` derives its own from the newest entry.
- **Generation runs while the config is evaluated, not in a plugin hook** — `rollupOptions.input` resolves real paths from disk before any hook fires. `writeIfChanged` exists because rewriting identical bytes on every dev restart bumps mtimes and produces a full-reload loop.
- **A revised entry gets `updated`, not a new `date`.** It shows as "Updated …" in the note's masthead and becomes its `dateModified`, `article:modified_time` and sitemap `<lastmod>`; the entry keeps its place in the list, which sorts on `date`. Only for a revision in substance.
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

## Images

`npm run images` regenerates every variant from `assets-source/` per `scripts/responsive-images.config.mjs`.

- **A manifest entry may override quality** via an optional `quality: { avif, webp, jpg, png }` merged over the defaults (`{ avif: 55, webp: 78, jpg: 80, png: 90 }`). Only override where the image's job doesn't need the default fidelity — currently just the Contact background, which is `aria-hidden` under a 75%-black gradient and a grain layer.
- **`quality` on PNG is what enables palette quantisation at all.** Without it sharp encodes fully lossless and ignores the number: that is how `subject-1024.png` came to be 2.5MB for a file that only exists as the `<picture>` fallback behind AVIF and WebP. It is 438KB now, at 42.6dB PSNR over the opaque pixels.
- **A requested width above the source's is skipped with a warning, not clamped** (2% tolerance, so `subject.png`'s 1023-vs-1024 still emits). Clamping produced files whose *name* overstated their width — and the name is what the srcSet advertises, so browsers picked a 2048px `EJS01845-2560` believing it had 2560px. Dropping a width means editing the `srcSet` at the call site too.
- Run `npm run lqip` after adding Instagram posts.

## Deployment

Static site + serverless functions on Vercel. `npm run build` produces `dist/` (with `index.html`, `resume.html`, `privacy.html`, and `dashboard.html` entries) plus the `api/` functions. Final target: **eric.sh**.

- **The deploy must run `npm run build`, not bare `vite build`** — the prerender is the last step of that script. A deploy that skips it still works (the pages client-render) but ships empty documents again. The build log line to look for is `prerendered N documents`.

- **`public/` assets are cached by explicit `headers` rules in `vercel.json`** — Vercel's default for them is `max-age=0, must-revalidate`, so every repeat visit was revalidating ~8MB of photography. `/fonts/*` is a year + `immutable`; `/hero`, `/posts`, `/contact` get 30 days + `stale-while-revalidate` rather than `immutable`, because those filenames are stable across regeneration and `immutable` would pin a stale image until the name changed. Hashed `/assets/*` is handled by Vercel already.

## Claude Commands

| Command | What it does |
|---|---|
| `/scaffold` | Scaffold a new page section or reusable UI component from the system's primitives |
| `/ui` | Reference for the UI system: tokens, surface variants, every primitive, and the rules the tests enforce |
| `/contact` | Contact section and form: layout, validation, spam protection, the API handler |
| `/chat` | Reference for the Hero chat: file map, prompt structure, streaming protocol, persistence, vercel-dev gotchas |
| `/crm` | Reference for the admin CRM: schema, auth model, file map, adding endpoints, env-var gotchas |
| `/note` | When a change earns a `/notes` entry, the house voice, and the screenshot pipeline |
