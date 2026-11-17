#!/usr/bin/env node
/**
 * Renders every public route into its HTML document at build time.
 *
 * Until this existed each document shipped `<div id="root"></div>` and nothing
 * else. The per-route titles, canonicals, OG tags and JSON-LD all described
 * content that was not in the file: a crawler that does not run JavaScript
 * (most social scrapers, several search and AI crawlers) got a head and an
 * empty body, and the hero image could not start downloading until React had
 * loaded, run, and rendered an `<img>` for the preload scanner to find.
 *
 * Runs last in `npm run build`, after `vite build` has written dist/. It builds
 * the same app a second time for Node (src/entry-server.tsx -> a scratch dir), and
 * for each document in dist/ asks that build to render the matching route, then
 * writes the result into `#root`. The browser hydrates it — see src/main.tsx.
 * The scratch dir is deleted afterwards, pass or fail.
 *
 * It lives in node_modules/.cache/, not the project root, because `vercel dev`
 * watches the whole project tree: a folder that appears and is deleted a moment
 * later, mid-scan, crashed it with ENOENT (scandir dist-ssr) whenever a build
 * ran beside a dev server. The watcher ignores node_modules/, and Node still
 * resolves the bundle's bare imports (react, react-dom/server) from there.
 *
 * The server build is started from here rather than as a second `vite build`
 * in package.json so that its three settings live beside the code that depends
 * on them, and because the CLI has no flag for `copyPublicDir` — without which
 * it copies all of public/, 8MB of photography, into a directory that exists
 * for a few hundred milliseconds.
 *
 * `dashboard.html` is deliberately not in the list. It is the password-gated
 * admin, a separate entry, and nothing about it should be rendered ahead of a
 * session.
 *
 * Any failure exits non-zero and fails the build. A document left
 * un-prerendered would still work (main.tsx falls back to a client render), but
 * it would do so silently and for one route out of forty, which is exactly the
 * kind of thing nobody notices for months.
 */
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'vite'

const root = resolve(import.meta.dirname, '..')
const dist = resolve(root, 'dist')
const ssr = resolve(root, 'node_modules/.cache/prerender-ssr')

const EMPTY_ROOT = '<div id="root"></div>'

/**
 * Entrance animations start every `CascadeItem` at `opacity: 0` and reveal it
 * from JavaScript. With the content now in the HTML, a visitor without
 * JavaScript would receive the whole page and see none of it. This puts it back
 * for them and only for them.
 *
 * `--cascade-fade` is the custom property glass panels fade themselves by (an
 * ancestor's opacity would break their backdrop-filter), so it needs the same
 * treatment. `!important` because both are set inline on the element.
 */
const NOSCRIPT = '<noscript><style>.cascade-item,.rise-ch{opacity:1!important;translate:none!important;transform:none!important;--cascade-fade:1!important}.lu-flash{display:none!important}</style></noscript>'

/** [file under dist/, the pathname it is served at] */
const documents = [
  ['index.html', '/'],
  ['resume.html', '/resume'],
  ['privacy.html', '/privacy'],
  ['notes.html', '/notes'],
  ...readdirSync(resolve(dist, 'notes'))
    .filter((f) => f.endsWith('.html'))
    .sort()
    .map((f) => [`notes/${f}`, `/notes/${f.slice(0, -'.html'.length)}`]),
]

await build({
  root,
  logLevel: 'warn',
  build: {
    ssr: resolve(root, 'src/entry-server.tsx'),
    outDir: ssr,
    emptyOutDir: true,
    copyPublicDir: false,
  },
})

let total = 0
try {
  const { render } = await import(pathToFileURL(resolve(ssr, 'entry-server.js')).href)
  for (const [file, pathname] of documents) {
    const path = resolve(dist, file)
    const html = readFileSync(path, 'utf8')
    if (html.split(EMPTY_ROOT).length !== 2) {
      throw new Error(`prerender: expected exactly one empty #root in ${file}`)
    }
    if (!html.includes('</head>')) throw new Error(`prerender: no </head> in ${file}`)

    const app = await render(pathname)
    if (app.length < 2000) {
      // Every route renders a header, a masthead and a footer at minimum. Far
      // less than that means a Suspense fallback or an error boundary was
      // captured instead of the page.
      throw new Error(`prerender: ${pathname} rendered only ${app.length} bytes`)
    }

    // Function replacers, so a `$&` or `$1` in the rendered markup is inserted
    // literally instead of being read as a replacement pattern.
    const out = html
      .replace('</head>', () => `${NOSCRIPT}\n  </head>`)
      .replace(EMPTY_ROOT, () => `<div id="root">${app}</div>`)
    writeFileSync(path, out, 'utf8')
    total += app.length
  }
} finally {
  rmSync(ssr, { recursive: true, force: true })
}

console.log(`prerendered ${documents.length} documents, ${(total / 1024).toFixed(0)} kB of markup`)
