---
paths:
  - "scripts/responsive-images*"
  - "scripts/generate-responsive-images.mjs"
  - "scripts/generate-lqip.mjs"
  - "assets-source/**"
  - "src/data/lqip.ts"
---
# Responsive images

`npm run images` regenerates every variant from `assets-source/` per `scripts/responsive-images.config.mjs`.

- **A manifest entry may override quality** via an optional `quality: { avif, webp, jpg, png }` merged over the defaults (`{ avif: 55, webp: 78, jpg: 80, png: 90 }`). Only override where the image's job doesn't need the default fidelity — currently just the Contact background, which is `aria-hidden` under a 75%-black gradient and a grain layer.
- **`quality` on PNG is what enables palette quantisation at all.** Without it sharp encodes fully lossless and ignores the number: that is how `subject-1024.png` came to be 2.5MB for a file that only exists as the `<picture>` fallback behind AVIF and WebP. It is 438KB now, at 42.6dB PSNR over the opaque pixels.
- **A requested width above the source's is skipped with a warning, not clamped** (2% tolerance, so `subject.png`'s 1023-vs-1024 still emits). Clamping produced files whose *name* overstated their width — and the name is what the srcSet advertises, so browsers picked a 2048px `EJS01845-2560` believing it had 2560px. Dropping a width means editing the `srcSet` at the call site too.
- Run `npm run lqip` after adding Instagram posts.
