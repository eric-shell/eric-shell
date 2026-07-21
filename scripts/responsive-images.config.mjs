// Manifest of source images that should be emitted as responsive variants.
// Sources live in assets-source/ (tracked in git, never shipped by Vite).
// Variants are written into outDir — the public/ path the app actually
// references via srcSet — as `{basename}-{width}.{format}`.
// Add new entries here and rerun `npm run images`.

// Widths beyond the source image's intrinsic width are skipped (would just
// re-encode the same pixels into a bigger file). Source dimensions:
//   background.jpg — 2048 x 1365
//   subject.png    — 1023 x 1066
//
// posts/ — camera exports, all larger than 960px on the short edge

export default [
  {
    src: 'assets-source/hero/background.jpg',
    outDir: 'public/hero',
    widths: [640, 1280, 1920],
    formats: ['avif', 'webp', 'jpg'],
  },
  {
    src: 'assets-source/contact/EJS01845.jpg',
    outDir: 'public/contact',
    widths: [640, 1280, 1920, 2560],
    formats: ['avif', 'webp', 'jpg'],
  },
  {
    src: 'assets-source/hero/subject.png',
    outDir: 'public/hero',
    widths: [512, 1024],
    formats: ['avif', 'webp', 'png'],
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
