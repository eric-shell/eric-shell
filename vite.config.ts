import { defineConfig, type Plugin } from 'vite'
import { resolve, dirname } from 'node:path'
import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { workItems } from './src/data/work'
import { notes } from './src/data/notes'

const SITE = 'https://eric.sh'

/**
 * Emits the work grid as ItemList JSON-LD into index.html at build time.
 *
 * Generated rather than hand-written because there are 40 entries and they
 * change: a copy pasted into the HTML would be stale within a release, and a
 * stale ItemList is worse than none. Homepage only — the grid does not render
 * on /resume or /privacy, and claiming it there would be a lie.
 *
 * Two deliberate omissions:
 *
 *   image — the cards hotlink Unsplash stock that has nothing to do with the
 *   projects. Asserting a generic photo as the image of "Navy Federal" in
 *   structured data tells a search engine something false. Add it back when
 *   the cards carry real screenshots.
 *
 *   author — this is client and agency work; Eric contributed front-end
 *   architecture, he did not author these properties. `contributor` is the
 *   claim the portfolio actually makes.
 */
function workSchema(): Plugin {
  return {
    name: 'work-itemlist-schema',
    transformIndexHtml: {
      order: 'pre',
      handler(_html, ctx) {
        if (!ctx.filename.replace(/\\/g, '/').endsWith('/index.html')) return
        const ld = {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          '@id': 'https://eric.sh/#work',
          name: 'Selected work',
          numberOfItems: workItems.length,
          itemListOrder: 'https://schema.org/ItemListUnordered',
          itemListElement: workItems.map((w, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'CreativeWork',
              name: w.title,
              description: w.solution,
              url: w.url,
              keywords: w.tags.join(', '),
              contributor: { '@id': 'https://eric.sh/#person' },
            },
          })),
        }
        return {
          html: _html,
          tags: [{
            tag: 'script',
            attrs: { type: 'application/ld+json' },
            // `<` escaped so a title containing "</script>" can never break out.
            children: JSON.stringify(ld).replace(/</g, '\\u003c'),
            injectTo: 'head' as const,
          }],
        }
      },
    },
  }
}

/** Escapes a string for use inside a double-quoted HTML attribute. */
function attr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Writes only when the bytes differ.
 *
 * These files are produced while the config is being evaluated, which in dev is
 * before the watcher settles. Rewriting identical content on every restart
 * bumps mtimes, and a full-reload loop in `vite dev` is the result.
 */
function writeIfChanged(path: string, content: string) {
  try {
    if (readFileSync(path, 'utf8') === content) return
  } catch {
    // Missing file — fall through and write it.
  }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content, 'utf8')
}

/**
 * The full head for one note document.
 *
 * The other three routes hand-maintain their head tags, and CLAUDE.md calls
 * that a deliberate tradeoff: three files, change one and check all three. That
 * tradeoff does not survive contact with a list that grows every time something
 * is written, so this one is generated. Adding an entry to src/data/notes.ts is
 * the entire workflow.
 *
 * Loads the same /src/main.tsx as every other entry — App.tsx routes on
 * pathname, as it always has. The split exists so each note can serve its own
 * title, canonical, OG tags, and BlogPosting JSON-LD, which is the whole reason
 * per-entry URLs were worth building.
 */
function noteDocument(note: (typeof notes)[number]): string {
  const url = `${SITE}/notes/${note.slug}`
  const title = `${note.title} | Eric Shell`
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${url}#post`,
        url,
        mainEntityOfPage: url,
        headline: note.title,
        description: note.summary,
        datePublished: note.date,
        dateModified: note.date,
        keywords: note.tags.join(', '),
        inLanguage: 'en',
        isPartOf: { '@id': `${SITE}/notes#blog` },
        author: { '@id': `${SITE}/#person` },
        publisher: { '@id': `${SITE}/#person` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Notes', item: `${SITE}/notes` },
          { '@type': 'ListItem', position: 3, name: note.title },
        ],
      },
    ],
  }

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${attr(title)}</title>
    <meta name="description" content="${attr(note.summary)}" />
    <meta name="author" content="Eric Shell" />
    <link rel="canonical" href="${url}" />

    <!-- Open Graph -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${attr(title)}" />
    <meta property="og:description" content="${attr(note.summary)}" />
    <meta property="og:image" content="${SITE}/social.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Eric Shell, AI Design Systems Engineer" />
    <meta property="og:site_name" content="Eric Shell" />
    <meta property="article:published_time" content="${note.date}" />
    <meta property="article:author" content="Eric Shell" />
${note.tags.map((t) => `    <meta property="article:tag" content="${attr(t)}" />`).join('\n')}

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${url}" />
    <meta name="twitter:title" content="${attr(title)}" />
    <meta name="twitter:description" content="${attr(note.summary)}" />
    <meta name="twitter:image" content="${SITE}/social.jpg" />
    <meta name="twitter:image:alt" content="Eric Shell, AI Design Systems Engineer" />

    <!-- blue-950, the dark canvas every route opens on. -->
    <meta name="theme-color" content="#111521" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />

    <!-- See resume.html for why the Person node is referenced by @id, not redefined. -->
    <script type="application/ld+json">
${JSON.stringify(ld, null, 2).replace(/</g, '\\u003c')}
    </script>

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <!-- Version-pinned latin subset. See index.html for why this is preloaded
         rather than self-hosted, and how to refresh the URL. -->
    <link rel="preload" as="font" type="font/woff2" crossorigin
          href="https://fonts.gstatic.com/s/googlesans/v70/4UaRrENHsxJlGDuGo1OIlJfC6mGS6vhAK1YobMu2vgCIhM907w.woff2" />
    <link href="https://fonts.googleapis.com/css2?family=Google+Sans:GRAD,wght@-25..150,400..700&display=swap" rel="stylesheet" />
    <link rel="preload" href="/fonts/display.woff2" as="font" type="font/woff2" crossorigin />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
}

