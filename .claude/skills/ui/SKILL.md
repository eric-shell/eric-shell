---
name: ui
description: "Reference for the UI system in src/components/ui: tokens, surface variants, every primitive, and the rules the tests enforce. Use before building or editing anything a visitor sees."
---
Reference for the UI system in `src/components/ui/`: the tokens, the surface variants, and the primitives.

Load this before building or editing anything a visitor sees. The system is closed on purpose: a colour, radius or shadow that is not a token does not compile, a surface that is not a variant does not typecheck, and `tests/ui-vocabulary.test.ts` fails on a hand-rolled value. Reach for what is here before writing classes.

---

## Tokens

All declared in the `@theme` block of [src/index.css](src/index.css). The block opens by clearing Tailwind's own colours and shadows (`--color-*: initial` and friends), so these are the only ones that exist.

| Kind | Tokens |
|---|---|
| Fields | `lum` (Luminous Blue, the site's one saturated colour), `ink` (dark field), `white`, `ice` (pale fill on white) |
| Text | `ink` (headings), `ink-soft` (body copy on white, 12.3:1), `ink-mute` (dates, captions, placeholders, 6.2:1), `lum-deep` (links and tags on white, 7.0:1) |
| Accent | `glow` (cyan). Non-text marks on `lum`; text only on `ink`. On `lum` it is under 4:1 |
| Status | `success`, `error` (button fills, each with `-hover`); `success-bright`, `error-bright`, `warning-bright` (text and marks on ink); `success-deep`, `error-deep` (notice fills) |
| Data | `data`, `data-deep`. Admin chart marks only. Never behind text |
| Radius | `rounded-tile` 10px, `rounded-media` 14px, `rounded-card` 22px, `rounded-composer` 28px, `rounded-sheet` 48px. Tailwind's scale covers the rest (`rounded-2xl` 16, `rounded-3xl` 24, `rounded-4xl` 32) |
| Shadow | `shadow-raised`, `shadow-popover`, `shadow-card`, `shadow-card-soft`, `shadow-float`, `shadow-capsule`, `shadow-drawer`, `shadow-beacon`; `inset-shadow-highlight(-strong)`; `text-shadow-poster(-strong)` |
| Type and motion | `tracking-display`, `tracking-label`, `ease-spring`, `ease-settle` |

Rules:

- **A new value goes in `@theme`, and in [cn.ts](src/components/ui/cn.ts).** `cn` is tailwind-merge taught these names; a token missing from it merges wrongly and silently (both classes survive). The test checks the two lists agree.
- **Use `cn`, never `tailwind-merge` directly.** ESLint refuses the import outside `cn.ts`.
- **A bespoke effect is an `@utility` in `index.css`, built from tokens** (`hero-scrim`, `card-glow`, `wordmark-outline`, `grid-split`, `sheet-widen`, `card-lift`). `index.css` is the only place raw CSS values live.
- **Sizes are free.** `text-[clamp(…)]`, `w-[7.75rem]`, `calc()` and opacity brackets (`bg-white/[0.055]`) are all fine. The test only refuses arbitrary colours, radii and shadows.
- **A real exception goes in [tests/ui-vocabulary.allowlist.ts](tests/ui-vocabulary.allowlist.ts) with a reason.** Today there is one: the particle canvas, which cannot take CSS variables.

### Focus rings

One ring for the whole site, drawn in `--focus-ring`. It defaults to `lum`, which is right on white and invisible on a blue field, so the field sets it: `focus-on-field` (white rings) on anything `lum` or `ink`, `focus-on-paper` (blue rings) on a white surface inside a field. `Section`, `Sheet`, `Card`, `Chat`, `ContactForm` and the dropdown panels apply these already. Do not write `focus-visible:outline-*` at a call site. `focus-ring-within` puts the ring on a card whose whole surface is one stretched link.

---

## Variants

Single source of truth: [src/components/ui/variants.ts](src/components/ui/variants.ts). `Button` and `Panel` take a **required** `variant`: no surface is right on every field, so the call site says which it means.

<!-- variants:start -->
| Variant | Looks like | Use it for |
|---|---|---|
| `luminous` | solid Luminous Blue, white label | the main action on white or ink |
| `white` | solid white, ink label, no border | the main action on a lum field; the fill of a card on a field |
| `outline` | white with an ink hairline | a white control or card sitting on white |
| `tint-white` | flat white tint, white label | the second action on a lum field |
| `tint-ink` | flat ink tint, white label | a quiet control on a lum field or inside a notice |
| `raised-dark` | faint white fill and border | a panel on the ink canvas (the admin) |
| `notice-error` | deep red fill, bright border | an error toast or inline error panel |
| `notice-success` | deep green fill, bright border | a success toast |
| `notice-info` | ink fill, glow border | an info toast |
| `success` | solid green, white label | a confirming action |
| `error` | solid red, white label | a destructive action |
<!-- variants:end -->

Pairing by field:

| Field | Main action | Second action | Surface |
|---|---|---|---|
| `lum` | `white` | `tint-white` | `white` (cards) |
| `ink` | `luminous` | `tint-ink` | `raised-dark` |
| white | `luminous` | `outline` | `outline` |

- The maps (`SURFACE`, `SURFACE_HOVER`, `SURFACE_ICON`, `SURFACE_ICON_HOVER`) are private to `components/ui`; ESLint refuses the import elsewhere. For the rare element that is neither a `Button` nor a `Panel` but must look like one (the admin's segmented control), use `surface(variant, { hover })` from the barrel.
- **Hover on a solid fill adds an inset edge** (a lit top line plus a hairline). `luminous` darkens to `lum-deep`, which alone is 2.4:1 against ink; the edge is what keeps it visible there. `success` and `error` hold their lightness and gain chroma instead, for the reason set out beside their tokens in `index.css`.
- **There is no glass.** Nothing uses `backdrop-filter`, and the test fails on it.

### Adding a variant

1. Add the name to the `Variant` union with a one-line doc comment saying which field it is for.
2. Add its entry to all four maps (they are `Record<Variant, string>`, so TypeScript insists).
3. Add its row to the table above. The test fails if the table and the union disagree.
4. Check the label and the boundary against the field it is meant for, and write the ratios in the comment.

---

## Layout primitives

### Section, Page — [Section.tsx](src/components/ui/Section/Section.tsx)
Every `<section>` and `<main>`. `Section` takes a required `tone` (`lum | ink | white | inherit`) and a `rhythm` (`section` py-24/36, `block` py-16/24, `tight` py-12/16, `none`). The tone sets the background, the text colour and the focus-ring colour. `inherit` is for a block inside a field that is already set (a document section on a `Sheet`). `as` changes the element (`as="footer"`). No `Container` inside: add one. `Page` is a route's `<main id="main">`. ESLint refuses a raw `<section>` or `<main>` in `sections/`, `layout/` and `App.tsx`.

### Sheet — [Sheet.tsx](src/components/ui/Sheet/Sheet.tsx)
A sheet rising over the field above with a rounded top. `tone="white"` under a `PageHero` on every inner route; `tone="lum" widen` is the home page's Work sheet, which starts at 90% width and widens as it scrolls in. With `widen` the colour is a separate layer (the widening is a `scaleX`); without it the element is the surface, so a document page's sections stay direct children, which the resume's print sheet depends on.

### PageHero — [PageHero.tsx](src/components/ui/PageHero/PageHero.tsx)
The opening `lum` field of an inner route, with a `Container`. Usually holds a `SectionTitle as="h1" mountOnly`. `containerClassName` lands on the container.

### SectionTitle — [SectionTitle.tsx](src/components/ui/SectionTitle/SectionTitle.tsx)
Every section header: eyebrow, a Display heading whose letters rise (`RiseText`), an optional `action`, then description `CascadeItem`s as children, all on one `CascadeGroup`. `as` (`h1 | h2`), `size` (`poster | compact`), `mountOnly`, `sticky` (stays in view beside a long section from `lg`). Time a description with `descDelay(n)`.

### grid-split (utility)
The 4/12 to 8/12 split of a section head beside its content, one column until `lg`. A utility, not a component: the three places that use it put the grid on three different elements. Supply the gap (`grid-split gap-8 lg:gap-20`).

### Container — [Container.tsx](src/components/ui/Container/Container.tsx)
1440px max width plus the 24px gutter.

---

## Type primitives

- **Heading** (`H1`, `H2`, `H3`): the Display face, uppercase, `tracking-display`. Colour inherits. A section's heading is a `SectionTitle`; `H3` is for sub-heads. ESLint refuses a raw `<h2>` / `<h3>` in sections.
- **Eyebrow**: the kicker above a section heading. Appears through `SectionTitle` (and once, by hand, in the Hero).
- **Lead** (`size: md | lg`): the paragraph after a heading that says what the page or section is. Type only; colour comes from the field, the call site sets `max-w-*`.
- **Label** (`as: span | p | dt | time`): the small uppercase label. A date on a card, a stat caption, a nav group heading, a count. Type only. On `lum` keep it white.
- **TextLink** (`tone: lum | field | inherit`): a link inside a sentence. `lum` in body copy on white, `field` on a lum or ink field, `inherit` in small print. A link that stands alone as an action is a `Button`.
- **Code**: an inline code chip.
- **RiseText**: a heading split into rising letters. Used by `SectionTitle`, the Hero wordmark and the menu. Kerning comes from `src/lib/displayKerning.ts` (generated; `npm run kerning`).

---

## Surfaces and controls

### Panel — [Panel.tsx](src/components/ui/Panel/Panel.tsx)
A `div` with a variant's surface. No radius or padding of its own.

### Button — [Button.tsx](src/components/ui/Button/Button.tsx)
Renders `<a>` when `href` is passed, else `<button>`. `variant` (required), `size` (`sm | md | lg`), `shape` (`pill | square`; `square` is the icon-only form), `leftIcon` / `rightIcon` (drawn on a tinted slab; `iconSlab={false}` to inline them). Icon size is set by the button (`icon-optical`), so `size={14}` on an icon inside one does nothing.

`as="span"` renders the look on a non-interactive `<span>`, for a button inside something that is already a link (a `Card`'s footer), where a real button would be a second control to the same place. Never for something clickable in its own right.

### Card — [Card.tsx](src/components/ui/Card/Card.tsx)
The white card: the Work grid, the notes index, the pager under a note. One stretched link on the title covers the card, so tag pills inside stay real buttons and the link's accessible name is the title (or `linkLabel`). Do not wrap a card in an `<a>`.

- `tone`: `field` (borderless, on `lum`) or `sheet` (hairline, on white).
- Title: `title`, `titleAs` (`h2 | h3 | span`), `display` for the Display face (a project name; not a sentence).
- Top row: `index` ("07") or `meta` (any node, e.g. a `<Label as="time">`), and `arrow` (`up-right | right | false`).
- `description`, `clampDescription`, `tags` / `activeTags` / `onTagClick`, `footer`.
- `bar` (`glow | lum`) and `barOrigin`: the colour bar that draws along the foot on hover.
- Inside a grid driven by `useWaveGrid` it also tilts toward the pointer. The hook finds cards by `data-card`.

### Pill — [Pill.tsx](src/components/ui/Pill/Pill.tsx)
Tag chip. Inactive is `outline`, active is `luminous`. With `onClick` it is a button (`aria-pressed`) and stops propagation itself. `onDismiss` adds an X.

### FilterBar + useTagFilter — [FilterBar.tsx](src/components/ui/FilterBar/FilterBar.tsx), [useTagFilter.ts](src/hooks/useTagFilter.ts)
Sort, tag filter, an `aria-live` count and Reset, for a filterable grid on a lum field. `useTagFilter({ section, defaultSort })` holds the state and reports the settled selection to telemetry. Used by Work and the notes index; a third filterable grid should use both rather than rebuild them. **Tag options are derived from the data, never hand-listed**: a hand-listed tag that no item carries filters to an empty grid.

### Dropdown — [Dropdown.tsx](src/components/ui/Dropdown/Dropdown.tsx)
Single-select listbox: `Button` trigger plus a portalled `<ul role="listbox">`, full keyboard nav (arrows, Home/End, Enter, Escape). `options`, `value`, `onChange(value)`, `placeholder`, `variant` (the trigger's; default `white`). Focus never enters the list: the trigger keeps it and uses `aria-activedescendant`, the list's `onMouseDown` prevents the default, and `selectAt` refocuses the trigger. Without those a mouse pick focuses an option that is about to unmount and drops focus on `<body>`.

### MultiSelect — [MultiSelect.tsx](src/components/ui/MultiSelect/MultiSelect.tsx)
`Dropdown`'s trigger, portal and keyboard model with a set-valued selection. `options`, `values`, `onChange(values)`, `placeholder` (also the accessible name), `searchable`, `searchPlaceholder`, `variant` (default `white`). Choosing an option does not close the panel; the trigger summarises as `First +N`, and a Clear row appears once anything is on. Things it does that `Dropdown` deliberately does not, all load-bearing:

- **Opens upward when there is more room above.** A 37-option list pinned below a trigger near the fold is unreachable.
- **Re-measures on scroll and resize.** `position: fixed` coordinates taken once go stale as soon as the page moves, and this panel stays open long enough for that.
- **`role="option"` sits on the `<li>`,** not on a `<button>` inside it. Focus never leaves the trigger (or the filter field), so an inner button only contributes a second, wrong accessibility tree.
- **`searchable` moves focus into the filter field,** which is why Space types a space there instead of toggling, and why Home/End are left to the caret. Pass it past about 15 options.
- **The Clear row refuses focus on mousedown.** It unmounts when it fires, and a focused element disappearing resets focus to `<body>`, outside the tree the key handler listens on, which kills Escape and the arrows.

### Input, Textarea — [Field/field.ts](src/components/ui/Field/field.ts)
Labelled fields sharing one set of styles. `tone`: `white` (default, on a white card) or `dark` (on ink, the admin sign-in). `valid`, `error`, `showCount`. Focus shows on the border, not the ring.

### Toast — [Toast/](src/components/ui/Toast/)
Imperative queue. `toast.success(message)` / `toast.error(message)` / `toast.info(message)` / `toast.dismiss(id)` from anywhere; `<Toaster />` is mounted once per app. Max 3 visible, identical messages within 1s are deduped, errors linger longer (7s vs 4s). Surfaces are the `notice-*` variants.

### Chat, ContactForm
The two white cards (`outline` panels) that open and close the home page. Both are client-only after hydration where they read browser state; see the Prerendering section of CLAUDE.md. Neither has a theme.

### SocialLink — [SocialLink.tsx](src/components/ui/SocialLink/SocialLink.tsx)
A round outlined link to a profile elsewhere. `tone` (`lum | ink`), `label`, `path` (from `socialLinks`).

### Markdown — [Markdown.tsx](src/components/ui/Markdown/Markdown.tsx)
The only component that renders react-markdown, loaded as its own chunk. Component maps live in [src/lib/markdown.tsx](src/lib/markdown.tsx), which imports `Code` and the link classes by path rather than through the barrel (the barrel exports `Markdown`, which imports that file).

### ErrorBoundary, Cascade
`ErrorBoundary` (`name` required) wraps each home section. `CascadeGroup` / `CascadeItem` are the scroll entrance every section uses; the rules are in CLAUDE.md.

---

## Rules

- **Name a surface, never spell it.** On a button, panel, pill or card, the colour comes from a variant. If no variant fits, add one.
- **A field is a `Section` or a `Sheet`.** Do not write `bg-lum text-white py-24` on an element.
- **Repeated type has a primitive.** A lead paragraph is a `Lead`, an uppercase label is a `Label`, an inline link is a `TextLink`.
- **A card is a `Card`.** Extend its props before composing `Panel` and `Pill` into a new one.
- **Do not reach around the guard.** If the test or the linter refuses something, the fix is a token, a primitive, or an allowlist entry with a reason, in that order.
- **Storybook**: every primitive has a story, and `Design System/Tokens` reads the palette out of `index.css` so it cannot go stale. Add a story with a new primitive.
