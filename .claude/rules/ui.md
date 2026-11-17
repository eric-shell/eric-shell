---
paths:
  - "src/components/ui/**"
  - "src/components/layout/**"
  - "src/index.css"
  - "tests/ui-vocabulary*"
  - "tests/ui-vocabulary.allowlist.ts"
  - ".storybook/**"
  - "**/*.stories.tsx"
---
# The UI system (run /ui for the full reference)

### Directory map of `src/components/ui/`

```
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
```

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
