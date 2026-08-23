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
  {
    // For `a-resume-that-prints`. The whole subject of that note is what the
    // page becomes on paper, which is invisible on screen by definition.
    name: 'resume-print',
    url: '/resume.html',
    media: 'print',
    // 816px is 8.5in at 96dpi, so the print rules see roughly the page width
    // they were written against rather than a desktop viewport.
    width: 816,
    height: 1056,
    fullPage: true,
    // No crop, so no padding: the paper's own margins are the framing, and
    // adding more would misrepresent how much white space the page has.
    pad: 0,
    settleMs: 1200,
  },
  {
    // For `truncating-a-uuid-from-the-middle`. The point is that the id is cut
    // in the middle rather than at the end, which you either see or you do not.
    name: 'crm-visitor-table',
    url: '/dashboard.html',
    stub: 'crm',
    // 1440, not 1280: the table only shows its full column set from `xl`, and
    // the id column sits beside the ones that give it context.
    width: 1440,
    height: 1400,
    clip: 'section[aria-labelledby="visitors-heading"] table',
    // Six rows, not all twenty-five. The full table is 3216px tall and reduces
    // to an illegible smear in a note's column; six is enough to show the id
    // format repeating and the flags varying.
    clipTo: 'section[aria-labelledby="visitors-heading"] tbody tr:nth-child(6)',
    // Past the stubs' deliberate 1200ms hold, or this photographs the skeleton.
    settleMs: 2400,
  },
]
