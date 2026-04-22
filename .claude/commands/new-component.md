Scaffold a new reusable UI component.

The user will provide a component name (e.g. "Button", "Card", "Tag").

Create `src/components/ui/<Name>.tsx` with typed props and a default export. Keep it minimal — no placeholder logic beyond what the user specifies. Use Tailwind for styling.

Example structure:
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
