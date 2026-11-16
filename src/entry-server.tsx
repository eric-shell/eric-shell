import { StrictMode } from 'react'
import { prerender } from 'react-dom/static'
import App from './App'

/**
 * Renders one public route to the HTML that goes inside `<div id="root">`.
 *
 * Build-time only. `vite build --ssr` compiles this file to dist-ssr/, and
 * scripts/prerender.mjs calls it once per HTML document in dist/. Nothing here
 * runs in the browser or in a serverless function.
 *
 * `prerender`, not `renderToString`: the routes and the markdown parser are
 * `lazy()`, and `renderToString` emits a Suspense boundary's FALLBACK for
 * anything that suspends, which for /resume, /privacy and every note would be
 * an empty page. `prerender` waits for all of it.
 *
 * Wrapped in StrictMode because main.tsx is: the two trees have to agree for
 * the browser to hydrate this markup rather than throw it away.
 *
 * Any render error is rethrown so the build fails. A page silently prerendered
 * as an error fallback would ship, look fine in the deploy log, and be wrong.
 */
async function renderOnce(pathname: string): Promise<string> {
  const errors: unknown[] = []
  const { prelude } = await prerender(
    <StrictMode>
      <App pathname={pathname} />
    </StrictMode>,
    {
      onError: (error) => { errors.push(error) },
      // React writes any Suspense boundary bigger than this (12.8kB by
      // default) out of line even when nothing in it suspended, on the theory
      // that the response is a stream and the shell should flush first. This is
      // a file, written once, and every lazy route is far over that size — so
      // without the override every one of them was emitted as the hidden,
      // script-activated form described below, on every pass.
      progressiveChunkSize: Number.MAX_SAFE_INTEGER,
    },
  )
  const html = await new Response(prelude).text()
  if (errors.length > 0) throw errors[0]
  return html
}

/**
 * Rendered until nothing suspends, which in practice is twice.
 *
 * `prerender` does wait for a suspended boundary, but it has already written
 * that boundary's fallback by then, so the content arrives as a hidden
 * `<div>` further down plus an inline `<script>` that moves it into place
 * (the same out-of-line form `progressiveChunkSize` above opts out of). The
 * page is then only correct once that script has run: a browser without
 * JavaScript shows the fallback, which for a lazy route is nothing at all, and
 * the article sits in the document where no reader will see it.
 *
 * What suspends here is all cached after the first pass (each `lazy()` holds
 * its resolved module, each note body its settled promise), so a second pass
 * finds everything ready, never suspends, and writes plain markup in document
 * order with no script. The loop is the check that this stays true.
 */
export async function render(pathname: string): Promise<string> {
  for (let pass = 1; pass <= 3; pass++) {
    const html = await renderOnce(pathname)
    if (!html.includes('<template') && !html.includes('<script')) return html
  }
  throw new Error(`prerender: ${pathname} still suspends after three passes`)
}
