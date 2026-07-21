Reference for the shared UI primitives and variant system in `src/components/ui/`.

Load this when building or editing anything that renders a surface, button, chip, or panel. Prefer reusing these over hand-rolling Tailwind class soup.

---

## Variant system

Single source of truth: [src/components/ui/variants.ts](src/components/ui/variants.ts). Consumed by `Button`, `Panel`, and `Pill`.

```ts
type Variant =
  | 'primary'       // blue gradient fill (blue-600 → blue-700), white text — the CTA / active-pill fill
  | 'secondary'     // white → blue-50 gradient, blue-800 text          (Button + Panel default)
  | 'ghost'         // no fill, blue-950/60 text — minimal/tertiary actions
  | 'glass-light'   // glass-blur + white/10 tint + white/20 border + white text — dark/photo sections
  | 'glass-dark'    // glass-blur + blue-950/20 tint + blue-950/20 border + white text — dark/photo sections needing more contrast
  | 'error-glass'   // glass-blur + red-950/85 tint + red-400/50 border + white text  (Toast error state)
  | 'success-glass' // glass-blur + green-950/85 tint + green-400/50 border + white text (Toast success state)
  | 'white'         // solid white, blue-950/10 border, blue-950 text — Card, inactive Pill
```

Each variant has two exported tokens:

- `SURFACE[variant]` — background + border + text color. Static surface styling.
- `SURFACE_HOVER[variant]` — hover transition (e.g. `hover:from-blue-800 hover:to-blue-900`). Opt-in; a Panel does not apply hover by default, Button always does.

Pick a variant by **intent + surrounding surface**, not by color name:

- Sits on a light section → `secondary`, `ghost`, `white`, or `primary` for the CTA.
- Sits on a dark section or image → `glass-light` or `glass-dark`.
- Is the primary call-to-action → `primary` (blue gradient fill).
- Inactive chip / tag → `white`; active chip → `primary` (this is how `Pill` picks).
- Toast feedback → `error-glass` / `success-glass` (and plain `glass-*` for info).

---

## Primitives

### Panel — [src/components/ui/Panel/Panel.tsx](src/components/ui/Panel/Panel.tsx)
Div-only wrapping container. Use for any surface (card, overlay, tile) that is **not** a button. Defaults to `variant="secondary"`. No default radius/padding — caller provides layout via `className`. If the surface needs to be clickable, wrap `<Panel>` in an `<a>` — Panel is not polymorphic. (`Card`, below, is the packaged version of exactly this pattern — reach for it first before hand-rolling a new `<a><Panel>...` card.)

```tsx
<a href={url} className="group block h-full">
  <Panel variant="white" className="flex flex-col gap-3 h-full p-5 rounded-xl border border-blue-950/10 group-hover:border-blue-400/40 group-hover:shadow-md transition">
    {/* card content */}
  </Panel>
</a>
```

For an absolute-positioned glass overlay inside an already-bordered container, strip the default glass border with `className="border-0"`.

### Card — [src/components/ui/Card/Card.tsx](src/components/ui/Card/Card.tsx)
Realized `<a>` + `Panel(variant="white")` + `Pill` composition for project/work-grid cards — renders the whole card as a single anchor. Props: `href`, `title`, `description`, `image?`, `tags?`, `activeTags?`, `onTagClick?`, `target?`, `rel?`. Currently used by [Work.tsx](src/components/sections/Work/Work.tsx) for the project grid; reach for it any time you need an image + title + description + tag-pill card rather than composing Panel/Pill by hand.

### Backdrop — [src/components/ui/Backdrop/Backdrop.tsx](src/components/ui/Backdrop/Backdrop.tsx)
Ambient section background: slow-drifting, hue-shifting radial gradient blobs plus an SVG film-grain layer. Render it as the first child of a `relative` section, before `Container`. It is `aria-hidden`, `pointer-events-none`, and self-clipping (`absolute inset-0 overflow-hidden`).

- `tone="light"` — cyan/blue/violet blobs for light sections (Work, Visuals).
- `tone="dark"` — indigo/violet/cyan blobs for dark sections (Testimonials).
- `tone="photo"` — grain only, for sections with photographic backgrounds (Hero, Contact); pass a `z-*` class to sit above the scrim but below content.
- `flip` — mirrors the blob layout so adjacent same-tone sections don't look identical.

Motion comes from the `animate-ambient-*` utilities in [src/index.css](src/index.css): transform-only drift keyframes (26/34/42s, never in sync) plus a 48s `hue-rotate` sweep on the blob layer. All of it is frozen under `prefers-reduced-motion` (blobs stay, statically). Blobs must be positioned with inset classes only — the drift animation owns `transform`, so `translate-*` classes on a blob are silently discarded.

