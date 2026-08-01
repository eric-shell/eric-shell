// Manifest of source images that should be emitted as responsive variants.
// Sources live in assets-source/ (tracked in git, never shipped by Vite).
// Variants are written into outDir — the public/ path the app actually
// references via srcSet — as `{basename}-{width}.{format}`.
// Add new entries here and rerun `npm run images`.

// Widths beyond the source image's intrinsic width are skipped and warned
// about, rather than clamped into a file whose name overstates its width — the
// srcSet advertises that name, so a clamped variant makes the browser pick a
// candidate believing it has pixels it doesn't. Source dimensions:
//   background.jpg — 2048 x 1365
//   EJS01845.jpg   — 2048 x 1365
//   subject.png    — 1023 x 1066
//
// posts/ — camera exports, all larger than 960px on the short edge
//
// `quality` is optional and merges over the script's defaults
// ({ avif: 55, webp: 78, jpg: 80, png: 90 }). Only override it where the image
// is doing a job that doesn't need the default fidelity.

export default [
  {
    src: 'assets-source/hero/background.jpg',
    outDir: 'public/hero',
    widths: [640, 1280, 1920],
    formats: ['avif', 'webp', 'jpg'],
  },
  {
    // Full-bleed decorative background for the Contact section: aria-hidden,
    // under a radial gradient at 75% black and a grain overlay, and never
    // looked at directly. The default quality was spending 869K on an AVIF
    // whose detail is covered up — this is the one image on the site where
    // dropping fidelity costs nothing visible.
    //
    // 2560 is absent on purpose: the source is 2048 wide and cannot fill it.
    src: 'assets-source/contact/EJS01845.jpg',
    outDir: 'public/contact',
    widths: [640, 1280, 1920],
    formats: ['avif', 'webp', 'jpg'],
    quality: { avif: 40, webp: 68, jpg: 74 },
  },
  {
    // png here is only the <picture> fallback behind AVIF and WebP, so it is
    // quantised rather than lossless. See the note in generate-responsive-images
    // about `quality` being what enables that at all.
    src: 'assets-source/hero/subject.png',
    outDir: 'public/hero',
    widths: [512, 1024],
    formats: ['avif', 'webp', 'png'],
    quality: { png: 90 },
  },
  {
    src: 'assets-source/posts/AA2_8841.jpg',
    outDir: 'public/posts',
    widths: [320, 640, 960],
    formats: ['avif', 'webp', 'jpg'],
  },
  {
    src: 'assets-source/posts/EJS01205.jpg',
    outDir: 'public/posts',
    widths: [320, 640, 960],
    formats: ['avif', 'webp', 'jpg'],
  },
  {
    src: 'assets-source/posts/EJS01692.jpg',
    outDir: 'public/posts',
    widths: [320, 640, 960],
    formats: ['avif', 'webp', 'jpg'],
  },
  {
    src: 'assets-source/posts/EJS06506.jpg',
    outDir: 'public/posts',
    widths: [320, 640, 960],
    formats: ['avif', 'webp', 'jpg'],
  },
  {
    src: 'assets-source/posts/EJS08482.jpg',
    outDir: 'public/posts',
    widths: [320, 640, 960],
    formats: ['avif', 'webp', 'jpg'],
  },
  {
    src: 'assets-source/posts/EJS08874.jpg',
    outDir: 'public/posts',
    widths: [320, 640, 960],
    formats: ['avif', 'webp', 'jpg'],
  },
]
