Scaffold a new page section or reusable UI component.

The user will specify what to create. Detect intent from the name or context:
- **Page section** — full-width block added to `App.tsx` (e.g. "About", "Projects", "Contact")
- **UI component** — reusable primitive added to `src/components/ui/` (e.g. "Card", "Badge", "Modal")

---

## Page Section

Create `src/components/sections/<Name>.tsx`:

```tsx
import { CascadeGroup, CascadeItem } from '../ui'

export default function <Name>() {
  return (
    <section id="<id>" className="py-24">
      <div className="max-w-[1440px] mx-auto px-6">
        <CascadeGroup threshold={0.15}>
          <CascadeItem index={0}>
            {/* heading / eyebrow block */}
          </CascadeItem>
          <CascadeItem index={1}>
            {/* body content */}
          </CascadeItem>
        </CascadeGroup>
      </div>
    </section>
  )
}
```

Then import and add it to `src/App.tsx` in logical document order.

**Naming:** PascalCase file, lowercase kebab-case `id`.

**Cascade wiring (required for every section):**
- Each distinct visual block (heading row, body copy, card grid, controls) gets its own `CascadeGroup`.
- Each block inside a group gets a `CascadeItem` with an ascending `index` (0, 1, 2…).
- Card/item grids: use `CascadeGroup as="ul"` on the grid and `CascadeItem as="li" index={i}` per card.
- Above-the-fold only (Hero): use `CascadeGroup mountOnly` instead of scroll trigger.
- Threshold guidance: `0.15` for headers, `0.1` for body copy, `0.05` for dense grids.

---

## UI Component

Create `src/components/ui/<Name>.tsx`:

```tsx
interface <Name>Props {
  // props here
}

export default function <Name>({ ...props }: <Name>Props) {
  return (
    // markup here
  )
}
```

- Typed props interface, default export, Tailwind for styling.
- Spread `...props` onto the root element and accept `className` for overrides.
- Export from the barrel in `src/components/ui/index.ts`.
- Keep it minimal — no placeholder logic beyond what the user specifies.
