---
paths:
  - "src/components/sections/**"
  - "src/components/layout/**"
  - "src/App.tsx"
  - "src/hooks/**"
  - "src/data/work.ts"
  - "src/data/testimonials.ts"
  - "src/data/instagram.ts"
---
# Sections, layout and the home page

### Scroll animation requirements

**Every section must use `CascadeGroup` + `CascadeItem`.** This is not optional — it is the standard entrance animation for all page sections.

Pattern:
1. Wrap each distinct visual block (heading row, body copy, card grid, controls) in its own `CascadeGroup`.
2. Each block inside a group gets a `CascadeItem` with an ascending `index` (0, 1, 2…).
3. Card/item grids: use `CascadeGroup as="ul"` on the grid container and `CascadeItem as="li" index={i}` per card.
4. Above-the-fold (Header, Hero): use `CascadeGroup mountOnly` instead of scroll trigger.
5. Threshold guidance: `0.15` for headers, `0.1` for body copy, `0.05` for dense grids.
6. `threshold` is a fraction of the *group*, so a tall group can ask for more than a screen holds and never fire (the notes list, 12,700px on a phone, was invisible on a 548px viewport). `CascadeGroup` measures itself and caps the ask at a quarter of the viewport (`MAX_VIEWPORT_SHARE`) — don't remove the cap, and don't work around it with a per-section `threshold={0}`.

### Home page

Home section order in `App.tsx`:
1. `Hero` — duotone poster: forest in Luminous Blue, full-width RiseText wordmark *behind* the subject cutout plus an outlined copy in front of it, cyan particles, CTAs, white chat card. Layering is by z-index across siblings, so the wordmark must stay outside any `CascadeItem` (its transform is a stacking context) ✓
2. `Work` — blue sheet rising over the hero, four stats counted from `work.ts`, sort + tag filter, type-only cards in a wave grid (`useWaveGrid`) ✓
3. `Testimonials` — white field, segmented progress, quote words rise in and a highlighter sweeps `highlight` (must be an exact substring — `tests/testimonials.test.ts`) ✓
4. `Visuals` — Instagram accordion; ≥1024px with motion it is pinned and opens with a scroll-driven zoom from full screen into the open slice. Decided after hydration, so the prerender is always the plain accordion ✓
5. `Contact` — solid blue field, white contact card ✓

- **Every particle canvas runs through `visibleRafLoop`** ([src/components/sections/Hero/visibleRafLoop.ts](src/components/sections/Hero/visibleRafLoop.ts)) and paints only while it is on screen. The homepage mounts two of them (the Hero's `ParticlesSmall` + `ParticlesLarge`; Contact had two more until the Luminous redesign), and the cost is fill rate, not particle count: a full-viewport `clearRect` plus additive `lighter` blending at up to 2x DPR, with Large's sprites drawn at ~half the viewport width. rAF stops itself in a background *tab*; nothing stops it for a canvas merely scrolled past. Verified at 0 draws when scrolled away.
- **Both sims are delta-timed.** `visibleRafLoop` hands `frame` a delta in 60fps units (1 at 60Hz, ~0.5 at 120Hz) and every per-frame increment in the tick functions is multiplied by it. They were fixed-step and therefore ran at literally double speed on a 120Hz display. Two guards make delta-time safe to pause, and removing either reintroduces a real bug: `MAX_DELTA` caps a step at 3 frames so a stalled tab or a slept machine can't teleport every particle, and `last` is re-baselined on every `start()` so the first frame after an off-screen pause is charged as one frame rather than the whole time spent scrolled away. Verified refresh-rate independent at 60/120/144Hz.
- **The work grid's `ItemList` JSON-LD is generated at build time** by the `workSchema()` plugin in `vite.config.ts`, from `src/data/work.ts`, into `index.html` only. Hand-copying 39 entries into the HTML would be stale within a release, and a stale ItemList is worse than none. It deliberately omits `image` (the cards hotlink Unsplash stock that has nothing to do with the projects — asserting that as a project's image tells a crawler something false) and uses `contributor` rather than `author` (client and agency work; Eric contributed front-end architecture, he did not author these properties). Add `image` back when the cards carry real screenshots.
- **Work cards are type-only since the Luminous redesign** — the grid passes no `image`, so the Unsplash stock is no longer requested. The helpers below still exist in `work.ts` for whenever real screenshots arrive; the notes stand for that day.
- **Work card images were responsive off Unsplash's own CDN.** `WorkItem.image` holds a photo *id*, not a URL; `workImageSrc` / `workImageSrcSet` / `WORK_IMAGE_SIZES` in [work.ts](src/data/work.ts) derive the rest, and `Card` stays generic via `imageSrcSet` / `imageSizes` props. Before this every device downloaded a flat `w=800` into a 339px slot. 1x displays now transfer 68–76% less; **no device transfers more**, which is a property two things enforce and both are easy to break:
  - **`sizes` must be exact, `calc()` and all.** Plain `50vw` ignores Container's 48px padding and the 12px grid gaps — at 834px it claims 417px for a 387px card, and that 8% overestimate was enough to push tablets onto a bigger candidate and make them *worse* than before the srcSet existed. An inaccurate `sizes` doesn't degrade gracefully, it inverts the optimisation. Keep it in step with Work.tsx's `grid-cols-*` chain.
  - **`CARD_WIDTHS` is capped at 800.** A 3x phone wants 936px and will take a 1024 candidate — 51% more than the old flat `w=800`, on the most likely-metered device class. These are decorative thumbnails. Don't extend the ladder without re-measuring high-DPI mobile.

### Header

- **The logo easter-egg sound is constructed on first play, not on import.** It was a module-scope `new Audio()` pointing at a 750KB WAV — the largest asset on the page, downloaded on every route, for a joke that fires on clicking an already-active nav item. Now 16KB AAC, fetched on first trigger. Don't move the construction back to module scope.
