/**
 * When each static page went live and when it last changed, ISO `YYYY-MM-DD`.
 *
 * One record per page, read in three places so they can never disagree:
 *   - the visible "Updated" line (the footer; the privacy masthead too),
 *   - the page's JSON-LD (`dateModified`, and `datePublished` or, for the
 *     resume's ProfilePage, `dateCreated`), injected by `pageDates()` in
 *     vite.config.ts in place of `__PAGE_UPDATED__` / `__PAGE_PUBLISHED__`,
 *   - its `<lastmod>` in the generated sitemap.
 *
 * Hand-declared rather than read from git. Vercel builds from a shallow clone,
 * and a date that moves on every typo fix tells a crawler nothing. Bump
 * `updated` when the page's content or layout changes in a way a reader would
 * notice; Google compares the visible date with the structured one and stops
 * trusting a page whose dates move without its content.
 *
 * `published` is the first commit of the page's HTML entry.
 *
 * Note pages are dated in src/data/notes.ts (`date`, and `updated` once an
 * entry is revised), and the notes index takes the newest of those.
 */
export const PAGES = {
  home: { file: 'index.html', published: '2026-04-21', updated: '2026-11-17' },
  resume: { file: 'resume.html', published: '2026-08-01', updated: '2026-11-17' },
  privacy: { file: 'privacy.html', published: '2026-08-01', updated: '2026-11-17' },
} as const

export type PageKey = keyof typeof PAGES
