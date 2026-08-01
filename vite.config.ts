import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
