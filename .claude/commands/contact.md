# Contact Section

Implemented at `src/components/sections/Contact.tsx`. Positioned between Creative and Footer in `App.tsx`.

## Layout

Two-column desktop (stacks on mobile): heading/copy on the left, form on the right.

- **Left column** — Eyebrow "Say Hello" + H2 "Get in Touch" + subtext + `mailto:` email link
- **Right column** — contact form, or success confirmation card after submit

## Form fields

| Field | Type | Validation |
|---|---|---|
| Name | text | required, max 100 chars |
| Email | email | required, max 100 chars, regex validated |
| Message | textarea | required, min 10, max 2000 chars |

All fields show a character counter. Validation runs client-side on submit and surfaces errors in a red banner above the submit button.

## State

```ts
type SubmitStatus = 'idle' | 'success' | 'error'
```

- On success: form is replaced by a green confirmation card (same `CascadeItem` slot)
- On error: error message appears inline; form remains editable

## API

Posts to `/api/contact` — not yet wired up. Expects:

```json
{ "name": "...", "email": "...", "message": "..." }
```

**Backend target: Resend.** When implementing the handler, call `resend.emails.send(...)` with this payload.

## Styling

- Background: `bg-white` (differentiates from adjacent Creative `bg-off-white` and Footer `bg-black`)
- Input/textarea: `border border-off-black/20`, `rounded-lg`, focus ring via `focus:border-off-black/60`
- Submit: `Button` component, `solid` variant, `rightIcon={<Send />}`

## Animations

Both columns use `CascadeGroup` + `CascadeItem` (scroll-triggered, `threshold={0.15}` left / `threshold={0.1}` right) per CLAUDE.md requirements.

## Footer nav

`#contact` link was added to `CONNECT_LINKS` in `Footer.tsx`.

## Future: reCAPTCHA / spam protection

When wiring Resend, add reCAPTCHA v3 before the `fetch` call:

```ts
const token = await window.grecaptcha.execute(VITE_RECAPTCHA_SITE_KEY, { action: 'submit' })
// include token in POST body, verify server-side
```

Use `import.meta.env.VITE_RECAPTCHA_SITE_KEY` — never hardcode the key.
