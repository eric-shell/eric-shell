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
│   ├── sections/   # Full-width page sections (Hero, Projects, About, Testimonials, Contact)
│   └── ui/         # Reusable primitives (Button, Card, Tag, etc.)
├── data/           # Typed data files (projects.ts, testimonials.ts, etc.)
├── assets/         # Images, fonts, static files
├── App.tsx         # Root component — assembles sections in order
├── main.tsx        # React entry point
└── index.css       # Global CSS + Tailwind import
```

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
