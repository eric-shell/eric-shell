Scaffold a new page section component.

The user will provide a section name (e.g. "Hero", "Projects", "About").

1. Create `src/components/sections/<Name>.tsx` with this structure:

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

2. Import and add it to `src/App.tsx` in logical document order.

Section naming convention: PascalCase file, lowercase kebab-case `id`.

### Cascade wiring notes
- Wrap the section's inner content groups in a `CascadeGroup` — it fires once when the group scrolls into view.
- Each distinct visual block (heading row, body copy, grid, controls) gets its own `CascadeItem` with an ascending `index`.
- For card/item grids, use `CascadeGroup as="ul"` and `CascadeItem as="li" index={i}` to preserve semantic HTML. Stagger index is capped at 7 internally so long lists stay snappy.
- Above-the-fold sections (Hero) use `CascadeGroup mountOnly` to animate on mount instead of scroll.
