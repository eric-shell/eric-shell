Scaffold a new page section component.

The user will provide a section name (e.g. "Hero", "Projects", "About").

1. Create `src/components/sections/<Name>.tsx` with this structure:

```tsx
export default function <Name>() {
  return (
    <section id="<id>" className="max-w-4xl mx-auto px-6 py-24">
      {/* TODO */}
    </section>
  )
}
```

2. Import and add it to `src/App.tsx` in logical document order.

Section naming convention: PascalCase file, lowercase kebab-case `id`.
