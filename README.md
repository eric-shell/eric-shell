# eric.sh

Source for [eric.sh](https://eric.sh), the personal site of Eric Shell: a portfolio, a résumé, an AI chat that answers questions about his work, and [/notes](https://eric.sh/notes), a changelog of the engineering decisions behind the site itself. Each note links the commit it describes in this repo.

## Stack

- **Front end:** Vite, React 19, TypeScript and Tailwind CSS v4. Every public route is prerendered to HTML at build time and hydrated in the browser.
- **API:** Vercel serverless functions in `api/`. Chat runs on Groq, email on Resend, rate limiting on Upstash Redis, and storage on Neon Postgres.
- **Admin:** a password-and-emailed-code CRM at `/dashboard`, built as a separate Vite entry. Its code never ships to public visitors.

There is no third-party analytics and no cookies on the public site. What the site records about visitors, and why, is on [/privacy](https://eric.sh/privacy).

## Running it

Requires Node 26 (see `.nvmrc`).

```bash
npm install
npm run dev:site    # site and API at http://localhost:3000 (runs `vercel dev`)
npm run dev         # the same, plus Storybook at http://localhost:6006
```

`vercel dev` needs the project linked (`npx vercel link`) and takes its environment from the linked Vercel project, not from a local file. [.env.example](.env.example) lists every variable and what breaks without it. The site renders without any of them; the chat, the contact form and the admin are what need keys.

For the front end alone, without the API, `npx vite` serves the site at http://localhost:5173.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build       # builds dist/ and prerenders every public route
```

All four run in CI on every push to `main` and every pull request ([.github/workflows/ci.yml](.github/workflows/ci.yml)). None of them need secrets.

## Layout

```
src/components/   layout (header, footer), page sections, and shared UI primitives
src/data/         content: work, résumé, testimonials, notes
src/admin/        the CRM single-page app
api/              serverless functions (each file is a route)
db/schema.sql     Postgres schema, applied by hand
scripts/          image pipeline, prerender, CRM seeding and screenshot tooling
tests/            Vitest
```

[CLAUDE.md](CLAUDE.md) is the detailed reference. It covers the conventions, the reasoning behind decisions that look odd out of context, and what breaks if they are undone.

## Deployment

Vercel builds with `npm run build` and deploys `dist/` plus `api/`. The prerender is the last step of that script, so a deploy that ran bare `vite build` would still work but would ship empty HTML documents. Check the build log for `prerendered N documents`.

The project is on Vercel's Hobby plan, which caps a deployment at 12 serverless functions. `api/` uses 11 of them.
