Reference for the shared UI primitives and variant system in `src/components/ui/`.

Load this when building or editing anything that renders a surface, button, chip, or panel. Prefer reusing these over hand-rolling Tailwind class soup.

---

## Variant system

Single source of truth: [src/components/ui/variants.ts](src/components/ui/variants.ts). Consumed by `Button`, `Panel`, and `Pill`.

```ts
type Variant =
  | 'darker'       // bg-black text-white
  | 'dark'         // bg-off-black text-white   (Button default)
  | 'light'        // bg-off-white text-off-black
  | 'lighter'      // bg-white text-off-black   (Panel default)
  | 'primary'      // bg-white text-blue — branded accent
  | 'ghost'        // text-off-black/60, no fill
  | 'glass-light'  // glass-blur + white/10 tint + white/20 border + text-white
  | 'glass-dark'   // glass-blur + off-black/20 tint + off-black/20 border + text-white
```

Each variant has two exported tokens:

- `SURFACE[variant]` — background + border + text color. Static surface styling.
- `SURFACE_HOVER[variant]` — hover transition (e.g. `hover:bg-off-black/90`). Opt-in; a Panel does not apply hover by default, Button always does.

Pick a variant by **intent + surrounding surface**, not by color name:

- Sits on a light section → `dark`, `light`, `lighter`, `primary`, or `ghost`.
- Sits on a dark section or image → `glass-light`, `glass-dark`, `darker`.
- Is the primary call-to-action → `primary` (white fill, blue text).
- Inactive chip / tag → `light`; active chip → `dark` (this is how `Pill` picks).

---

## Primitives

### Panel — [src/components/ui/Panel/Panel.tsx](src/components/ui/Panel/Panel.tsx)
Div-only wrapping container. Use for any surface (card, overlay, tile) that is **not** a button. Defaults to `variant="lighter"`. No default radius/padding — caller provides layout via `className`. If the surface needs to be clickable, wrap `<Panel>` in an `<a>` — Panel is not polymorphic.

```tsx
<a href={url} className="group block h-full">
  <Panel variant="lighter" className="flex flex-col gap-3 h-full p-5 rounded-xl border border-off-black/10 group-hover:border-off-black/30 group-hover:shadow-md transition">
    {/* card content */}
  </Panel>
</a>
```

For an absolute-positioned glass overlay inside an already-bordered container, strip the default glass border with `className="border-0"`.

### Button — [src/components/ui/Button/Button.tsx](src/components/ui/Button/Button.tsx)
Polymorphic (renders `<a>` when `href` is passed, else `<button>`). Props: `variant` (default `dark`), `size` (`sm|md|lg`, default `md`), `shape` (`pill|square`, default `pill`). Applies `SURFACE[variant]` + `SURFACE_HOVER[variant]` + size/shape padding. `shape="square"` is the icon-only form.

### Pill — [src/components/ui/Pill/Pill.tsx](src/components/ui/Pill/Pill.tsx)
Tag/filter chip. Active state uses `SURFACE.dark`, inactive uses `SURFACE.light` plus a muted-text override. Handles `e.preventDefault()` + `e.stopPropagation()` internally — safe to nest inside a parent link. `onDismiss` renders a trailing X.

---

## Rules

- **Never hand-roll `bg-off-black text-white` / `bg-white text-blue` / `glass-blur bg-white/10 border-white/20` on a button, panel, or pill.** Use the variant. If a needed color combo doesn't exist as a variant, add it to `variants.ts` rather than inlining at the call site.
- `twMerge` is the composition tool — it lets `className` override variant classes cleanly.
- `glass-blur` is a Tailwind v4 `@utility` in [src/index.css](src/index.css), not a Tailwind core class. Do not replace it with `backdrop-blur-*`.
- Do **not** revive a `Card` component. It was deliberately removed in favor of `<a>` + `Panel` composition. Section-level card markup lives inline (see [Work.tsx](src/components/sections/Work/Work.tsx)).

---

## Adding a new variant

1. Add the name to the `Variant` union in `variants.ts`.
2. Add a `SURFACE` entry (bg + border + text).
3. Add a `SURFACE_HOVER` entry (omit hover transition? still add an empty-ish string to satisfy `Record<Variant, string>`).
4. TypeScript will surface every consumer that needs to handle the new case if you ever switch from maps to a `switch` — today the Record ensures exhaustiveness on write, and any existing consumer automatically gains access to the new variant.
