---
paths:
  - "src/components/sections/Resume/**"
  - "src/components/ui/SectionTitle/**"
  - "src/components/ui/RiseText/**"
  - "src/data/resume.ts"
  - "src/data/resumeQr.ts"
  - "scripts/generate-qr.mjs"
  - "tests/resume.test.ts"
  - "src/index.css"
---
# The resume page and its print sheet

- **The resume's print sheet is keyed to class hooks, not structure** (`resume-hero`, `resume-masthead`, `resume-identity`, `resume-name`, `resume-headline`, `resume-contact`, `resume-qr`, `resume-footer`, `resume-section-title`, `entry-identity`, `entry-contracts`, `values-grid`, `credentials-grid`). Check a print preview after any change to `Resume.tsx` or `SectionTitle`: Chrome lays the printed page out wide enough to take `md:` classes, and it must stay one Letter sheet. `RiseText` prints its plain text, not its letters, so the PDF's text layer reads as words. The PDF is branded: a full-bleed `lum` masthead with white type and the white sheet rising over it. That band is a background fill, and it prints with "Background graphics" off only because of the sheet's `print-color-adjust: exact` (don't remove it, or the name prints white on white). The resume is on a named `@page resume` with no margin so the band can bleed; the paper margins are `--print-margin-x/-y` padding, and every other route keeps the default `@page` margins. The sheet is an editorial layout (Display section heads, an `ice` rail panel, the jobs on a `lum` timeline with dates in pills, a footer pinned to the foot of the page), and it fits with about 10px to spare: measure before adding anything to the print view, and condense copy (`summaryPrint`, `descriptionPrint`) rather than shrinking type. The masthead's contact block, QR code and the footer are print-only. **The QR is generated**: `src/data/resumeQr.ts` from `npm run qr` ([scripts/generate-qr.mjs](scripts/generate-qr.mjs)), as a colourless path the page inks with a token; `tests/resume.test.ts` fails if its URL stops matching `contact.site`.
