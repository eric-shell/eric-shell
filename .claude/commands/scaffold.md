Scaffold a new page section or reusable UI component.

The user will specify what to create. Detect intent from the name or context:
- **Page section**: a full-width block on the home page or an inner route (e.g. "About", "Projects").
- **UI component**: a reusable primitive in `src/components/ui/` (e.g. "Badge", "Modal").

Run `/ui` first. The UI system is closed: colours, radii and shadows are tokens, surfaces are variants, and `tests/ui-vocabulary.test.ts` plus ESLint fail on anything hand-rolled. Scaffold from the primitives below, not from classes.

---

## Page section

Create a directory, `src/components/sections/<Name>/`, with the component and a barrel:

```tsx
// src/components/sections/<Name>/<Name>.tsx
import { CascadeGroup, CascadeItem, Container, Lead, Section, SectionTitle, descDelay } from '../../ui'

export default function <Name>() {
  return (
    <Section id="<id>" tone="white">
      <Container>
        <SectionTitle eyebrow="<Eyebrow>" title="<Title>" eyebrowClassName="text-lum-deep">
          <CascadeItem delayMs={descDelay(0)}>
            <Lead className="max-w-3xl pt-8 text-ink-soft">{/* what this section is */}</Lead>
          </CascadeItem>
        </SectionTitle>

        <CascadeGroup className="pt-12" threshold={0.1}>
          <CascadeItem index={0}>{/* body */}</CascadeItem>
        </CascadeGroup>
      </Container>
    </Section>
  )
}
```

```ts
// src/components/sections/<Name>/index.ts
export { default } from './<Name>'
```

Then export it from `src/components/sections/index.ts` and add it to the stack in `src/App.tsx`, wrapped like its neighbours:

```tsx
<ErrorBoundary name="<Name>"><<Name> /></ErrorBoundary>
```

**Choosing the field.** `tone` is `lum`, `ink` or `white`. It sets the background, the text colour and the focus-ring colour, and it decides the rest:

| Field | Eyebrow colour | Main button | Second button | Body copy |
|---|---|---|---|---|
| `lum` | `text-white` | `white` | `tint-white` | inherits white |
| `ink` | `text-glow` | `luminous` | `tint-ink` | inherits white |
| `white` | `text-lum-deep` | `luminous` | `outline` | `text-ink-soft` |

**Naming:** PascalCase directory and file, lowercase kebab-case `id`. Every section needs an `id`: telemetry attributes link clicks to `section[id]`.

**Header (required):** every section header is a `SectionTitle`. Do not build an eyebrow and heading by hand, and do not invent a per-section entrance.

**Cascade wiring (required):**
- `SectionTitle` is its own `CascadeGroup`; description items inside it take `delayMs={descDelay(n)}`.
- Each further visual block (body copy, card grid, controls) gets its own `CascadeGroup`, with `CascadeItem`s on ascending `index`.
- Grids: `CascadeGroup as="ul"` on the grid, `CascadeItem as="li" index={i}` per item.
- Thresholds: `0.15` headers (the `SectionTitle` default), `0.1` body copy, `0.05` dense grids.
- A Suspense boundary must not sit under a `CascadeGroup` unless everything inside it has loaded. See Prerendering in CLAUDE.md.

**Patterns that already exist. Use them:**
- A head beside its content (4/12 to 8/12): `grid-split gap-8 lg:gap-20` on the wrapper, `<SectionTitle size="compact" sticky>` on the left.
- A grid of cards: `Card` (see `/ui` for its props).
- A filterable grid: `FilterBar` plus `useTagFilter`.
- A sheet rising over the section above: `Sheet`.

**An inner route** (its own URL) is more than a section. It opens with `<Page tone>`, a `PageHero` holding `<SectionTitle as="h1" mountOnly>`, and a `<Sheet tone="white">` for the body, and it needs the five things listed under "Routes & Sections" in CLAUDE.md (HTML entry, Vite input, rewrite, `getRoute()` case, sitemap entry). Model it on `Privacy.tsx`.

**Prerendering:** the section is rendered to HTML at build time. Nothing it renders may read `window`, `localStorage`, `matchMedia` or the clock during render; gate those on `useHydrated()`.

---

## UI component

Create `src/components/ui/<Name>/<Name>.tsx` with a barrel beside it, and a story:

```tsx
// src/components/ui/<Name>/<Name>.tsx
import type { HTMLAttributes } from 'react'
import { cn } from '../cn'

interface <Name>Props extends HTMLAttributes<HTMLDivElement> {
  // props here
}

export default function <Name>({ className, children, ...props }: <Name>Props) {
  return (
    <div className={cn('<base classes>', className)} {...props}>
      {children}
    </div>
  )
}
```

```ts
// src/components/ui/<Name>/index.ts
export { default } from './<Name>'
```

- Typed props, default export. Spread `...props` onto the root and merge `className` with `cn` (never `tailwind-merge` directly).
- Export it from the barrel, `src/components/ui/index.ts`.
- If it paints a surface, take a `variant` and read it from `variants.ts`, or compose `Panel`. Do not spell out `bg-* text-* border-*`.
- If it needs a value that is not a token, add the token to `@theme` in `src/index.css` and to `cn.ts`. A bespoke effect is an `@utility` there.
- If it sits on a field, it must work on that field's focus ring: white surfaces inside a field take `focus-on-paper`.
- A file that exports a component may export only components (the fast-refresh lint rule). Put shared constants in a sibling `.ts` file, and mind that the filesystem is case-insensitive: `Thing.tsx` and `thing.ts` collide.
- Add `<Name>.stories.tsx`. Show it on each field it is meant for.
- Add a section to `.claude/commands/ui.md`.
- Keep it minimal: no placeholder logic beyond what the user specifies.

---

## Before finishing

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

The build must end with `prerendered N documents`.
