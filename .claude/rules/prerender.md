---
paths:
  - "scripts/prerender.mjs"
  - "src/entry-server.tsx"
  - "src/main.tsx"
  - "src/lib/hydration.ts"
  - "src/App.tsx"
  - "src/components/sections/**"
  - "src/components/layout/**"
  - "src/components/ui/Cascade/**"
  - "src/components/ui/Markdown/**"
  - "src/lib/markdown.tsx"
---
# Prerendering and hydration

Every public document is rendered to HTML at build time and hydrated in the browser. `npm run build` ends with [scripts/prerender.mjs](scripts/prerender.mjs), which builds the app a second time for Node from [src/entry-server.tsx](src/entry-server.tsx), renders each route, and writes the markup into that document's `#root`. Before this each document shipped an empty `<div id="root">`: the per-route head tags described content a non-JS crawler never received, and the hero image could not start downloading until React had rendered an `<img>` (1,328ms on a throttled phone; 185ms now).

- **[src/main.tsx](src/main.tsx) hydrates when `#root` has children and client-renders when it is empty.** `vite dev` serves the bare entries, so dev is unchanged — and a build whose prerender step did not run degrades to the old behaviour rather than breaking. `dashboard.html` is never prerendered.
- **The first client render must produce the markup the build produced.** Anything that depends on the browser (localStorage, `matchMedia`, feature detection, the clock) must not be read during render. Gate it on `useHydrated()` ([src/lib/hydration.ts](src/lib/hydration.ts)), which is false on the server and during hydration and true after; **never on `typeof window`**, which gives the server one answer and the hydrating client another. `Chat`, `Toaster` and the particle canvases are client-only for this reason, and the Hero holds the chat's place with a box of `CHAT_RESTING_HEIGHT` (394px, measured — re-measure if the chat's resting layout changes).
- **`App` takes a `pathname` prop and passes `isHome` to `Header`**, because the prerender has no `window.location`. Don't read `window` at render time in anything a public route renders.
- **A Suspense boundary must not sit under a `CascadeGroup` unless everything inside it is already loaded.** `CascadeGroup` is a context provider whose value changes when it scrolls into view, and React answers a context change above a not-yet-hydrated boundary by hydrating it on the spot; if anything inside still suspends, it discards the prerendered HTML and shows the fallback. On a note page that was the article collapsing to one paragraph of raw markdown and re-expanding: CLS 0.47. `NoteArticle` ([Note.tsx](src/components/sections/Notes/Note.tsx)) is the worked example — the boundary wraps the group, and it waits on `loadMarkdown()` before rendering. For the same reason, don't let a component re-render past a boundary it prerendered.
- **`entry-server.tsx` renders until nothing suspends, with `progressiveChunkSize` maxed.** Either one missing and React emits the section as a hidden `<div>` plus an inline script that moves it into place, which is invisible without JavaScript. The loop throws if it does not settle.
- **`CascadeItem` starts at `opacity: 0` and is revealed from JS**, so the prerender script adds a `<noscript>` style that reveals it. Without it a no-JS visitor would get the whole page and see none of it.
- **The server build's scratch dir lives in `node_modules/.cache/prerender-ssr`, not the project root.** `vercel dev` watches the whole tree, and a `dist-ssr/` that appeared and vanished mid-scan crashed it (`ENOENT: scandir dist-ssr`) whenever a build ran beside the dev server. Don't move it back.
- **A prerender failure fails the build**, deliberately. Check with a throttled run, not just a fast local one: the article bug above was invisible until the network was slowed.
