# eric.sh — Personal Portfolio

Personal portfolio website for Eric Shell. Successor to https://eric.sh/, which is where this project will eventually be hosted.

## Tech Stack

| Layer | Tool |
|---|---|
| Build | Vite |
| UI | React 18 + TypeScript |
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
│   ├── sections/   # Full-width page sections (Hero, Contributions, Testimonials, Footer)
│   └── ui/         # Reusable primitives — import from 'components/ui'
│       ├── Button.tsx    # Polymorphic button/anchor — variant (solid|outline|ghost), size (sm|md|icon), href for <a>
│       ├── Eyebrow.tsx   # Small uppercase label above headings (font-sans, GRAD 150)
│       ├── H1.tsx        # Display heading — text-7xl, font-display, uppercase
│       ├── H2.tsx        # Section heading — text-5xl, font-display, uppercase
│       ├── H3.tsx        # Sub-section heading — text-3xl, font-display, uppercase
│       ├── Dropdown.tsx  # Accessible select w/ click-outside + Escape dismiss
│       ├── Pill.tsx      # Tag/filter chip — active state, optional dismiss X, renders as <button> when onClick present
│       └── index.ts      # Barrel export for all ui components
├── data/           # Typed data files (projects.ts, testimonials.ts, etc.)
├── assets/         # Images, fonts, static files
├── App.tsx         # Root component — assembles sections in order
├── main.tsx        # React entry point
└── index.css       # Global CSS + Tailwind import
```

### UI Component conventions

- All components spread `...props` onto the root element and accept `className` for overrides.
- Headings default to `color: inherit` — set text color on the parent or via `className`.
- `Eyebrow` applies `fontVariationSettings: "'GRAD' 150"` for the optical weight effect used across the site.
- `Button` defaults to `solid` variant (off-black fill). Pass `className` to override colors for dark sections (e.g., `className="bg-white text-off-black hover:bg-off-white"`). Pass `href` to render as `<a>`.
- `Dropdown` is light-theme by default; swap border/bg classes via `className` if needed in a dark section.
- `Pill` is a tag/filter chip. Set `active` for filled state, `onClick` for interactive use (adds `aria-pressed`), `onDismiss` for a dismissible badge with X icon. Handles `e.preventDefault()` + `e.stopPropagation()` internally — safe inside card links.
- Import from the barrel: `import { Button, H2, Eyebrow, Pill } from '../ui'`

## Development

```bash
npm run dev       # dev server at http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build locally
npm run lint      # ESLint
```

## Design Principles

Inherited from the existing site and maintained going forward:

- **Content-first** — the work speaks; don't let chrome compete with it
- **Professional restraint** — no gratuitous animations or decorative noise
- **Scannable** — tech tags on project cards, clear section hierarchy
- **Light + dark** — system preference respected via Tailwind's `dark:` variant
- **Responsive** — mobile-first, 4xl max container width

## Planned Sections

Order in `App.tsx`:
1. `Hero` — name, title, brief tagline, CTAs
2. `Projects` — grid of project cards with tech tags
3. `About` — professional background, expertise areas
4. `Testimonials` — client/colleague endorsements
5. `Contact` / `Footer` — social links, email, resume download

## Deployment

Static site. Final target: **eric.sh** (hosting provider TBD). The `dist/` output from `npm run build` is what gets deployed. No server-side rendering required.

## Claude Commands

| Command | What it does |
|---|---|
| `/dev` | Start the Vite dev server |
| `/build` | Production build + preview |
| `/new-section` | Scaffold a new page section |
| `/new-component` | Scaffold a reusable UI component |