/**
 * Hand-declared lastmod for the routes whose content lives in components rather
 * than in a dated data file. Bump when the page's copy actually changes —
 * `/notes` is derived from the newest entry and needs no maintenance.
 */
const STATIC_ROUTES = [
  { path: '/', lastmod: '2026-08-01', changefreq: 'monthly', priority: '1.0' },
  { path: '/resume', lastmod: '2026-08-01', changefreq: 'monthly', priority: '0.8' },
  { path: '/privacy', lastmod: '2026-08-01', changefreq: 'yearly', priority: '0.2' },
]

function sitemap(): string {
  const newest = notes.reduce((a, n) => (n.date > a ? n.date : a), '1970-01-01')
  const urls = [
    ...STATIC_ROUTES,
    { path: '/notes', lastmod: newest, changefreq: 'weekly', priority: '0.7' },
    ...notes.map((n) => ({
      path: `/notes/${n.slug}`,
      lastmod: n.date,
      changefreq: 'yearly',
      priority: '0.6',
    })),
  ]
  const body = urls
    .map(
      (u) => `  <url>
    <loc>${SITE}${u.path}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`
}

/**
 * Generates one HTML document per note, plus the sitemap, and returns the Vite
 * inputs for them.
 *
 * Runs while the config is evaluated rather than inside a plugin hook, because
 * `rollupOptions.input` is resolved from real paths on disk before any hook
 * fires — and because doing it here is the only way `vite dev` and `vite build`
 * see the same set of documents. Both generated outputs are gitignored: they
 * are derived from src/data/notes.ts, and a committed copy is just a second
 * source of truth waiting to disagree with the first.
 *
 * The sitemap is generated for the same reason. Hand-keeping a list that grows
 * with every entry is the drift this section exists to avoid, and a sitemap
 * advertising a URL that no longer exists is a crawl error rather than a
 * cosmetic one.
 */
function notesEntries(): Record<string, string> {
  writeIfChanged(resolve(__dirname, 'public/sitemap.xml'), sitemap())

  const dir = resolve(__dirname, 'notes')
  mkdirSync(dir, { recursive: true })

  const inputs: Record<string, string> = {}
  for (const note of notes) {
    const path = resolve(dir, `${note.slug}.html`)
    writeIfChanged(path, noteDocument(note))
    inputs[`note-${note.slug}`] = path
  }

  // Delete documents for slugs that no longer exist.
  //
  // Generating is only half of keeping this directory a pure function of
  // notes.ts. Without the sweep, deleting or renaming an entry leaves its
  // document behind forever: it is gitignored, so it never shows up in a diff,
  // and it stops being a Vite input, so it never reaches dist/ either. The file
  // would simply sit in the working tree looking live. Harmless today, and
  // exactly the kind of stale artefact that gets rediscovered later and
  // mistaken for something load-bearing.
  const wanted = new Set(notes.map((n) => `${n.slug}.html`))
  for (const file of readdirSync(dir)) {
    if (file.endsWith('.html') && !wanted.has(file)) unlinkSync(resolve(dir, file))
  }

  return inputs
}

/**
 * Emits the notes index as Blog JSON-LD into notes.html at build time.
 *
 * Same reasoning as `workSchema()`: the list changes every time something is
 * written, and structured data that disagrees with the page is worse than none.
 * The full body is deliberately not included — `blogPost` carries the headline,
 * summary, and URL, and the entry document at that URL is where a crawler
 * should read the article itself.
 */
function notesSchema(): Plugin {
  return {
    name: 'notes-blog-schema',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (!ctx.filename.replace(/\\/g, '/').endsWith('/notes.html')) return
        const ld = {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          '@id': `${SITE}/notes#blog`,
          url: `${SITE}/notes`,
          name: 'Notes',
          description:
            'A changelog of engineering decisions made on eric.sh. What changed, what it cost, and what went wrong on the way.',
          inLanguage: 'en',
          author: { '@id': `${SITE}/#person` },
          publisher: { '@id': `${SITE}/#person` },
          isPartOf: { '@id': `${SITE}/#website` },
          blogPost: notes.map((n) => ({
            '@type': 'BlogPosting',
            '@id': `${SITE}/notes/${n.slug}#post`,
            url: `${SITE}/notes/${n.slug}`,
            headline: n.title,
            description: n.summary,
            datePublished: n.date,
            keywords: n.tags.join(', '),
            author: { '@id': `${SITE}/#person` },
          })),
        }
        return {
          html,
          tags: [
            {
              tag: 'script',
              attrs: { type: 'application/ld+json' },
              // `<` escaped so a title containing "</script>" can never break out.
              children: JSON.stringify(ld).replace(/</g, '\\u003c'),
              injectTo: 'head' as const,
            },
          ],
        }
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), workSchema(), notesSchema()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      // /resume and /privacy are their own documents, not rewrites onto
      // index.html. They render from the same main.tsx (App routes on pathname,
      // as it always has) — the split exists so each route can serve its own
      // <title>, description, canonical, and OG tags. Sharing index.html meant
      // both routes canonicalized themselves to the homepage, which told Google
      // not to index them while the sitemap asked it to.
      input: {
        main: resolve(__dirname, 'index.html'),
        resume: resolve(__dirname, 'resume.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        notes: resolve(__dirname, 'notes.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        // One document per note, written to disk by this call. See notesEntries.
        ...notesEntries(),
      },
      output: {
        // Isolate the React runtime from app/UI code so day-to-day component
        // changes don't bust the cache for a chunk that almost never changes.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react'
        },
      },
    },
  },
})
