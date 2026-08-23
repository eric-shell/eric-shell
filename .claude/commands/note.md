# Notes — when to write one, and how

Reference for `/notes`, the changelog of engineering decisions at
[src/data/notes.ts](../../src/data/notes.ts). Read this before adding an entry.

## When a change earns a note

Write one when the change was **interesting or substantial**, and a stranger
who works on the web might get something out of reading it. The bar is roughly:
would this have saved someone else an afternoon?

Good candidates:

- A measurement that contradicted an assumption. Numbers before and after.
- A wrong turn taken and corrected, where the wrong turn was reasonable.
- A constraint that turned out to be arithmetic rather than taste.
- A fix whose obvious version made things worse.
- A platform behaviour that is genuinely surprising once you hit it.

Not candidates:

- Routine work. A dependency bump, a copy tweak, a refactor with no story.
- Anything unverifiable. No commit, no measurement, no note.
- Anything already covered. Check the existing 30-odd slugs first; a second
  note on the same idea dilutes both.

**Do not write a note just because a task finished.** Most changes do not need
one, and a section padded with filler stops being worth reading. When in doubt,
ask rather than assume.

## The rule that matters most

**Every entry must be checkable.** `commit` links a real SHA in the public repo,
and every number in the body is something that was measured, not estimated.
That verifiability is the entire reason the section exists. This means the
commit has to land *before* the note that cites it.

## Voice

Write like a person who has been doing this a while and is telling a colleague
what happened. Collected, specific, technical where the detail carries weight,
and never impressed with itself.

**No em dashes.** Not in `title`, `summary`, or `body`, and not in a caption.
Heavy em dash use is the single most recognisable tell of machine-written prose,
and a section whose whole value rests on these being genuinely Eric's cannot
afford to read as generated. Use a comma, a colon, parentheses, or two
sentences. A run of `—` in a diff on `notes.ts` is a bug.

Other things that make writing read as generated, all worth avoiding:

- Tricolons everywhere. Not every sentence needs three parallel clauses.
- "It's not just X, it's Y." Say what it is.
- Opening a paragraph by restating the heading above it.
- Hedging every claim into mush. If a number was measured, state it flat.
- Summarising at the end what was just said.

Do use: first person, past tense, contractions where they fall naturally,
specific numbers over adjectives. Name the thing that went wrong before the
thing that fixed it. It is fine to say something was embarrassing, or that the
first attempt was wrong, because that is usually the interesting part.

## Adding an entry

Append to `entries` in `notes.ts`. Do not hand-slot by date; `notes` is
`entries` sorted date-descending and the sort is stable.

That is the whole workflow. The HTML document, the Vite input, the sitemap line
and the JSON-LD are all generated from the array by `notesEntries()` in
`vite.config.ts`. Do not hand-write anything under `notes/` (gitignored, and
overwritten on the next build).

A slug is a live URL. Renaming one breaks every link that pointed at it. Add a
new entry instead.

## Screenshots

Notes with only prose are a wall of text. Most entries about something visual
should carry one image.

**1. Add the shot** to [scripts/notes-shots.config.mjs](../../scripts/notes-shots.config.mjs).
Pick the viewport width that shows the thing being written about, not the widest
one available; a 1440px grid squeezed into a 672px column is unreadable.

**2. Capture and encode:**

```bash
npm run build
npx vite preview --port 4173 &
npm run shots          # -> assets-source/notes/<name>.png at 2x
npm run images         # -> public/note-shots/ (AVIF + WebP at four widths, one PNG fallback)
```

The image manifest globs `assets-source/notes/`, so no second entry is needed
there. Both the source and the variants are committed, matching the rest of the
image pipeline.

**The public path is `/note-shots`, never `/notes`.** `vercel.json` rewrites
`/notes/:slug` to `/notes/:slug.html`, so an image served from under that prefix
is requested as `<file>.avif.html` and 404s. It does not fail under `vite
preview`, which applies no rewrites, so this only shows up on `vercel dev` and
in production.

**3. Reference it** from the body as ordinary markdown, with a base path
carrying no width and no extension:

```markdown
![Alt text goes here.](/note-shots/insight-rings "Caption goes here.")
```

`noteMdComponents` turns that into a `<figure>`: AVIF and WebP srcSets across
four widths, one PNG as the `<img>` fallback, lazy loading, and a
`<figcaption>`.

### Alt text and captions do different jobs

Getting this wrong is the most common accessibility mistake in a figure, so it
is worth being deliberate:

- **Alt** describes what the image *shows*, for someone who cannot see it. Be
  concrete about the content. Do not start with "Image of".
- **Caption** says what the image *means* to someone who is looking at it, and
  carries any context the picture cannot.

They must not be the same sentence. A caption duplicated into alt makes a
screen reader read it twice, which is worse than leaving alt empty.

**If the screenshot shows fixture data rather than real traffic, the caption has
to say so.** The section's value is that its claims can be checked, and a
picture of invented numbers presented as analytics quietly spends that.

## Fields

| Field | Notes |
|---|---|
| `slug` | Lowercase, hyphenated, permanent. |
| `title` | Sentence case. No em dash. Say the specific thing, not the category. |
| `date` | `YYYY-MM-DD`, matching the commit, not the day of writing. |
| `summary` | One sentence, under ~155 chars. Becomes the meta description, the OG description, the card blurb and the JSON-LD. |
| `tags` | Reuse the existing vocabulary before inventing a tag. Current set includes Performance, Telemetry, CRM, Accessibility, UX, React, Design, Deployment, CSS, Bundle size, Security, Privacy. |
| `commit` | Short SHA. Omit only if there genuinely is not one. |
| `body` | Markdown, rendered through `noteMdComponents`. `##` and `###` headings, fenced code, blockquotes, tables, images. |
