// Screenshots that appear in notes entries.
//
// Each entry is captured by `npm run shots` into assets-source/notes/<name>.png
// and then emitted as responsive variants into public/note-shots/ by
// `npm run images`, which picks this directory up automatically.
//
// A note references one by BASE PATH, with no width and no extension:
//
//     ![Alt text](/note-shots/<name> "Caption.")
//
// (never /notes/, which the note route itself owns and rewrites to .html)
// so `name` is a live URL fragment. Renaming one silently breaks the srcSet in
// whatever note points at it, exactly like renaming a slug. Add a new entry
// rather than renaming an old one.
//
// `width` is the CSS viewport width the page is rendered at, not the width of
// the file: capture runs at deviceScaleFactor 2 and the variants come off that.
// Pick the width that shows the thing being written about, not the widest one
// available. A 1440px screenshot of a three-column grid reduced into a 672px
// column is unreadable, and an unreadable screenshot is worse than none.

export default [
  {
    name: 'insight-rings',
    // Served by `vite preview` off dist/, with the admin API stubbed in the
    // browser — see scripts/crm-stub.mjs. No database, no password.
    url: '/dashboard.html',
    stub: 'crm',
    // The insight grid only reaches its three-across layout at xl. Below that
    // the ring cards stack and the row this note is about does not exist.
    width: 1280,
    clip: 'section[aria-labelledby="insights-heading"]',
    // Just the first row of cards. The full panel is three rows deep, and
    // scaled into a note's 672px column the whole thing becomes a grey mosaic
    // nobody can read. The note is about the three rings, so the figure is the
    // three rings.
    clipTo: 'section[aria-labelledby="insights-heading"] .grid > :nth-child(3)',
    // Give the rings their 900ms draw-in plus the staggered delays before
    // photographing them, or the shot catches half-drawn arcs.
    settleMs: 2200,
  },
]
