# Hero Chat — Reference

The chat panel in the Hero section is a Groq-backed Q&A bot with persona-driven responses, streaming, persistence, and markdown link rendering. This file is the navigable reference; the implementation spans the client, the serverless function, and several content sources.

## File map

| Concern | File |
|---|---|
| HTTP handler (validation, streaming) | [api/chat.ts](api/chat.ts) |
| System prompt builder + bio loader | [src/data/chat-context.ts](src/data/chat-context.ts) |
| Bio facts (editable content) | [data/bio.csv](data/bio.csv) — at project root, **not** under `src/data/` |
| Project list | [src/data/work.ts](src/data/work.ts) |
| Testimonials | [src/data/testimonials.ts](src/data/testimonials.ts) |
| Resume (jobs, values, education, certifications) | [src/data/resume.ts](src/data/resume.ts) |
| Client state (history, persistence, stream consumption) | [src/hooks/useChat.ts](src/hooks/useChat.ts) |
| UI (header / thread / textarea-with-button) | [src/components/ui/Chat/Chat.tsx](src/components/ui/Chat/Chat.tsx) |
| Mount point + welcome message | [src/components/sections/Hero/Hero.tsx](src/components/sections/Hero/Hero.tsx) |
| Production bundling rule for bio.csv | [vercel.json](vercel.json) |

## Architecture facts

- **Streaming protocol**: `text/plain; charset=utf-8` with chunked transfer. Server writes raw text deltas via `res.write()`; client reads `response.body.getReader()` + `TextDecoder` and appends to the last assistant message. **No SSE framing** — keep it that way unless you also update the client reader.
- **Model**: `llama-3.3-70b-versatile` via Groq SDK with `stream: true`, `temperature: 0.5`, `max_tokens: 500`. Pre-stream errors return JSON 500; mid-stream errors log + `res.end()` (client sees truncation).
- **Persistence**: messages are saved to `localStorage['eric.sh:chat:v1']`. The close button does **not** clear — only the trash/clear button (which calls `reset()`) wipes state + storage. This is intentional: refresh and panel-close both keep the thread.
- **Markdown rendering**: assistant messages and the welcome are rendered through `react-markdown` with custom `a`/`p`/`ul`/`ol`/`li`/`code`/`strong` components. Links to `#anchor` call `handleClose()` so the panel slides shut while the page smooth-scrolls to the target (CSS `scroll-behavior: smooth` is set globally in [src/index.css](src/index.css)).
- **Email safety net**: `linkifyEmail()` in [Chat.tsx](src/components/ui/Chat/Chat.tsx) regex-wraps any plain `*@*.*` in markdown link syntax before `ReactMarkdown` parses, so a forgotten link in model output still renders as a clickable mailto.
- **Welcome typewriter**: `useTypewriter` hook (inline in Chat.tsx) types the welcome message at 28ms/char on mount; respects `prefers-reduced-motion` (renders instantly when set).
- **Auto-resize textarea**: `rows=1` + ref-driven `el.style.height = scrollHeight` capped at `TEXTAREA_MAX_HEIGHT` (160px). CSS `transition-[height] duration-150 ease-out` smooths the growth between explicit pixel heights. Scrollbar is hidden via `[&::-webkit-scrollbar]:hidden [scrollbar-width:none]` so content doesn't shift when scroll engages past max height.

## System prompt structure (top-down)

1. Persona — "You are Eric Shell, responding to visitors on your own portfolio website…"
2. Bio facts (from `data/bio.csv`)
3. Headline (from `resume.ts`)
4. Narrative summary (3 paragraphs from `resume.ts`)
5. Experience timeline (jobs from `resume.ts`)
6. Project history (from `work.ts`)
7. How I work (values from `resume.ts`)
8. Credentials (education + certifications from `resume.ts`)
9. Testimonials (from `testimonials.ts`)
10. Guidelines — first-person voice, markdown link rules (mailto + `#contact`), tone, redirects for off-topic, etc.

## Vercel-dev gotchas

These cost time the first time around. Surface them early next time.

