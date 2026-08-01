import { defineConfig, type Plugin } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { workItems } from './src/data/work'

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

export default defineConfig({
  plugins: [react(), tailwindcss(), workSchema()],
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
        dashboard: resolve(__dirname, 'dashboard.html'),
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
