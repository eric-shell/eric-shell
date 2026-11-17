---
paths:
  - "*.html"
  - "notes/**"
  - "vite.config.ts"
  - "vercel.json"
  - "public/**"
  - "src/data/pages.ts"
  - "scripts/generate-icons.mjs"
  - "scripts/generate-social.mjs"
  - "tests/seo.test.ts"
---
# Head tags, share image, icons

- **No `twitter:creator` / `twitter:site`** — there is no X/Twitter account in `navigation.ts` or the JSON-LD `sameAs`. Don't add one speculatively; the Twitter card works without it.
- **The share image is generated too.** `npm run social` ([scripts/generate-social.mjs](scripts/generate-social.mjs)) renders `public/social.jpg` (1200×630) in Chromium from the hero's own pieces: the duotone forest (the `duotone-lum` filter read from `index.css`), the cutout, the Display wordmark behind it with an outline in front, and `favicon.svg`. Run it after `npm run icons` if the icon changed. Its alt text is copied into five places (the four HTML entries and `noteDocument()`); `tests/seo.test.ts` fails if they differ. Platforms cache a card by URL, so after replacing it re-scrape with LinkedIn's Post Inspector or Facebook's Sharing Debugger.
- **The icon is generated, the SVG included.** `npm run icons` ([scripts/generate-icons.mjs](scripts/generate-icons.mjs)) builds `public/favicon.svg` (the white mark from `public/icon.svg` on a `lum` → `lum-deep` gradient, in a squircle), then rasterises it: `icon-192/512.png` (squircle, transparent corners), `icon-maskable-512.png` (full bleed, mark inside the 80% safe zone) and `apple-touch-icon.png` (full bleed, because iOS rounds the corners itself and fills transparent ones with black). Colours come from `@theme`, so don't hand-edit `favicon.svg`: change the token or the mark and re-run. `ink` (#0A1033) is the `theme-color` in every HTML entry, in `noteDocument()`, in the two static error pages and in `site.webmanifest`; `tests/ui-vocabulary.test.ts` fails if any of them drifts from the token.