- **`vercel dev` ignores `.env.local` for linked projects** in favor of cloud env vars. Adding a key to `.env.local` alone does nothing once the project is linked. Use `npx vercel env add NAME [environment]`. The cloud value is the one that matters in dev.
- **Each environment is separate** — `development`, `preview`, `production`. Adding to one does NOT propagate. Production deploys need `npx vercel env add GROQ_API_KEY production` separately. Same for `preview`. To pipe a value safely from `.env.local` without echoing: `grep "^NAME=" .env.local | cut -d= -f2- | npx vercel env add NAME <env>`.
- **`data/bio.csv` is not auto-bundled in production** because the read uses a dynamically-constructed path (`path.join(process.cwd(), 'data/bio.csv')`) that Vercel's NFT can't trace. The fix lives in [vercel.json](vercel.json) — `functions["api/chat.ts"].includeFiles: "data/bio.csv"`. Don't remove that.
- **Bio CSV cache is module-scoped**. `cachedBio` in [chat-context.ts](src/data/chat-context.ts) is set on first read and never invalidated. Edits to `data/bio.csv` (or to any TS content module) require a server restart — kill `vercel dev` and re-run. Vite HMR does not apply to API runtime modules.
- **Dev port is 3000**, not 5173. `npm run dev` runs `vercel dev` (which wraps Vite); the function endpoints are at the same origin as the UI.
- **Production Node ESM requires `.js` extensions on relative imports**, even from `.ts` source. `vercel dev` is permissive about this (won't error), but the deployed function runs strict ESM and will throw `ERR_MODULE_NOT_FOUND` at runtime. When importing across `api/` ↔ `src/data/`, write `from '../src/data/chat-context.js'`, not `'../src/data/chat-context'`. TypeScript handles the `.js`-pointing-at-`.ts` resolution transparently.

## Common edits

| Want to do | Where to go |
|---|---|
| Add a new fact about Eric | [data/bio.csv](data/bio.csv) — add a `key,value` row, restart dev |
| Tweak the assistant's voice | Guidelines block at the bottom of `buildSystemPrompt()` in [src/data/chat-context.ts](src/data/chat-context.ts) |
| Change the welcome message | `welcomeMessage="…"` prop on `<Chat>` in [src/components/sections/Hero/Hero.tsx](src/components/sections/Hero/Hero.tsx) |
| Add a new content section to the prompt | New formatter in `buildSystemPrompt()`, slotted into the section ordering above |
| Format a new kind of markdown element | `mdComponents` map in [Chat.tsx](src/components/ui/Chat/Chat.tsx) |
| Adjust streaming model / temperature / max_tokens | Constants near the top of [api/chat.ts](api/chat.ts) |
| Increase/decrease textarea max height | `TEXTAREA_MAX_HEIGHT` near the top of [Chat.tsx](src/components/ui/Chat/Chat.tsx) |
| Reset persisted thread storage version | Bump `STORAGE_KEY` in [src/hooks/useChat.ts](src/hooks/useChat.ts) (e.g. `:v1` → `:v2`) |

## Roadmap (not yet built)

- **RAG retrieval** — current implementation stuffs all content into every prompt (~3.2K tokens). When content grows or cost matters, switch to embedding-based retrieval (top-K chunks per query). Recommended provider: OpenAI `text-embedding-3-small` (Groq does not offer embeddings as of Apr 2026). Five-phase plan was sketched in `~/.claude/plans/let-s-build-out-our-generic-emerson.md` (in a prior session — that plan file gets overwritten between sessions, so check git history if you need the full version).
- **Airtable as CMS** — replace the local TS data modules with a build-time sync from Airtable, so non-technical edits don't require a deploy. Pair with the embedding refresh.

## Verifying the chat works

Local:
```bash
npm run dev    # site + storybook; site at http://localhost:3000
# In another terminal:
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hi"}],"website":""}' \
  --max-time 20
```

Production:
```bash
curl -s -X POST https://<your-vercel-url>/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hi"}],"website":""}' \
  --max-time 20
```

A streamed plain-text reply means the chain is healthy: env vars set, bio.csv bundled, Groq reachable. A 500 means investigate in this order: env vars (`vercel env ls <env>`) → vercel.json includeFiles → Vercel function logs.
