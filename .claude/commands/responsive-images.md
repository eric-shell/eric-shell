Add an image to the responsive-image pipeline (AVIF/WebP variants + `<picture>` markup).

Use this when adding a new `<img>` to a section that references a source file in `public/`. Skip for decorative icons, SVGs, or images rendered tiny (< 200px on all viewports) — the overhead isn't worth it.

---

## 1. Add the source to the manifest

Edit `scripts/responsive-images.config.mjs`. Append an entry:

```js
{
  src: 'public/<section>/<name>.<ext>',
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

Writes `{basename}-{width}.{format}` next to each source. Commit the output — the static host serves them directly, no build-time processing.

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

**`fetchpriority` + `loading`:**
- Above-the-fold LCP images → `fetchpriority="high"`, `loading="eager"` (default, omit)
- Below-the-fold images → `loading="lazy"`, `decoding="async"`

## 4. Verify

- `npm run build` passes
- Check DevTools → Network → filter "Img" on mobile viewport: confirm a `640.avif` loads, not the 1920 original
- The original source file can stay on disk as documentation; it's no longer referenced by the app

## Notes

- `sharp` is a dev dep. The script runs locally; the deploy host never sees sharp.
- If a source image is replaced (same filename, new content), just rerun `npm run images` — it overwrites.
- If a source is removed, delete its manifest entry and remove the generated `-{width}.{format}` files by hand.
