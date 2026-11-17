---
name: dev
description: Run the site in a browser - start vercel dev on port 3000 (or the preview build on 4170, Storybook on 6006), check it from text first, screenshot only when the question is how something looks, stop what you started. Use when asked to run, start, screenshot or verify a change in the real app.
argument-hint: [dev | preview | storybook]
---
# Run the app

Screenshots are expensive: every image read stays in the conversation and is paid for again on each later turn. Answer from text first (`curl -s localhost:3000/<route> | grep ...`, console errors, a Playwright `evaluate`) and screenshot only when the question is how something looks.

1. Check the port: `nc -z 127.0.0.1 3000 && echo up`. Reuse a running server (Vite hot-reloads). Otherwise start `npm run dev:site` with `run_in_background: true` and wait for the Ready line. `vercel dev` pulls env from the linked Vercel project, so it needs the project linked and a network; it also serves `/api/*`. It runs Vite and watches the whole tree, so don't create scratch dirs in the project root while it runs.
2. Dev serves the bare entries (client-rendered, no prerender). To see what visitors get, run `npm run build && npm run preview` (port 4170, `strictPort`): that is the prerendered, hydrated output, and the only place prerender, hydration and `<noscript>` bugs show up. `npm run dev` adds Storybook on 6006 (`--exact-port`).
3. The ports are pinned: if something else holds one, say so rather than changing it. Stop a server you started when done, unless the user is using it.
4. Routes: `/`, `/resume`, `/privacy`, `/notes`, `/notes/<slug>`; the admin at `/login` and `/dashboard` (needs `ADMIN_PASSWORD`; `npm run seed:crm` fills it with fake data, and asks first).
5. Playwright (already a dev dependency for `npm run kerning`) is the way to look: one script, headless Chromium, `page.goto`, read text or `screenshot` once at the default size, in the scratchpad. Check reduced motion (`emulateMedia`) when touching animation, and a 390px width for layout. Global Privacy Control or Do Not Track turns telemetry off, so a test browser that sets them sends nothing to the CRM.
6. Resume print: `page.pdf` or Chrome's print preview on `/resume`; it must stay one Letter sheet (`.claude/rules/resume.md`).