Grain utilities (also in `index.css`, sharing the `--noise-img` data-URI):

- `bg-noise` — tiles the grain as a background; combine with `absolute inset-0`, an opacity, and a blend mode.
- `noise-overlay` — adds grain as an `::after` film over a panel surface (used by `Card` and the Chat glass panel). Does **not** set `position`; the element must already be positioned (`relative`/`absolute`) and the overlay inherits its border-radius.

### Button — [src/components/ui/Button/Button.tsx](src/components/ui/Button/Button.tsx)
Polymorphic (renders `<a>` when `href` is passed, else `<button>`). Props: `variant` (default `secondary`), `size` (`sm|md|lg`, default `md`), `shape` (`pill|square`, default `pill`). Applies `SURFACE[variant]` + `SURFACE_HOVER[variant]` + size/shape padding. `shape="square"` is the icon-only form.

### Pill — [src/components/ui/Pill/Pill.tsx](src/components/ui/Pill/Pill.tsx)
Tag/filter chip. Active state uses `SURFACE.primary`, inactive uses `SURFACE.white`. Handles `e.preventDefault()` + `e.stopPropagation()` internally — safe to nest inside a parent link. `onDismiss` renders a trailing X.

### Toast — [src/components/ui/Toast/](src/components/ui/Toast/)
Imperative toast queue, not variant-driven. Call `toast.success(message)` / `toast.error(message)` / `toast.info(message)` / `toast.dismiss(id)` from anywhere (`toastStore.ts`); mount `<Toaster />` once near the app root (already done in `App.tsx`) to render the queue. Max 3 visible at once, identical messages within 1s are deduped, error toasts linger longer (7s vs 4s). Error/success visuals map to the `error-glass`/`success-glass` variants above.

### ContactForm — [src/components/ui/ContactForm/ContactForm.tsx](src/components/ui/ContactForm/ContactForm.tsx)
Standalone name/email/message form with client-side validation, `POST /api/contact`, and toast feedback on submit. Props: `defaultTheme` (`'white' | 'dark'`, default `'dark'`), `showThemeToggle`, `onSuccess?`, `className?`. Used by the `Contact` section — pull this in directly rather than rebuilding form state/validation at a new call site.

### Post — [src/components/ui/Post/Post.tsx](src/components/ui/Post/Post.tsx)
Single Instagram-grid tile: `<picture>` with avif/webp/jpg srcSet at 320/640/960w, an LQIP blur-up placeholder from `src/data/lqip.ts`, and a caption reveal on hover. Takes one `InstagramPost` (from `src/data/instagram.ts`). Not variant-driven — image-specific, used only by `Visuals`.

### ErrorBoundary — [src/components/ui/ErrorBoundary/ErrorBoundary.tsx](src/components/ui/ErrorBoundary/ErrorBoundary.tsx)
Class-component error boundary. Props: `name` (required — labels the console log and the `section_error` analytics event so a crash is identifiable), `fallback?` (rendered in place of children once caught; defaults to `null`). `App.tsx` wraps each home section individually so one section crashing can't take down the rest of the page.

### Colors — [src/components/ui/Colors/Colors.stories.tsx](src/components/ui/Colors/Colors.stories.tsx)
Storybook-only palette reference (blue-50 → blue-950 scale + white/black swatches with OKLCH values). Not exported from the barrel — it's documentation, not a component to import.

---

## Rules

- **Never hand-roll surface color classes** (`bg-blue-950 text-white`, `bg-gradient-to-br from-blue-600 to-blue-700`, `glass-blur bg-white/10 border-white/20`, etc.) **at call sites on a button, panel, or pill.** Use the variant. If a needed color combo doesn't exist as a variant, add it to `variants.ts` rather than inlining at the call site.
- `twMerge` is the composition tool — it lets `className` override variant classes cleanly.
- `glass-blur` is a Tailwind v4 `@utility` in [src/index.css](src/index.css), not a Tailwind core class. Do not replace it with `backdrop-blur-*`.
- Prefer `Card` over hand-rolling a new `<a><Panel>...</Panel></a>` composition for grid cards — it already encodes the image/title/description/tag-pill layout.

---

## Adding a new variant

1. Add the name to the `Variant` union in `variants.ts`.
2. Add a `SURFACE` entry (bg + border + text).
3. Add a `SURFACE_HOVER` entry (omit hover transition? still add an empty-ish string to satisfy `Record<Variant, string>`).
4. TypeScript will surface every consumer that needs to handle the new case if you ever switch from maps to a `switch` — today the Record ensures exhaustiveness on write, and any existing consumer automatically gains access to the new variant.
