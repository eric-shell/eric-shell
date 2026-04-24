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
│   ├── sections/          # Full-width page sections — each in its own directory with index.ts barrel
│   │   ├── Header/        # Fixed nav bar with cascade entrance + icon echo animation
│   │   ├── Hero/          # Above-the-fold: name, title, tagline, CTAs, particle effects
│   │   ├── Contributions/ # Filterable/sortable grid of work and projects
│   │   ├── Testimonials/  # Two-column: context copy + auto-advancing carousel
│   │   ├── Creative/      # Editorial copy + Instagram photo grid
│   │   ├── Contact/       # Contact form
│   │   ├── Footer/        # Social links, nav, copyright
│   │   └── index.ts       # Barrel export for all sections
│   └── ui/                # Reusable primitives — import from 'components/ui'
│       ├── Button/        # Polymorphic button/anchor — variant (solid|outline|ghost|glass), size (sm|md|lg), shape (pill|square)
│       ├── Cascade/       # CascadeGroup + CascadeItem + CascadeContext (scroll/mount entrance animation)
│       ├── Dropdown/      # Accessible select w/ click-outside + Escape dismiss
│       ├── Eyebrow/       # Small uppercase label above headings (font-sans, GRAD 150)
│       ├── Heading/       # H1, H2, H3 display headings
│       ├── Pill/          # Tag/filter chip — active state, optional dismiss X
│       └── index.ts       # Barrel export for all ui components
├── data/                  # Typed data files (contributions.ts, testimonials.ts, instagram.ts)
├── hooks/                 # Custom hooks (useParallax.ts)
├── utils/                 # Utilities (htmlToCanvas.ts)
├── assets/                # Images, fonts, static files
├── App.tsx                # Root component — assembles sections in order
├── main.tsx               # React entry point
└── index.css              # Global CSS + Tailwind import + custom utilities
```

### UI Component conventions

- All components spread `...props` onto the root element and accept `className` for overrides.
- Headings default to `color: inherit` — set text color on the parent or via `className`.
- `Eyebrow` applies `fontVariationSettings: "'GRAD' 150"` for the optical weight effect used across the site.
- `Button` defaults to `solid` variant (off-black fill). Pass `className` to override colors for dark sections (e.g., `className="bg-white text-off-black hover:bg-off-white"`). Pass `href` to render as `<a>`. Two independent style axes:
  - `size` (`sm` | `md` | `lg`, default `md`) — controls text scale and padding.
  - `shape` (`pill` | `square`, default `pill`) — `pill` for text buttons (asymmetric horizontal padding); `square` for icon-only buttons (equal padding on all sides). Use `shape="square"` instead of the removed `size="icon"`.
  - Variants:
    - `solid` — off-black fill, white text (default)
    - `outline` — bordered, muted text
    - `ghost` — text-only, no border/fill
    - `glass` — frosted-glass style for dark/image backgrounds. Uses `.glass-blur` CSS class for `backdrop-filter: blur(12px)`. Default: `bg-white/10 border border-white/20 text-white`. Do not combine with Tailwind `backdrop-blur-*` utilities (they won't override the CSS class).
- `Dropdown` is light-theme by default; swap border/bg classes via `className` if needed in a dark section.
- `Pill` is a tag/filter chip. Set `active` for filled state, `onClick` for interactive use (adds `aria-pressed`), `onDismiss` for a dismissible badge with X icon. Handles `e.preventDefault()` + `e.stopPropagation()` internally — safe inside card links.
- `CascadeGroup` wraps a group of elements and fires when it enters the viewport (`react-intersection-observer`, `triggerOnce: true`). Use `mountOnly` for above-the-fold content (Header, Hero) — animates on mount instead of scroll. Accepts `threshold` (default `0.1`) and `stagger` (default `75ms`). Use `as` to render as any HTML element (e.g. `as="ul"`).
- `CascadeItem` wraps a single item inside a `CascadeGroup`. Reads `inView` from context and fades up (`opacity-0 translate-y-[6px]` → visible) with a delay of `Math.min(index, 7) * stagger`. Use `as="li"` inside `<ul>` grids to preserve semantic HTML. The stagger index caps at 7 so long lists don't wait seconds.
- Import from the barrel: `import { Button, H2, Eyebrow, Pill, CascadeGroup, CascadeItem } from '../ui'`

### CSS Utilities

- `.glass-blur` — defined in `src/index.css`. Applies `backdrop-filter: blur(12px)`. Under `prefers-reduced-motion`, the animation is suppressed and blur is applied statically. Used by `Button variant="glass"` and the Hero glass panel. Not a Tailwind utility — cannot be overridden with `backdrop-blur-*` classes.

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
npm run dev       # dev server at http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build locally
npm run lint      # ESLint
npx vercel dev    # run serverless fns (e.g. /api/contact) locally; needs RESEND_API_KEY in .env.local
```

## Design Principles

Inherited from the existing site and maintained going forward:

- **Content-first** — the work speaks; don't let chrome compete with it
- **Professional restraint** — no gratuitous animations or decorative noise
- **Scannable** — tech tags on project cards, clear section hierarchy
- **Light + dark** — system preference respected via Tailwind's `dark:` variant
- **Responsive** — mobile-first, 4xl max container width

## Sections

Order in `App.tsx`:
0. `Header` — fixed nav bar: icon (with echo animation on click) + cascading nav links ✓
1. `Hero` — name, title, brief tagline, CTAs, Three.js particle effects ✓
2. `Contributions` — filterable/sortable grid of work and projects ✓
3. `Testimonials` — two-column: context copy + auto-advancing carousel ✓
4. `Creative` — 4-col layout: editorial copy + 6-post Instagram photo grid (static data in `src/data/instagram.ts`) ✓
5. `Contact` — contact form ✓
6. `Footer` — social links, nav, copyright ✓
7. `Projects` — richer project cards with tech tags (planned)
8. `About` — professional background, expertise areas (planned)

## Deployment

Static site. Final target: **eric.sh** (hosting provider TBD). The `dist/` output from `npm run build` is what gets deployed. No server-side rendering required.

## Claude Commands

| Command | What it does |
|---|---|
| `/scaffold` | Scaffold a new page section or reusable UI component |
| `/contact` | Placeholder — Contact section implementation notes |
| `/chat` | Placeholder — Hero chat input wiring notes |
