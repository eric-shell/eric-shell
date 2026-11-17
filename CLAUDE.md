# eric.sh — Personal Portfolio

Personal portfolio website for Eric Shell. Successor to https://eric.sh/, which is where this project will eventually be hosted.

Stack: Vite, React 19, TypeScript, Tailwind v4, npm; Vercel serverless functions in `api/`, an admin CRM, build-time prerendering and a `/notes` changelog. Area-specific rules load from `.claude/rules/` when you touch matching files (UI system, sections and home, resume print, SEO and head tags, prerender and hydration, notes, admin and `api/`, images); long references are skills (below).

## Commands

Node comes from `.nvmrc` (`source ~/.nvm/nvm.sh && nvm use`). Timings are warm, measured on this machine.

| Task | Command |
|---|---|
| Site (vercel dev, serves `/api/*`) at http://localhost:3000 plus Storybook at :6006 | `npm run dev` (`npm run dev:site` for the site alone) |
| Typecheck, about 3 s (`tsc -b` across the app, api, node and test projects) | `npm run typecheck` |
| Lint, about 2 s (ESLint over src/, api/, scripts/, tests/) | `npm run lint` |
| Tests, about 1 s (Vitest, `tests/` only) | `npm test` |
| Production build, about 5 s: `tsc -b`, `vite build`, then the prerender (log line `prerendered N documents`) | `npm run build` |
| Preview the production build at http://localhost:4170 | `npm run preview` |
| Blur-up placeholders `src/data/lqip.ts` (run after `npm run images` adds Instagram posts) | `npm run lqip` |
| Responsive image variants from `assets-source/` | `npm run images` |
| `src/lib/displayKerning.ts` from `public/fonts/display.woff2` (needs Playwright's Chromium) | `npm run kerning` |
| `src/data/resumeQr.ts`, the resume PDF's QR code (eric.sh/resume, utm_source=resume-pdf) | `npm run qr` |
| `public/favicon.svg` and every icon PNG from the tokens and `public/icon.svg` | `npm run icons` |
| `public/social.jpg`, the og:image (needs Playwright's Chromium and the network) | `npm run social` |
| Seed fake CRM visitors/sessions/page views (`:clean` removes, `:status` counts; asks first) | `npm run seed:crm` |
| Screenshot the CRM at 4 widths, report overflow (no DB writes) | `npm run check:crm-ui -- http://localhost:3000 ./out` |
| Capture note screenshots into `assets-source/notes/` (needs a server; see `/note`) | `npm run shots` |

Env vars for `vercel dev` come from the linked Vercel project (cloud), not `.env.local`. Use `npx vercel env add NAME [development|preview|production]` to add new keys per-environment. [.env.example](.env.example) is the reference for every environment variable and what breaks without each one. Keep it in step when a function reads a new one.

Project skills (type `/name`): `check` (typecheck, lint, tests, printing only failures), `map` (one line per source module), `dev` (run and look at the site), `ui` (the UI system reference, run before building anything visible), `scaffold` (new section or ui primitive), `chat` (Hero chat), `contact` (Contact section and API), `crm` (admin CRM, telemetry, function cap), `note` (when a change earns a `/notes` entry), `responsive-images` (add an image to the pipeline).

## Checks: run only what the change justifies

The default is to run nothing. Each check must be earned by what this prompt changed, never run as a habit or "to be safe". CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs lint, typecheck, test and build on every push to `main` and every PR, with no secrets.

| What changed | What to run |
|---|---|
| Docs, comments, copy in `.md`, `.claude/`, questions and exploration | Nothing |
| `src/` TS or TSX | `/check tsc` once after the edits (about 3 s), not after each edit |
| Anything visible (classes, variants, tokens, `index.css`) | `/check`: `tests/ui-vocabulary.test.ts` is the guard, and a failure means a class or value needs fixing, not the test |
| `src/data/notes.ts` | `npx vitest run tests/notes.test.ts`: a failure usually means the entry, not the test, needs fixing |
| `src/data/resume.ts`, `resumeQr.ts`, or the resume page | `npx vitest run tests/resume.test.ts`; check a print preview after a change to `Resume.tsx` or `SectionTitle` |
| An HTML entry, JSON-LD, `pages.ts`, the share image | `npx vitest run tests/seo.test.ts` |
| `api/` or `src/admin/` | `/check` (typecheck, lint and the visitor, chat and unsaved-edits tests); `npm run check:crm-ui` when admin layout changes and a server is up |
| `vite.config.ts`, `scripts/prerender.mjs`, `entry-server.tsx`, `main.tsx`, hydration, `vercel.json`, a new route | `npm run build` (about 5 s); check a throttled run for prerender and Suspense changes |
| A visual change that cannot be judged from the code | `/dev`, text first, then one screenshot |

- `npm run lint` only when the change adds an import across a boundary the lint rules police (variant maps, `tailwind-merge`, `notes.ts`, raw `<section>`/`<h2>`) or touches `api/`, `scripts/`, `tests/`.
- Never re-run a check that passed on code you have not touched since, and never run a broader check than the table calls for because a narrower one passed.
- When you skip a check the user might expect, say so in one line (what and why).



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
│       └── ...            # every primitive; the full directory map is in .claude/rules/ui.md
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

## Conventions

- **Tests live in `tests/`, never under `api/`.** Vercel turns every file under `api/` into a function, and the project is one below the 12-function cap: a test file there fails the next production deploy. They run against a separate `vitest.config.ts` because evaluating `vite.config.ts` writes the notes documents and the sitemap. `tests/notes.test.ts` enforces the `/notes` house rules (no em dashes, slug shape, ISO dates, commit SHAs, summary length), so a failing run there usually means an entry, not the test, needs fixing. `tests/ui-vocabulary.test.ts` is the UI system's guard (see `.claude/rules/ui.md`); a failure there means a class or value, not the test, needs fixing, and its message says what to use instead.
- **A new directory of prose about the codebase** needs an `@source not` line in `src/index.css` (see `.claude/rules/ui.md`); `CLAUDE.md` and `.claude/` (rules, skills) are already covered.
- **Every section uses `CascadeGroup` + `CascadeItem`** for its entrance (pattern in `.claude/rules/sections.md`). Import UI from the `components/ui` barrel, `cn` from `@/components/ui/cn`.
- **Anything a visitor sees is built from the UI system**: tokens, variants, `Section`; run `/ui` first (`.claude/rules/ui.md`). Don't remove the three `initial` lines that open `@theme` in `src/index.css`.
- **Don't read browser state at render time in anything a public route renders**: gate it on `useHydrated()`, never `typeof window` (`.claude/rules/prerender.md`).
- **Any new field the telemetry collects must be disclosed** in `Privacy.tsx` in the same commit; adding an `api/` file needs a free function slot (`.claude/rules/admin.md`).


## Design Principles

Inherited from the existing site and maintained going forward:

- **Content-first** — the work speaks; don't let chrome compete with it
- **Motion with one rhythm** — the Luminous redesign (2026-11) chose more motion, but every section header enters the same way: eyebrow, then the heading's letters (RiseText, the hero wordmark's spring), then the description from 340ms (`descDelay`). Use `SectionTitle`; don't invent a per-section entrance.
- **Inner routes share one frame** — `/resume`, `/privacy`, `/notes` and each note open on a `PageHero` (solid `lum` field; a `SectionTitle as="h1" mountOnly` at poster size, except a note, whose sentence-length title stays sans) and put their body on a `Sheet tone="white"`, the white sheet rising over the hero (the Work sheet is the same component, `tone="lum" widen`). The two document pages (resume, privacy) split each section 4/12 sticky head (`SectionTitle size="compact" sticky`) to 8/12 content with the `grid-split` utility. The notes index is the exception: one blue field with Work-style white cards, because it is the site's other filterable index and should read as Work does. A note's body is `max-w-2xl`, which is what `NOTE_IMAGE_SIZES` in `NoteFigure` assumes.
- **Scannable** — tech tags on project cards, clear section hierarchy
- **Fixed palette, no theme switching** — three fields and nothing else: Luminous Blue, white, and ink (the hero's surround, Visuals, the footer, the admin). There is no dark mode and no `dark:` variants (the vocabulary test fails on one). Decision made 2026-07 — don't reintroduce.
- **One system, enforced** — every colour, radius and shadow is a token, every surface a variant, every field a `Section`. The Luminous consolidation (2026-11) deleted the pre-redesign layer outright (the muted blue ramp, the gradient button, `Backdrop`, the glass variants) rather than leaving it beside the new one, and closed the palette so the old classes cannot come back by accident. Extend the system; don't route around it.
- **Responsive** — mobile-first, 4xl max container width

(The resume print sheet's class-hook rules live in `.claude/rules/resume.md`.)


## Routes & Sections

Routing is handled by `App.tsx` reading `window.location.pathname`:
- `/` (home) renders the section stack in `.claude/rules/sections.md`
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



## Invariants

- **There is no Google Analytics, and no third-party analytics of any kind.** It was removed once measurement showed it cost 149KB, ~40ms of LCP and ~210ms of load, to collect a subset of what `lib/telemetry.ts` already records first-party and more precisely. The CSP was tightened to match — `connect-src` is now `'self'` alone. **Don't reintroduce a tag manager without re-widening the CSP**, and note the site now sets **no cookies at all** on the public routes, which [Privacy.tsx](src/components/sections/Privacy/Privacy.tsx) states plainly.
- `script-src` still needs `'unsafe-inline'` even with GA gone: the JSON-LD blocks are inline `<script>` elements and CSP applies `script-src` to them. Removing it silently kills every structured-data block on the site.


## Deployment

Static site + serverless functions on Vercel. `npm run build` produces `dist/` (with `index.html`, `resume.html`, `privacy.html`, and `dashboard.html` entries) plus the `api/` functions. Final target: **eric.sh**.

- **The deploy must run `npm run build`, not bare `vite build`** — the prerender is the last step of that script. A deploy that skips it still works (the pages client-render) but ships empty documents again. The build log line to look for is `prerendered N documents`.

- **`public/` assets are cached by explicit `headers` rules in `vercel.json`** — Vercel's default for them is `max-age=0, must-revalidate`, so every repeat visit was revalidating ~8MB of photography. `/fonts/*` is a year + `immutable`; `/hero`, `/posts`, `/contact` get 30 days + `stale-while-revalidate` rather than `immutable`, because those filenames are stable across regeneration and `immutable` would pin a stale image until the name changed. Hashed `/assets/*` is handled by Vercel already.


## Working efficiently

- Orient with `/map` (or `/map src/components/ui`) or `grep -rn "export .* <name>" src` instead of reading files to find things. Rules load on their own when you touch matching files.
- Never read `dist/`, `storybook-static/` or `package-lock.json` (denied in settings). `src/data/notes.ts` is one array of every note body: read it in ranges. The `npm run images` and `npm run lqip` outputs are generated.
- `/crm` before touching telemetry cadence or `api/`, `/ui` before anything visible, `/note` before writing a note: each records why a number or rule is what it is.
- Delegate self-contained work to the `worker` agent, never `fork` (a fork always runs on the session's model). Always pass the Agent tool's `model`, chosen for what the task needs, and name it with a reason: `haiku` for mechanical work (moving files, renames, data edits, running a script and reporting); `sonnet` for implementation whose approach is known (a section, a primitive, an endpoint, a rule split); `opus` only when the reasoning is the work (a bug with no known cause, a design decision across many modules). When unsure pick `sonnet` and re-spawn on `opus` only if the report shows it stuck. Pass `effort` the same way: `low` for mechanical work, `medium` for most implementation, `high` for a subtle edge and for `opus` workers; `xhigh` or `max` only when the user asks. Give it a self-contained prompt (goal, files, constraints, the check to run); it does not see this conversation.
- Context hygiene: when a task is finished and the next request is unrelated, or the context is large and mostly stale, end the reply with one bolded line, last thing in the output: **Task done, `/clear` before the next one.**
