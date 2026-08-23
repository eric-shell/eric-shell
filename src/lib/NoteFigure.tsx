/**
 * Widths every note screenshot is emitted at, and the single width the PNG
 * fallback is emitted at. Both must match `scripts/responsive-images.config.mjs`;
 * if they disagree the srcSet advertises a file that does not exist and the
 * browser quietly falls back to whichever candidate does.
 */
const NOTE_IMAGE_WIDTHS = [640, 960, 1280, 1920]
const NOTE_FALLBACK_WIDTH = 1280

/**
 * A screenshot in a note body, written as ordinary markdown:
 *
 *     ![What the ring looks like](/note-shots/insight-rings "Caption goes here.")
 *
 * The `src` is a BASE PATH under `/note-shots`, with no width and no extension.
 * Everything else is derived: AVIF and WebP srcSets across
 * `NOTE_IMAGE_WIDTHS`, plus one PNG as the `<img>` fallback. Writing the full
 * filename by hand would mean one width, one format, and a rename breaking
 * silently.
 *
 * NOT `/notes/`. That prefix belongs to the note route, which vercel.json
 * rewrites to `:slug.html`, so an image under it is requested as
 * `<file>.avif.html` and 404s. See the note in the image manifest.
 *
 * There is no PNG srcSet, only a single fallback `src`. A browser without both
 * AVIF and WebP does not need a choice of four widths, and the full PNG ladder
 * was three quarters of what a screenshot cost to store.
 *
 * Markdown already carries both things an accessible figure needs, so neither
 * is a custom syntax: the alt text is the alt text, and the title (the quoted
 * part) becomes the visible caption. They do different jobs and must not be
 * the same string. Alt describes what the image SHOWS for someone who cannot
 * see it; the caption says what it MEANS to someone looking at it. A caption
 * duplicated into alt is worse than no alt at all, because a screen reader
 * then reads the same sentence twice.
 *
 * An image with no alt at all is a build-time mistake, not a runtime one, so
 * this renders a visible marker rather than failing quietly.
 */
export default function NoteFigure({ src, alt, title }: { src?: string; alt?: string; title?: string }) {
  if (!src) return null
  const set = (ext: string) =>
    NOTE_IMAGE_WIDTHS.map(w => `${src}-${w}.${ext} ${w}w`).join(', ')

  return (
    <figure className="my-8">
      <picture>
        <source type="image/avif" srcSet={set('avif')} sizes={NOTE_IMAGE_SIZES} />
        <source type="image/webp" srcSet={set('webp')} sizes={NOTE_IMAGE_SIZES} />
        <img
          src={`${src}-${NOTE_FALLBACK_WIDTH}.png`}
          alt={alt ?? ''}
          // Screenshots are captured at a fixed aspect and the box is reserved
          // from it, so a note never reflows as its images arrive.
          loading="lazy"
          decoding="async"
          className="w-full rounded-lg border border-blue-950/10 bg-blue-50"
        />
      </picture>
      {title && (
        <figcaption className="mt-2.5 font-sans text-sm leading-relaxed text-blue-950/60">
          {title}
        </figcaption>
      )}
    </figure>
  )
}

/**
 * The note column is `max-w-2xl` (672px) and full-bleed below that, minus the
 * page gutter. Exact, for the reason the work grid's `sizes` had to be exact:
 * an overestimate pushes every device onto a larger candidate and can undo the
 * whole optimisation rather than degrading gracefully.
 */
const NOTE_IMAGE_SIZES = '(min-width: 720px) 672px, calc(100vw - 48px)'
