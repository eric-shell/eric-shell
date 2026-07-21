Add an image to the responsive-image pipeline (AVIF/WebP variants + `<picture>` markup).

Use this when adding a new `<img>` to a section. Skip for decorative icons, SVGs, or images rendered tiny (< 200px on all viewports) — the overhead isn't worth it.

**Sources live in `assets-source/`, never in `public/`.** `public/` is copied into `dist/` verbatim by Vite, so anything placed there ships to every visitor — including full-resolution originals nobody ever links to. `assets-source/` is git-tracked (so the original is never lost) but outside the build's copy root. Only the generated `-{width}.{format}` variants belong in `public/`.

---

## 1. Add the source to the manifest

Drop the original file in `assets-source/<section>/<name>.<ext>`, then edit `scripts/responsive-images.config.mjs` and append an entry:

```js
{
  src: 'assets-source/<section>/<name>.<ext>',
  outDir: 'public/<section>',        // where the generated variants land — what the app actually references
  widths: [640, 1280, 1920],         // add 2560 for full-bleed backgrounds
  formats: ['avif', 'webp', '<ext>'], // keep the original format as fallback
}
```

**Width guidance:**
- Full-bleed backgrounds: `[640, 1280, 1920, 2560]`
- Half-column / right-side subjects: `[640, 1280, 1920]`
- Card thumbnails / grid images: `[320, 640, 960]`

**Format guidance:** always include `avif` + `webp`, then the source format (`jpg` or `png`) as fallback. Never include both `jpg` and `png`.

## 2. Generate variants

```bash
npm run images
```

Writes `{basename}-{width}.{format}` into `outDir`. Commit the generated variants (in `public/`) — the static host serves them directly, no build-time processing. Also commit the source in `assets-source/` so the original is never lost, but double-check it isn't reachable under `public/` — if `npm run build && find dist -iname '<name>.*'` turns up the raw original, something's wired to the wrong path.

## 3. Replace `<img>` with `<picture>`

```tsx
<picture>
  <source
    type="image/avif"
    srcSet="/path/name-640.avif 640w, /path/name-1280.avif 1280w, /path/name-1920.avif 1920w"
    sizes="<sizes attr>"
  />
  <source
    type="image/webp"
    srcSet="/path/name-640.webp 640w, /path/name-1280.webp 1280w, /path/name-1920.webp 1920w"
    sizes="<sizes attr>"
  />
  <img
    src="/path/name-1920.jpg"
    srcSet="/path/name-640.jpg 640w, /path/name-1280.jpg 1280w, /path/name-1920.jpg 1920w"
    sizes="<sizes attr>"
    alt="..."
    className="..."
  />
</picture>
```

**`sizes` guidance (tells the browser which width to pick):**
- Full-bleed: `sizes="100vw"`
- Half-column on lg+: `sizes="(max-width: 1024px) 100vw, 50vw"`
- Third-column grid: `sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"`
- 2-col/3-col responsive grid (e.g. Visuals posts): `sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 350px"`

### Grid images rendered by a shared component

When images come from a data array and are rendered by a reusable component (e.g. `Post`), derive the base path and extension from `imageUrl` rather than hard-coding paths. Store `imageUrl` as the full path including extension (`/posts/EJS06506.jpg`); the component splits it:

```tsx
const lastDot = post.imageUrl.lastIndexOf('.')
const base = post.imageUrl.slice(0, lastDot)  // "/posts/EJS06506"
const ext  = post.imageUrl.slice(lastDot + 1) // "jpg"

<picture>
  <source type="image/avif"
    srcSet={`${base}-320.avif 320w, ${base}-640.avif 640w, ${base}-960.avif 960w`}
    sizes={sizes} />
  <source type="image/webp"
    srcSet={`${base}-320.webp 320w, ${base}-640.webp 640w, ${base}-960.webp 960w`}
    sizes={sizes} />
  <img
    src={`${base}-640.${ext}`}
    srcSet={`${base}-320.${ext} 320w, ${base}-640.${ext} 640w, ${base}-960.${ext} 960w`}
    sizes={sizes}
    alt={...}
    loading="lazy"
    decoding="async"
  />
</picture>
```

See `src/components/ui/Post/Post.tsx` for the live example (Visuals section grid).

**`fetchpriority` + `loading`:**
- Above-the-fold LCP images → `fetchpriority="high"`, `loading="eager"` (default, omit)
- Below-the-fold images → `loading="lazy"`, `decoding="async"`

## 4. Verify

- `npm run build` passes
- Check DevTools → Network → filter "Img" on mobile viewport: confirm a `640.avif` loads, not the 1920 original
- `find dist -iname '<name>.<ext>'` should return nothing — only the `-{width}.{format}` variants should exist in the build output, never the raw source

## Notes

- `sharp` is a dev dep. The script runs locally; the deploy host never sees sharp.
- If a source image is replaced (same filename, new content), just rerun `npm run images` — it overwrites the variants in `outDir`.
- If a source is removed, delete its manifest entry, delete the file from `assets-source/`, and remove the generated `-{width}.{format}` files from `public/` by hand.
