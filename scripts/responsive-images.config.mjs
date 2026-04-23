// Manifest of source images that should be emitted as responsive variants.
// Each entry's variants are written next to the source as `{basename}-{width}.{format}`.
// Add new entries here and rerun `npm run images`.

// Widths beyond the source image's intrinsic width are skipped (would just
// re-encode the same pixels into a bigger file). Source dimensions:
//   background.jpg — 2048 x 1365
//   subject.png    — 1023 x 1066

export default [
  {
    src: 'public/hero/background.jpg',
    widths: [640, 1280, 1920],
    formats: ['avif', 'webp', 'jpg'],
  },
  {
    src: 'public/hero/subject.png',
    widths: [512, 1024],
    formats: ['avif', 'webp', 'png'],
  },
]
