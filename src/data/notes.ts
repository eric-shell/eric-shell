/**
 * Engineering notes, a changelog of decisions made on this site.
 *
 * Every entry is a real change with a real commit behind it. That is the whole
 * point: a portfolio can claim anything, but a note that cites a number and
 * links the diff that produced it can be checked. Entries that cannot be
 * checked do not belong here.
 *
 * Each note becomes its own document at build time, `/notes/<slug>` with its
 * own title, canonical, OG tags, and BlogPosting JSON-LD, generated from this
 * array by `notesEntries()` in vite.config.ts. Adding an entry here is the
 * whole workflow; the HTML entry, the Vite input, and the sitemap line all
 * follow from it. See CLAUDE.md.
 *
 * ## House style, applies to every field a reader sees
 *
 * **No em dashes.** Not in `title`, `summary`, or `body`, and not in the meta
 * description they become. Heavy em dash use is one of the most recognisable
 * tells of machine-written prose, and a section whose entire value rests on
 * these being genuinely Eric's cannot afford to read as generated. Use a comma,
 * a colon, parentheses, or two sentences. A run of `—` in a diff on this file
 * is a bug, not a style preference.
 *
 * Beyond that: first person, specific numbers over adjectives, and name the
 * thing that went wrong before the thing that fixed it.
 */

export interface Note {
  /** URL segment. Lowercase, hyphenated, stable. Changing it breaks a live URL. */
  slug: string
  title: string
  /** ISO `YYYY-MM-DD`. Matches the date of `commit`, not the date of writing. */
  date: string
  /**
   * One sentence. Does quadruple duty: the card blurb, the `<meta
   * description>`, the OG/Twitter description, and the JSON-LD `description`.
   * Keep it under ~155 characters so search results don't truncate it.
   */
  summary: string
  tags: string[]
  /** Short SHA in this repo. Omit only if a note genuinely has no single commit. */
  commit?: string
  /** Markdown body, rendered through `noteMdComponents`. */
  body: string
}

/** Public source for this site. Every note's `commit` resolves against it. */
export const repoUrl = 'https://github.com/eric-shell/eric-shell'

export const commitUrl = (sha: string) => `${repoUrl}/commit/${sha}`

/**
 * Entries in authored order. Not the render order, and not what anything
 * outside this file should read. Export `notes` below instead.
 *
 * Order within a single date is meaningful and hand-controlled; order *across*
 * dates is not maintained here, because appending is the natural way to add an
 * entry and re-slotting one by date is the step everybody forgets. That is
 * exactly what went wrong the first time: an entry dated 2026-08-01 was
 * appended after two from July, and since nothing sorted, "Newest first"
 * rendered it below a July 19 post and the prev/next pager offered it a "Newer"
 * link pointing backwards in time.
 */
const entries: Note[] = [
  {
    slug: 'responsive-work-card-images',
    title: 'Responsive work-card images, and the sizes attribute that made tablets worse',
    date: '2026-08-01',
    summary:
      'Every device was downloading a flat 800px image into a 339px slot. Fixing it cut 1x transfer by 68-76%, but the first attempt made tablets worse.',
    tags: ['Performance', 'Images', 'Responsive'],
    commit: '9b84db6',
    body: `The work grid renders 39 cards, each with a photo. Every one of them was requesting a flat \`w=800\` from Unsplash, into a slot that measures 339px in the four-up grid. A 1x laptop was downloading roughly five times the pixels it could display.

The fix is ordinary: a \`srcSet\` of candidate widths and a \`sizes\` attribute telling the browser how wide the slot actually is. Unsplash resizes on request, so candidates cost nothing to store, and the ladder can be denser than a file-backed pipeline would justify.

## The part that bit me

My first \`sizes\` was the obvious one:

\`\`\`
sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
\`\`\`

That is wrong, and it is wrong in the direction that costs bytes. The grid lives inside a container with 48px of horizontal padding, and each column is separated by a 12px gap. A column is therefore **not** a clean fraction of the viewport. At an 834px viewport, \`50vw\` claims 417px for a card that is really 387px.

An 8% overestimate sounds harmless. It isn't. It pushed the browser's candidate picker up a rung, so tablets selected a *larger* image than the flat \`w=800\` they'd been getting. The optimisation didn't degrade gracefully at the margin, it inverted. The measurement I'd have shipped on ("1x transfer down 68-76%") was true for the device classes I checked and false for the one I hadn't.

The real \`sizes\` carries the arithmetic:

\`\`\`
(min-width: 1280px) calc((min(100vw, 1440px) - 48px - 36px) / 4), …
\`\`\`

## The cap

The candidate ladder stops at 800 on purpose. A 3x phone at a 360px viewport wants 936px and will happily take a 1024 candidate, **51% more than the flat \`w=800\` this replaced**, on the device class most likely to be on a metered connection. These are decorative stock thumbnails; 800px into a 312px slot is still 2.5x oversampled and looks identical.

The cap is what makes the guarantee hold: no device comes out of this worse than it went in. That guarantee is the actual deliverable, not the headline percentage.`,
  },
  {
    slug: 'delta-timed-particle-sims',
    title: 'The particle sims ran at double speed on 120Hz displays',
    date: '2026-08-01',
    summary:
      'Two Canvas 2D simulations advanced by a fixed step per frame, so refresh rate set the speed. Delta-timing them needed two guards to be safe to pause.',
    tags: ['Canvas', 'Performance', 'Animation'],
    commit: '85db1e7',
    body: `The homepage mounts four particle canvases. Hero and Contact each get a small and a large sim. They were written the way most \`requestAnimationFrame\` loops start out: each tick advances every particle by a fixed amount.

That silently makes the refresh rate the speed control. On a 60Hz panel the drift looked the way I designed it. On a 120Hz laptop it ran at literally double speed, and on a 144Hz display faster still. I'd been developing on the fast machine and tuning the constants down to compensate, which meant the effect was wrong everywhere and I'd calibrated it to be wrong in the place I was looking.

## Delta-timing

The shared loop now hands \`frame\` a delta expressed in 60fps units (\`1\` at 60Hz, \`~0.5\` at 120Hz) and every per-frame increment inside the tick functions multiplies by it. That part is textbook.

The part that isn't textbook is that these loops **pause**. Each canvas paints only while it's on screen, so a loop can be stopped for as long as someone spends reading the rest of the page. Two guards make delta-timing safe under that, and removing either reintroduces a real bug:

- **\`MAX_DELTA\` caps a step at 3 frames.** Without it, a stalled tab or a slept machine produces one enormous delta and every particle teleports across the viewport in a single frame. The sim doesn't recover, it just looks broken.
- **\`last\` is re-baselined on every \`start()\`.** Without it, the first frame after an off-screen pause is charged the entire time the canvas spent scrolled away, which is the same teleport by a different route.

## What I'd tell myself earlier

The bug wasn't the fixed step. The bug was that I had no way to observe the thing I was tuning: I was adjusting magic numbers against a display whose refresh rate I hadn't thought of as an input. Verified refresh-rate independent at 60, 120, and 144Hz, which is a sentence I could only write after building a way to check it.`,
  },
  {
    slug: 'splitting-react-markdown-out-of-first-paint',
    title: 'Splitting react-markdown out of the first-paint bundle: 61KB to 28KB',
    date: '2026-08-01',
    summary:
      'react-markdown carries micromark and hast, about 35KB gzipped, and it sat in the shared UI chunk every homepage visit downloads before first paint.',
    tags: ['Bundle size', 'React', 'Performance'],
    commit: 'ed44d6c',
    body: `The hero has a chat panel. The chat panel renders assistant replies as markdown. So \`Markdown\` lived in \`components/ui\`, exported from the barrel like every other primitive, and imported react-markdown directly.

The consequence is easy to miss because nothing about it looks wrong. react-markdown pulls in micromark and hast, about 115KB raw and 35KB gzipped, and because the component sat in the shared \`ui\` chunk, **every homepage visit downloaded a markdown parser before first paint**, including visits that never opened the chat.

Nothing renders markdown until the chat has something to say. That's a network round trip to an LLM away. The parser has no business in the critical path.

## The change

\`\`\`tsx
const ReactMarkdown = lazy(() => import('react-markdown'))
\`\`\`

The shared \`ui\` chunk went from **61KB gzipped to 28KB**.

Two details did more work than the \`lazy()\` itself.

**The Suspense fallback renders raw text, not the linkified text.** The component runs a regex that rewrites bare email addresses into \`[a@b.com](mailto:a@b.com)\`. Show that before the parser lands and the user reads markdown *source* for a frame. The fallback also mirrors the paragraph component's classes exactly, so the swap costs no layout shift.

**\`prefetchMarkdown()\` warms the chunk on idle.** The chat panel is open at first paint and its welcome message goes through \`<Markdown>\` immediately. Deferring the parser to the moment it's needed would have traded a load cost for a visible pop. Fetching it in \`requestIdleCallback\` instead means it downloads while the browser has nothing better to do, and is resident long before the first reply.

## The fragile part

This only holds while there is exactly one value import of react-markdown in the entire app. A plain \`import ReactMarkdown from 'react-markdown'\` anywhere else puts all 35KB straight back into the initial graph, and nothing fails. No error, no warning, just a slower first paint that shows up weeks later if anyone thinks to look.

So the constraint is written down in the component, in the helper module, and in the project's CLAUDE.md. A bundle optimisation you can undo by accident with a one-line import isn't finished until the invariant is documented somewhere a future reader will actually hit.`,
  },
  {
    slug: 'removing-google-analytics',
    title: 'Removing Google Analytics: 149KB, 40ms of LCP, and a narrower CSP',
    date: '2026-08-01',
    summary:
      'GA cost 149KB and about 210ms of load to collect a subset of what the first-party telemetry already recorded. Removing it let connect-src drop to self alone.',
    tags: ['Performance', 'Privacy', 'Telemetry'],
    commit: 'afb569e',
    body: `This site already records its own analytics: page views, session engagement, scroll depth, outbound clicks, chat threads, contact submissions. First-party, into Postgres, keyed by an anonymous client-generated UUID.

Google Analytics was also on the page, because it went on early and nothing prompted a second look.

Measuring it made the decision straightforward. GA cost:

- **149KB** transferred
- **~40ms** of Largest Contentful Paint
- **~210ms** of load time

To collect a strict subset of what the first-party telemetry already had, at coarser resolution.

## What removing it unlocked

The interesting part wasn't the kilobytes. It was that GA was the only reason several things were true.

**\`connect-src\` is now \`'self'\` alone.** The Content Security Policy had to permit Google's collection endpoints. With the tag gone the policy tightened to a single source, which means any future third-party beacon fails loudly at the browser instead of quietly shipping.

**The public site now sets no cookies at all.** Not fewer cookies, none. That is a claim the privacy page can make in plain language, and it's the reason there's no consent banner: there is nothing to consent to.

## What still needs the loose bit

\`script-src\` still carries \`'unsafe-inline'\`, and it isn't leftover GA residue. The structured-data blocks are inline \`<script type="application/ld+json">\` elements, and CSP applies \`script-src\` to those. Drop \`'unsafe-inline'\` and every JSON-LD block on the site silently stops being parsed. The page renders identically and the search-result rich data quietly disappears.

That's the second time in this changelog that the failure mode is *silence*. Bundle regressions and CSP regressions share the property that the page still works, which is exactly why both are worth writing down.

## The tradeoff I accepted

First-party telemetry means no benchmarking against other sites and no acquisition reports I didn't build. For a personal site read by a few hundred people a month, that's not a loss. For a client, it would be a conversation.`,
  },
  {
    slug: 'one-html-document-per-route',
    title: 'One HTML document per route, because a shared entry canonicalised /resume to the homepage',
    date: '2026-08-01',
    summary:
      'Rewriting /resume and /privacy onto index.html gave both routes the homepage canonical and OG tags, telling Google not to index pages the sitemap asked for.',
    tags: ['SEO', 'Vite', 'Routing'],
    commit: '74ca1cb',
    body: `This is a single-page app that serves three public routes. The conventional setup is one \`index.html\`, a host rewrite sending every path to it, and client-side routing on \`window.location.pathname\`. That's what I had.

It produced two failures that neither the browser nor the build would ever report.

**Every route canonicalised itself to the homepage.** \`index.html\` carries \`<link rel="canonical" href="https://eric.sh/">\`. Serving that same document at \`/resume\` tells a crawler that \`/resume\` is a duplicate of \`/\` and shouldn't be indexed, while \`sitemap.xml\` was simultaneously asking for it to be indexed. The two signals contradict, and the canonical wins.

**Every social share of \`/resume\` rendered the homepage card.** Same cause: the OG title, description, and image all came from the homepage's head. Someone posting a link to my resume got a preview for something else entirely.

## The fix

\`index.html\`, \`resume.html\`, and \`privacy.html\` are now three real documents, all registered as Vite inputs, all loading the same \`/src/main.tsx\`. The React app is unchanged, it still routes on pathname. The split exists purely so each route can serve its own \`<title>\`, description, canonical, OG/Twitter tags, and JSON-LD.

The cost is that head tags are duplicated by hand across the files. That's a deliberate tradeoff, not an oversight: change one, check all of them.

## The case I nearly missed

Vercel serves \`/resume.html\` directly as a static file, because it exists. So the client router needs to match **both** forms:

\`\`\`ts
case '/resume':
case '/resume.html': return 'resume'
\`\`\`

Without the second case, \`/resume.html\` renders the *home* sections underneath the resume's title and canonical: a page whose content and metadata describe different things. The bare path is what the rewrite produces and what visitors see, and the \`.html\` path is what a crawler finds if it ever guesses one.

## The checklist this produced

A new public route now means five changes, and missing any one of them fails silently in a different way. A new HTML entry, a \`vite.config.ts\` input, a \`vercel.json\` rewrite, a \`getRoute()\` case, and a \`sitemap.xml\` entry.

Writing that list down is what made the notes section you're reading feasible. It's generated against that checklist rather than assembled by hand.`,
  },
  {
    slug: 'a-second-factor-that-fails-open',
    title: 'A second factor that deliberately fails open',
    date: '2026-07-30',
    summary:
      'The admin sign-in emails a 6-digit code. If the mail provider or the rate-limit store is down, it falls back to password-only, on purpose.',
    tags: ['Auth', 'Security', 'Tradeoffs'],
    commit: '040968b',
    body: `The admin CRM behind this site is password-gated. Adding a second factor was straightforward. \`POST /api/admin/login\` verifies the password and sets no session: it stores an HMAC of a 6-digit code in Upstash under a 5-minute TTL and returns an opaque challenge id. \`POST /api/admin/verify\` spends that challenge (constant-time compare, 5 attempts, single use) and only then issues the cookie. Both endpoints sleep a constant 1500ms and both are rate-limited.

The decision worth writing down is what happens when the supporting services aren't there.

## Failing open

If \`ADMIN_2FA_EMAIL\` is unset, or \`RESEND_API_KEY\` is missing, or the Upstash variables are absent, or the Resend send simply throws, sign-in falls back to **password-only**, logs a line, and lets me in.

That is a real reduction in security and it is the behaviour I want. This is a single-operator dashboard for a personal site. The threat I'm actually defending against is credential stuffing against a password that exists in one password manager. The threat I'd be *creating* by failing closed is being locked out of my own dashboard because a third party I don't control had an outage, during, most likely, exactly the incident I'd want the dashboard for.

For a system with more than one operator, or with a recovery path that doesn't route through me, I'd choose the opposite. The reasoning is specific to the situation, which is why it's recorded next to the code rather than assumed.

## Failing closed

Verification does **not** fail open, and the asymmetry is the whole design:

- Missing infrastructure means skip the second factor entirely.
- Second factor issued but the submitted code is wrong, expired, or already spent means reject.

A challenge that was created must be satisfied. What's optional is whether one gets created at all. Collapsing those two cases into a single "be lenient on error" would turn an unavailable mail provider into an authentication bypass.

## The bit that's easy to get wrong later

This looks like a bug. Someone reading \`auth.ts\` cold, including me in a year, will see a catch block that grants access on error and reach for it. So the tradeoff is written in a comment at the point of the decision, and flagged in CLAUDE.md as something not to "fix" without reading it.

Undocumented deliberate weirdness is indistinguishable from a mistake.`,
  },
  {
    slug: 'dropping-three-js-for-canvas-2d',
    title: 'Dropping Three.js for Canvas 2D particles',
    date: '2026-07-19',
    summary:
      'A WebGL renderer and scene graph to draw drifting dots over a hero section. Canvas 2D does the same effect for a rounding error of the bundle.',
    tags: ['Bundle size', 'Canvas', 'Performance'],
    commit: '0834a7d',
    body: `The hero has drifting ambient particles behind the headline. I built them with Three.js, because that's the tool I reached for when the word "particles" came up.

Three.js is a WebGL renderer, a scene graph, a material system, a camera model, and a maths library. I was using approximately none of it. There was one orthographic camera pointed at a flat plane of points, no lighting, no depth, no meshes, no interaction. Every particle was a dot with a position and a velocity, composited additively.

That is Canvas 2D's job description.

I'd already lazy-loaded the Three.js components to keep them out of the initial bundle, which is the move that lets you avoid the actual question for a while. Splitting a dependency is not the same as needing it.

## After

Two hand-written Canvas 2D simulations, \`ParticlesSmall\` and \`ParticlesLarge\`, with no rendering dependency at all. Visually the same effect, arguably better, since I could tune the additive blend directly instead of through a material abstraction.

## What I learned about the cost

The interesting part is that particle *count* turned out not to be the expensive thing. The cost is fill rate: a full-viewport \`clearRect\` plus \`globalCompositeOperation = 'lighter'\` at up to 2x DPR, with the large sim's sprites drawn at roughly half the viewport width. The homepage mounts four of these canvases.

Which produced the follow-up change. Every canvas now runs through a shared loop that paints only while it's actually on screen. \`requestAnimationFrame\` stops itself in a background *tab*, but nothing stops it for a canvas merely scrolled past, and the Contact section's two sims were burning fill rate behind three screens of content the entire time someone read the page. Verified at zero draws when scrolled away.

That pause is also what forced the delta-timing guards in a [later note](/notes/delta-timed-particle-sims).

## The general version

Reaching for a framework is a decision about the shape of the problem, and the shape of this problem was "move some dots." Lazy-loading the wrong dependency hides the cost well enough that you stop asking whether you needed it.`,
  },
  {
    slug: 'a-2-5mb-png-nobody-was-meant-to-see',
    title: 'A 2.5MB PNG that only existed as a fallback',
    date: '2026-08-01',
    summary:
      'sharp ignores the quality setting on PNG unless you pass it explicitly, so the fallback behind AVIF and WebP shipped fully lossless at 2.5MB.',
    tags: ['Images', 'Build tooling', 'Performance'],
    commit: 'e2c4d9d',
    body: `The image pipeline generates AVIF, WebP, and a legacy fallback for every source image, at a ladder of widths. Quality defaults live in one config: \`{ avif: 55, webp: 78, jpg: 80, png: 90 }\`.

\`subject-1024.png\` was **2.5MB**.

## Why

sharp encodes PNG fully lossless unless you pass \`quality\` explicitly, and when it does, it ignores the number entirely. The \`png: 90\` in the defaults was doing nothing. Passing \`quality\` is what enables palette quantisation *at all*. It isn't a dial on an already-lossy encoder, it's the switch that turns the lossy path on.

So the file that only exists as the \`<picture>\` fallback, the one no modern browser ever requests because AVIF and WebP are listed first, was the largest asset on the page.

It's 438KB now, at 42.6dB PSNR measured over the opaque pixels. The transparent regions are excluded from that number because averaging them in flatters the result.

## The second bug in the same pass

The pipeline was clamping requested widths to the source width. Ask for 2560px from a 2048px source and you'd get a 2048px image named \`EJS01845-2560\`.

The name is the problem. The filename is what the \`srcSet\` advertises, so browsers on wide displays selected that candidate believing it carried 2560px of detail, and got a 25% upscale. A silent quality regression that presents as a working image.

It now **skips** an oversized width with a warning rather than clamping it, with a 2% tolerance so a 1023px source still satisfies a 1024px request. Skipping has a cost, since dropping a width means editing the \`srcSet\` at the call site too, but a missing candidate is a build-time chore and a lying candidate is a shipped defect.

## The pattern

Both bugs are the same shape: a value that looked like it was configuring something and wasn't. \`png: 90\` looked like a quality setting. \`-2560\` looked like a width. Neither failed, which is why both survived several releases.

The pipeline now prints what it actually emitted, dimensions and bytes per variant, so the next one of these is visible in the build log rather than in a bandwidth bill.`,
  },
  {
    slug: 'a-750kb-wav-for-a-joke',
    title: 'The largest asset on the site was a sound effect nobody heard',
    date: '2026-08-01',
    summary:
      'A module-scope new Audio() meant a 750KB WAV downloaded on every route, for an easter egg that fires on clicking a nav item you are already on.',
    tags: ['Bundle size', 'Performance', 'Audio'],
    commit: 'af3ca02',
    body: `There's a joke in the header. Click a nav item for the section you're already looking at and a small sound plays. It's the kind of detail that costs nothing and makes the thing feel built by a person.

It cost 750KB on every page load.

The audio was constructed at module scope:

\`\`\`ts
const sound = new Audio('/easter-egg.wav')
\`\`\`

That single line does two things I didn't think about when I wrote it. It runs at import time, so the moment the header module is evaluated the browser starts fetching. And because the header ships on every route, the fetch happened on \`/\`, on \`/resume\`, on \`/privacy\`, for every visitor, whether or not they ever clicked anything.

A 750KB WAV. The largest single asset on the site, larger than the hero photography, downloaded universally, to support an interaction most visitors will never trigger and none of them can discover on purpose.

## Two fixes, both obvious in hindsight

**The format was wrong.** WAV is uncompressed. The same clip as AAC is **16KB**, a 98% reduction, for a short sound effect where the difference is inaudible.

**The construction was in the wrong place.** \`new Audio(src)\` is now built inside the play handler, on first trigger, and cached after. Visitors who never click pay nothing at all.

## What I actually got wrong

The interesting part isn't the WAV. It's that I'd been treating "is this in the initial JS bundle?" as the whole question about page weight, and this was invisible to that check. It isn't a module, it doesn't appear in the bundle analysis, and no build tool warns about it. It's a side effect at import time that reaches out to the network for something the bundler never sees.

The same shape as the react-markdown problem, at a different layer: a cost incurred at import time, for a feature used later or never. Worth searching for module-scope \`new Audio\`, \`new Image\`, and \`fetch\` before assuming the bundle report is the whole story.`,
  },
  {
    slug: 'the-twelve-function-cap',
    title: 'A green build that failed to deploy, and the 12-function cap that caused it',
    date: '2026-07-31',
    summary:
      'Vercel Hobby allows 12 serverless functions per deployment. Adding the 13th builds fine, then fails to deploy, with the reason visible only in the REST API.',
    tags: ['Vercel', 'Deployment', 'Serverless'],
    commit: 'f8cdda1',
    body: `I wanted a retention job: a daily cron that prunes derived telemetry older than six months, matching the window the schema documents. One new file at \`api/cron/prune.ts\`, one \`crons\` entry in \`vercel.json\`. Fifteen minutes of work.

The build went green. The deploy failed.

Not the build. The **deploy**, as a separate step afterward, and the dashboard reported it in a way that told me nothing useful. The actual reason was that Vercel's Hobby plan caps a deployment at 12 serverless functions, \`api/\` was already at 12, and \`prune.ts\` was the 13th.

I found that out by querying the Vercel REST API directly for the deployment record. It isn't in the build log, because the build genuinely succeeded, and the failure happens at a stage that has no log of its own.

## Reverting, then making room

The first commit here is a revert. The cron came back out, because a deployable site matters more than a scheduled cleanup.

Then the interesting part: finding a function to give up. The answer was \`api/admin/logout.ts\`, which existed only to clear a cookie. Sign-out is a DELETE on a session, not a resource of its own, so it folded into \`session.ts\` as a method branch and \`api/\` went back to 11. The cron re-landed into the free slot.

That refactor is better REST regardless. It just wasn't going to happen without a platform limit forcing the question.

One wrinkle worth recording: the \`DELETE\` branch of \`session.ts\` runs **before** the \`requireAdmin\` guard, which is otherwise the mandatory first line of every admin handler. A stale or invalid cookie must always be clearable, and a sign-out that requires a valid session leaves anyone holding a broken one with no way out.

## What I keep from this

\`api/\` now sits at 11 of 12, and that number is written in CLAUDE.md next to a warning, because the failure mode is genuinely nasty: the code is correct, the build passes, the tests pass, and production silently stays on the previous deployment. Nothing about it points at "you added a file."

Platform limits that only bite in production are worth writing down the first time you hit them. There is no second discovery, only a second hour spent finding out the same thing.`,
  },
  {
    slug: 'the-session-owns-the-identity',
    title: 'A browser id that changes mid-visit was forking one visitor into two',
    date: '2026-07-31',
    summary:
      'Visitor records keyed off a client-generated UUID in localStorage. When that id changed mid-visit, one person became two rows with half a story each.',
    tags: ['Telemetry', 'Data modelling', 'CRM'],
    commit: 'fb1acb7',
    body: `The CRM behind this site identifies visitors by a UUID the browser generates and keeps in \`localStorage\`. It is pseudonymous by design: no login, no cookie, no fingerprint, just a random value that says "the same browser was here again."

Every write resolved against that id, taken straight from the \`X-Visitor-Id\` header. Which works right up until the id changes in the middle of a visit.

It can. Private browsing evicts \`localStorage\`. Storage quota pressure clears it. A visitor can clear site data mid-session. The value is client-controlled, so it can also just be different.

When it changed, the page views before the change belonged to one row and everything after belonged to another. One person reading one page became two visitors with half a story each, and neither looked like an engaged session.

## The fix is a second id with a different lifetime

A separate session id now travels alongside as \`X-Session-Id\`, generated per visit rather than per browser. Every visitor write resolves through the \`visitor_sessions\` row's \`visitor_id\`, so a browser id that changes mid-visit lands on the identity the session already established. The visit stays whole.

The rule that falls out is easy to get wrong from the outside, so it's written down: persist against the id \`upsertVisitor()\` **returns**, never the header value you passed it. Those are usually the same. When they differ, the returned one is right, and using the header is precisely the bug this fixed.

## The thing that has nothing to do with the bug

\`X-Visitor-Id\` is client-controlled. Any caller can send any UUID, including one they watched somebody else use.

That is fine for what it does, which is grouping analytics rows. It would be a serious hole the moment anything trusted it, so nothing does: sensitive endpoints gate on \`requireAdmin\`, not on an identity header. The distinction is between an identifier and a credential, and a pseudonymous id that arrives in a header a client fully controls is only ever the first one.

Worth stating explicitly next to the code, because "we already know who this is" is a very easy assumption to start making about a field that is always populated and almost always honest.`,
  },
  {
    slug: 'guarding-every-close-path',
    title: 'Four ways to close a drawer, one of them ate your notes',
    date: '2026-07-31',
    summary:
      'The CRM drawer had an unsaved-changes guard on the close button. Escape, the backdrop, and selecting another row each bypassed it.',
    tags: ['UX', 'CRM', 'React'],
    commit: 'f31f857',
    body: `The visitor drawer in the CRM has a free-text Notes field, which is where I write the things a row can't tell me. It's the only content in the dashboard that can't be regenerated from the database, because I typed it.

The close button asked before discarding unsaved edits. I'd written that guard deliberately and considered the problem handled.

There were three other ways to close it. The Escape key. Clicking the backdrop. Clicking a different visitor row, which swaps the drawer's contents without ever "closing" anything. None went through the close button's handler, so none asked, and each one discarded whatever was in the field.

## The mistake was where the guard lived

I had attached it to a control rather than to a transition. A guard on the close button protects the close button. What actually needed protecting was the state change: this drawer, showing this visitor, stops showing it.

Every path now routes through one \`handleSelect\` function, which owns the check. Escape doesn't get its own guard, it calls \`handleSelect\`, and inherits it. Same for the backdrop, same for row selection, and passing \`null\` is what "close" means. The dirty state is reported upward by the detail component through an \`onDirtyChange\` callback, so the list owns the decision and the form owns the knowledge of whether anything changed.

The invariant is now one sentence: **a new close path must route through \`handleSelect\`.** That's a rule someone can actually follow, which the previous arrangement wasn't, because it required knowing that a guard existed somewhere and remembering to replicate it.

## Why this is in an engineering changelog

It's a small bug in an internal tool with one user. It's here because the shape recurs everywhere: a check placed on the *interaction* the developer was thinking about rather than the *state change* it causes. Every alternative route to the same state change silently opts out, and each one gets added later by someone who has no reason to suspect a guard exists.

If a confirmation matters, it belongs on the transition. Anything else is a guard on one door of a building with four.`,
  },
  {
    slug: 'privacy-respecting-visitors-flagged-as-spam',
    title: 'The CRM was flagging privacy-conscious visitors as spam',
    date: '2026-07-30',
    summary:
      'Telemetry sends nothing when Global Privacy Control or Do Not Track is set. The bot heuristic then read that absence of data as suspicious.',
    tags: ['Privacy', 'Telemetry', 'CRM'],
    commit: '59cb53d',
    body: `The telemetry on this site honors Global Privacy Control and Do Not Track. Neither is legally binding in the US, but the site ships a real privacy page making real claims, and honoring an explicit opt-out is the least those claims are worth. When either signal is present, \`initTelemetry()\` returns and nothing is sent.

The CRM also has a heuristic that flags traffic which doesn't behave like a person reading a page: no engagement time, no scroll depth, no session.

You can see it coming. A visitor who sets GPC produces exactly that profile, because the opt-out is *working*. The dashboard was labelling the people who most deliberately expressed a preference as possible spam.

## Why the heuristic wasn't wrong, exactly

It was reading absence of evidence as evidence. Those two populations genuinely look identical in the data:

- A scripted client that requests a page and leaves.
- A person who opted out, so nothing about their reading was recorded.

The difference isn't in the record, it's in *why* the record is empty, and that reason was known at collection time and thrown away. The fix is to keep it: an opted-out visit is marked as such, and the heuristic excludes them rather than scoring them.

The dashboard now says so in the UI too, on the panels where a count would otherwise look wrong. "Activity", not "sessions", because a Do Not Track visitor records no session and a chart that silently omits them without explanation is a chart I'd misread myself in six months.

## The general lesson

Every privacy control you implement creates a population whose data looks broken to whatever you built assuming the data would be there. The opt-out is the easy part. The work is auditing everything downstream that quietly treats missing data as a signal.

I'd honor GPC either way. But it's worth knowing that "we respect Do Not Track" is a claim with consequences several layers away from the code that implements it, and the consequence here was insulting the exact people the feature was for.`,
  },
  {
    slug: 'a-vendor-chunk-for-the-react-runtime',
    title: 'Splitting React into its own chunk so component edits stop busting its cache',
    date: '2026-07-21',
    summary:
      'React, ReactDOM and the scheduler are 60KB gzipped that change a few times a year. They were sharing a hashed chunk with code that changes daily.',
    tags: ['Bundle size', 'Caching', 'Vite'],
    commit: '799ea66',
    body: `Vite fingerprints every emitted chunk with a content hash, which is what makes it safe to serve them with a long cache lifetime: change the contents, change the filename, and a returning visitor fetches the new one automatically.

The corollary is the part worth thinking about. Everything sharing a chunk shares its cache lifetime. One byte different anywhere in it and the whole file is a new URL.

React, ReactDOM and the scheduler come to **189KB raw, 60KB gzipped**, and I update them a few times a year. They were sitting in the same chunk as my application code, which I change several times a day. Every copy tweak invalidated the runtime along with it, and every returning visitor re-downloaded 60KB of a library that hadn't changed since the last release.

## The split

\`\`\`ts
manualChunks(id) {
  if (!id.includes('node_modules')) return undefined
  if (/node_modules\\/(react|react-dom|scheduler)\\//.test(id)) return 'vendor-react'
}
\`\`\`

Deliberately narrow. It is tempting to write "all of \`node_modules\` goes in a vendor chunk", and that's worse: a vendor bundle containing every dependency changes whenever *any* of them is updated, which reintroduces the same problem one level up. The value comes from grouping by **rate of change**, not by whether something came from npm.

React earns its own chunk because it is large and almost static. That's the test.

## What it doesn't do

Nothing here makes the first visit faster. The same bytes arrive, in one more request over a connection that is already open. The entire benefit lands on the second visit and every visit after it, and only for the visitors who return.

Which is worth saying out loud, because caching work photographs badly. It doesn't move the number on a cold-load audit, and if that number is what you're optimising for, this change looks like it did nothing at all.`,
  },
  {
    slug: 'keeping-the-email-signature-out-of-search',
    title: 'My email signature was an indexable page',
    date: '2026-08-01',
    summary:
      'An HTML email signature and its image sat in public/, served on the domain with no robots directive, and were as crawlable as anything else on the site.',
    tags: ['SEO', 'Deployment'],
    commit: '77f2fc5',
    body: `The signature on my email is HTML, built once and pasted into the client. The source lives at \`public/email-signature.html\` with \`public/email.png\` next to it, because keeping it in the repo means it's versioned and I can preview it in a browser.

Anything in \`public/\` is served at the domain root. So \`eric.sh/email-signature.html\` was a live, publicly reachable page, indexable by anything that found it.

Nothing links to it, which is the thing that makes this easy to leave alone for months. It's also not much protection: a URL doesn't need an inbound link to be discovered, and both files were listed in a public repository.

## What that costs

Not much, and it isn't nothing. A page whose entire content is a name, a title, and a contact block is exactly the kind of thin result that gets indexed and then surfaces for a search on my own name, competing with the pages I actually want ranking. Worse, it presents as a page when it is a fragment: no navigation, no context, unstyled outside a mail client.

The image is the same problem in image search, an isolated asset with no page around it.

## The fix

A header rule in \`vercel.json\`:

\`\`\`json
{
  "source": "/(email-signature.html|email.png)",
  "headers": [{ "key": "X-Robots-Tag", "value": "noindex, nofollow" }]
}
\`\`\`

\`X-Robots-Tag\` rather than a \`robots.txt\` \`Disallow\`, and the distinction matters. \`Disallow\` asks a crawler not to *fetch* a URL, which means a page already indexed stays indexed, since the crawler can no longer fetch it to see the directive telling it to leave. \`noindex\` asks it not to *index*, which requires the fetch to succeed. For anything you want removed rather than merely un-crawled, the header is the one that works.

It also covers the PNG, which a meta tag can't: there is nowhere in a PNG to put one.

## Worth a sweep

The general version: everything in \`public/\` is a published URL. Preview files, one-off exports, test pages and design references all end up there because it's the convenient place to put them, and every one is live. Worth listing that directory occasionally and asking, of each file, whether you'd be happy for it to be the first result someone sees.`,
  },
  {
    slug: 'the-browser-helpfully-scrolled-away-from-the-button',
    title: 'Revealing 30 more cards scrolled the page out from under the reader',
    date: '2026-07-18',
    summary:
      'Browser scroll anchoring keeps content stable when things load above you. Inserting cards below the viewport made it follow them down the page.',
    tags: ['UX', 'React', 'Animation'],
    commit: '08e083f',
    body: `The work grid shows 8 cards and a "View All Work" button. Click it and the other 31 render.

The reading position went with them. You'd click the button and end up somewhere further down the page, having lost the thing you were looking at.

## Scroll anchoring

Browsers implement scroll anchoring to fix a real problem: when an image or an ad loads *above* your reading position, the content you're reading gets pushed down, and without intervention the page appears to jump. So the browser picks an anchor element near the top of the viewport and adjusts \`scrollTop\` to keep it visually still.

That heuristic is right almost always. Here it wasn't. The insertion happened below the fold, the anchor it chose sat below the insertion point, and holding *that* element still meant scrolling the document to follow it. The feature designed to stop the page moving was the thing moving the page.

## The fix

Capture \`window.scrollY\` before the state change, restore it in \`useLayoutEffect\` after:

\`\`\`ts
useLayoutEffect(() => {
  if (scrollYBeforeReveal.current === null) return
  window.scrollTo(0, scrollYBeforeReveal.current)
  scrollYBeforeReveal.current = null
}, [showAll])
\`\`\`

\`useLayoutEffect\`, not \`useEffect\`, and that's the whole trick. Layout effects run synchronously after the DOM mutation but **before** the browser paints. The correction lands in the same frame as the insertion, so nothing is ever painted at the wrong offset. In \`useEffect\` it runs after paint, and you get one frame of visible jump: less bad than the original, still clearly a bug.

## The other half

The revealed cards also arrived all at once. The entrance animation staggers by index but caps the delay at 7 steps, deliberately, so a long list doesn't leave the last item waiting seconds to appear. That cap meant everything past the 8th revealed card shared one delay.

So the reveal passes an explicit rolling delay for items beyond the initial count, computed from position *within the newly revealed batch* rather than within the whole list. The stagger reads as a wave either way, and the cap still protects the ordinary scroll-into-view case it was written for.`,
  },
  {
    slug: 'ambient-backdrops-that-freeze-not-vanish',
    title: 'Ambient backdrops, and what reduced motion should actually do to them',
    date: '2026-07-18',
    summary:
      'Drifting gradient blobs and film grain behind every section. Under prefers-reduced-motion they freeze in place rather than disappearing.',
    tags: ['Design', 'Accessibility', 'CSS'],
    commit: '18ab1b9',
    body: `Flat sections were reading as flat. The fix was a \`Backdrop\` component: three large radial-gradient blobs drifting on long cycles (26, 34 and 42 seconds), a 48-second hue rotation across all of them, and an SVG \`feTurbulence\` grain layer over the top to break up the banding that large soft gradients produce on 8-bit displays.

Two decisions in there are worth more than the effect itself.

## Transform only

The blobs are positioned with \`top\`/\`left\`/\`right\` and animated with \`transform\` exclusively. Never with animated positional properties, and never with \`translate\` utility classes at the call site, because the drift animation owns the transform property and anything set there gets discarded the moment the animation starts.

Transform and opacity are the two properties a browser can animate on the compositor without re-running layout or paint. Animating \`left\` on three full-viewport-scale elements for 26 seconds at a time, on every section, is a layout thrash that shows up as jank on exactly the hardware least able to absorb it.

## Reduced motion freezes it, doesn't remove it

The obvious \`prefers-reduced-motion\` implementation is to hide the thing. I think that's usually wrong, and it is wrong here.

The setting says *reduce motion*. It doesn't say remove visual design. Someone who enables it because drifting elements make them ill has not asked for a different, flatter version of the site, and removing the backdrop changes contrast relationships and section separation for a group of people who never asked for that.

So the animations are suppressed and the blobs stay exactly where they are: still visible, still doing their compositional job, no longer moving. The grain, which never moved, is untouched. Same design, no motion.

The same rule applies to the glass blur elsewhere on the site: under reduced motion the animated entrance is dropped and the blur is applied statically, rather than the whole treatment vanishing.

Worth stating as a general position. \`prefers-reduced-motion\` is a request about *movement*, and answering it by deleting the decoration is answering a question nobody asked.`,
  },
  {
    slug: 'nothing-decorative-goes-over-text',
    title: 'I added a pointer spotlight to the work cards, then took it back out',
    date: '2026-07-19',
    summary:
      'A cursor-following highlight on the project cards looked good in isolation and quietly cost the card text some of its contrast.',
    tags: ['Design', 'Accessibility'],
    commit: '593d42e',
    body: `The work cards had a spotlight: a soft radial highlight following the pointer across the card under the cursor. It's a nice effect. I'd seen it on sites I like, it took twenty lines, and it made the grid feel responsive to the mouse.

It shipped on July 18. It came out on July 19.

## What was wrong with it

The highlight rendered over the card, and the card is mostly text: a project title, a description, and tag pills. Every one of those sat on a surface whose luminance now changed depending on where the pointer was.

The contrast I'd checked was the resting contrast. Under the highlight it was lower, and it varied continuously, so there was no single value to test. A decorative layer had made a text contrast ratio a function of cursor position, which is not a property any accessibility check I could write would have caught, because the failing state only exists while a pointer is somewhere specific.

The pattern reads well in the places I'd admired it, and looking again, those were cards with a large image or an icon and very little text. The effect wasn't the problem. Putting it over a paragraph was.

## The rule that came out of it

Nothing decorative goes over text. Backdrops sit behind sections. Grain sits over panel surfaces at low opacity, but never in a way that changes the ink. Hover states on cards move the whole card, with shadow and a small lift, so the feedback is about the object rather than a wash across its contents.

That's a constraint I'd rather have as a rule than as a judgement call each time, because the judgement call is exactly what I got wrong. In isolation the effect looked fine. It looked fine to me, on my display, not reading the text.

The card kept the lift and the shadow. Twenty lines came out, and the grid lost nothing anyone would notice.`,
  },
  {
    slug: 'a-timing-side-channel-in-a-password-check',
    title: 'The admin password check leaked its own length',
    date: '2026-07-21',
    summary:
      'Even with a constant-time comparison, returning early on a length mismatch tells an attacker the length of the real password through response timing.',
    tags: ['Security', 'Auth'],
    commit: '1ecfefd',
    body: `The admin sign-in compared the submitted password against \`ADMIN_PASSWORD\` using \`timingSafeEqual\`, which is the right primitive: it compares two buffers in time proportional to their length and independent of where they first differ, so an attacker can't discover a secret one character at a time by measuring which guesses take longer.

Node's \`timingSafeEqual\` throws if the two buffers have different lengths. The natural way to handle that is a length check first:

\`\`\`ts
if (a.length !== b.length) return false
return timingSafeEqual(a, b)
\`\`\`

That's a side channel. The early return is fast; the full comparison is slower. Submit passwords of different lengths, measure the responses, and the one length that takes measurably longer is the length of the real password. You've learned nothing about the characters, but you have turned an unbounded search into a bounded one, and you learned it from a server that never told you anything but "no".

## The fix

Copy the submitted value into a buffer allocated to the *expected* length, so \`timingSafeEqual\` always runs over the same number of bytes regardless of what was submitted:

\`\`\`ts
const paddedSupplied = Buffer.alloc(expectedBuf.length)
suppliedBuf.copy(paddedSupplied)

const lengthsMatch = suppliedBuf.length === expectedBuf.length
const contentsMatch = timingSafeEqual(paddedSupplied, expectedBuf)

return lengthsMatch && contentsMatch
\`\`\`

The length comparison still happens, and still has to pass. It just no longer decides *whether the expensive operation runs*. Both values are computed on every path before either is consulted.

## Honest scope

Is this exploitable in practice? Probably not. The endpoint sits behind a rate limiter and a constant 1.5-second delay, network jitter across the public internet dwarfs the difference, and it's one deployment of one personal site.

I fixed it anyway, and I'd argue the reasoning generalises. The mitigations that make it impractical are all things that could be relaxed later for unrelated reasons: the delay is there for a different attack, the rate limiter soft-fails open when Upstash is unreachable. A leak that is currently masked by a defence you might tune tomorrow is still a leak. The padded compare costs one allocation, once, on a sign-in.`,
  },
  {
    slug: 'error-boundaries-per-section',
    title: 'One broken section should not take the whole page with it',
    date: '2026-07-21',
    summary:
      'An uncaught render error in React unmounts the entire tree. On a single-page portfolio that means one bad section renders a blank white page.',
    tags: ['React', 'Resilience'],
    commit: '917efd4',
    body: `React's behaviour on an uncaught render error is to unmount the whole tree. That's a deliberate choice and the right default: a component that threw is in an unknown state, and showing a partially-broken UI can be worse than showing nothing.

On this site it meant one section throwing produced a blank white page. No header, no navigation, no contact details. A visitor with no idea anything had gone wrong, and no way to reach me to say so.

Every home section now sits in its own boundary:

\`\`\`tsx
<ErrorBoundary name="Hero"><Hero /></ErrorBoundary>
<ErrorBoundary name="Work"><Work /></ErrorBoundary>
\`\`\`

A section that throws is replaced; the rest of the page renders normally. The \`name\` is what makes the recorded error useful, since it says which section failed rather than which component in the stack.

## The one with a real fallback

Most sections fall back to nothing, and that's correct. If the testimonials carousel breaks, the honest thing is to omit it. A placeholder saying "this section failed to load" is worse than the section quietly not being there.

Contact is different, because Contact is the point:

\`\`\`tsx
<ErrorBoundary name="Contact" fallback={<ContactFallback />}>
\`\`\`

The fallback is a plain \`mailto:\` link and a line saying I'm still reachable. It shares the section's background so the page doesn't visibly break, and it has no form, no validation, and no JavaScript beyond the link, which matters because the reason we're rendering it is that JavaScript in this subtree just failed.

That's the actual design question a boundary asks, and it's per-section rather than global. Not "how do I show an error" but "what is the minimum this section owes the visitor when it can't do its job?" For a photo grid, nothing. For the only way to contact me, an email address.

## What the boundaries feed

Each caught error is reported through the same first-party telemetry as everything else: which section, an error type, no message content. Errors on a static site are almost never something a visitor will report, so if they aren't recorded they don't exist. Several genuine bugs surfaced this way rather than from anyone telling me.`,
  },
  {
    slug: 'optical-icon-sizing-that-changes-no-layout',
    title: 'Arrows look smaller than they measure, and fixing that must not resize the button',
    date: '2026-07-27',
    summary:
      'Light geometric glyphs read undersized next to dense pictograms at identical box sizes. The correction has to be paint-only or icon buttons stop matching.',
    tags: ['Design systems', 'CSS', 'Typography'],
    commit: '9d8d551',
    body: `Set a lucide arrow and a lucide envelope at the same pixel size, put them side by side, and the arrow looks smaller. Both occupy an identical box. The arrow is a few thin strokes with a lot of empty space around them; the envelope fills its box with closed shapes and more ink. The eye reads the ink, not the box.

This is an old typographic problem. It's why a well-cut typeface's round letters overshoot the x-height slightly, so that \`o\` and \`x\` look the same size rather than measuring the same size.

## The correction

A CSS utility, \`.icon-optical\`. The caller sets \`--icon-size\`, which fixes every icon's layout box. Light geometric glyphs then get \`scale: 1.25\`, matched on the \`lucide-<name>\` class lucide stamps on every SVG: \`arrow*\`, \`chevron*\`, \`corner*\`, \`move*\`, \`plus*\`, \`minus*\`, \`check*\`, \`x*\`.

Two things make it work in a component library rather than as a one-off tweak.

**The bump is paint-only.** \`scale\` is a transform, so it changes what's rendered without touching the layout box. That is the whole constraint and the follow-up commit exists because I got it wrong first: an approach that adjusted the size itself made an arrow button 4px wider than a settings button beside it. Icon-only buttons sit in rows in the admin, and a row of squares where one is fractionally larger is far more noticeable than an arrow that reads slightly small. **The correction must never change a button's height or width.**

**CSS beats the call site, deliberately.** \`--icon-size\` on the button drives width and height, which overrides lucide's \`size\` prop and any \`h-4 w-4\` class. So \`size={14}\` inside a Button does nothing. That looks like a bug when you first hit it and it's the point: the button's size axis owns its icon geometry, otherwise every call site is free to introduce a button whose icon doesn't match the others.

## Why it's worth the trouble

Nobody will ever say "the arrow is optically undersized." They'll say a set of buttons looks slightly off and not be able to name why, or they'll say nothing and think a little less of the work.

The rule of thumb it left me with: if a correction like this needs to change layout to work, it's the wrong correction. Optical adjustment belongs in paint, where being wrong costs a look rather than an alignment.`,
  },
  {
    slug: 'a-utility-that-only-existed-in-development',
    title: 'The glass panels lost their blur in production and nowhere else',
    date: '2026-04-22',
    summary:
      'A Tailwind v4 utility written as a plain CSS class works in dev and is dropped by the production build. The fix was one keyword.',
    tags: ['CSS', 'Tailwind', 'Build tooling'],
    commit: 'b6d50c5',
    body: `The glass panels on this site get their frosted look from one shared class:

\`\`\`css
.glass-blur {
  @apply backdrop-blur-md;
}
\`\`\`

That worked perfectly in \`vite dev\` and produced flat, unblurred panels on the deployed site. Same code, same browser, different result.

## What Tailwind v4 changed

In v4, \`@apply\` inside a hand-written CSS rule isn't a registered utility. The dev server is permissive enough not to care. The production build runs an optimisation pass that only keeps what it can account for, and a plain class using \`@apply\` isn't in that accounting, so the declaration is dropped.

The fix is one keyword:

\`\`\`css
@utility glass-blur {
  @apply backdrop-blur-md;
}
\`\`\`

\`@utility\` registers it as a first-class utility. It now participates in the build the same way \`p-4\` does, and survives.

## Why it's worth a note

A one-word diff is not interesting. The failure mode is.

Every check I habitually run happens in dev: the dev server, Storybook, the browser I have open. This bug is invisible to all of them by construction. It only appears in the artifact nobody looks at closely, and it fails *silently*: no build error, no console warning, no missing file. Panels are just slightly less pretty, in a way you would plausibly attribute to the design.

That's the second entry in this changelog whose real content is "the build succeeded and the output was wrong." It's why \`npm run preview\` against the actual production bundle is now part of how I check anything visual, rather than a thing I do before a deploy if I remember.

One consequence that outlives the bug: \`.glass-blur\` is a real utility now, not a Tailwind class, so it can't be overridden with \`backdrop-blur-*\` at a call site. That surprises people. It's written down next to the definition for that reason.`,
  },
  {
    slug: 'one-place-that-owns-a-colour',
    title: 'Every button had its own idea of what "primary" meant',
    date: '2026-04-24',
    summary:
      'Surface colours were written by hand at each call site, so the same variant name rendered differently across the site and contrast was unauditable.',
    tags: ['Design systems', 'Refactoring', 'Accessibility'],
    commit: '86631e8',
    body: `The buttons started the way buttons usually start. Each one got classes at the call site: \`bg-blue-950 text-white\`, or \`glass-blur bg-white/10 border-white/20\`, whatever looked right in that spot.

By the time there were three surface-bearing components (Button, Panel, Pill), "primary" meant four slightly different things depending on where you looked, and nobody had decided any of it.

## The actual cost

Inconsistency is the visible symptom and the least of it. Two things were worse.

**Contrast couldn't be audited.** To answer "does every primary button pass contrast on both canvases?" you have to find every primary button, because each one is its own independent fact. There is no place to check.

**A fix couldn't propagate.** When one button's hover was found to be illegible on dark, that fixed one button.

## One map

Everything now derives from \`SURFACE\` and \`SURFACE_HOVER\` in \`variants.ts\`, keyed by variant name. Button, Panel and Pill read from the same maps. Call sites name a variant; they never write a surface colour.

The rule is stated plainly: never hand-roll surface classes, use a variant, and if none fits, add one. That last clause matters. A system with no escape hatch gets bypassed, and a bypassed system is worse than none because it's inconsistent *and* misleading.

## What it enabled later

The payoff wasn't consistency, it was that the surfaces became a place where reasoning could accumulate. \`variants.ts\` now carries contrast ratios in comments next to the values that produce them, and records decisions that would otherwise be re-litigated or silently undone.

The one I'd point at: \`primary\`'s hover used to darken, which is the light-canvas idiom. But \`primary\` is also the CTA on dark sections, and against \`blue-950\` the darkened hover fell to **1.90:1**, so the button dissolved into the panel behind it at the exact moment someone pointed at it. The hover now gains chroma at fixed lightness instead, holding the boundary at 3.76:1 while still reading as a clear state change.

That is a genuinely non-obvious finding, and it was findable only because there was one hover definition to examine rather than a dozen. It applied everywhere the moment it was fixed.`,
  },
  {
    slug: 'glass-panels-fail-contrast',
    title: 'Frosted glass looks expensive and fails contrast, so I shipped a switch',
    date: '2026-04-24',
    summary:
      'A translucent panel takes its contrast from whatever is behind it, which on a photo hero is unknowable. The fix was an opaque mode, offered to the reader.',
    tags: ['Accessibility', 'Design', 'UX'],
    commit: '481ff4a',
    body: `The chat panel and the contact form are glass: translucent, blurred, sitting over the hero photograph. It's the look I wanted and it's the look the site is partly built around.

It is also unauditable for contrast, and not because I chose bad colours.

Contrast is a relationship between two luminances. On a glass panel, the effective background is a composite of the panel's own translucent fill and *whatever pixels are behind it*, which here is a photograph. Different pixels, different contrast. Scroll the parallax and the numbers move. There is no single figure to test, and the worst case is set by the brightest region of an image I might swap next month.

You can push the fill toward opaque until the worst case passes, at which point it isn't glass any more.

## The switch

Both panels have a toggle that swaps the \`glass-light\` variant for \`white\`: an opaque surface, dark text, a fixed and checkable contrast ratio. \`aria-label="Toggle high-contrast mode"\`, and it's a visible control rather than something buried.

I resisted this for a while because a toggle can be a way of declining to make a decision. I don't think it is here. The two states are genuinely different products for different people: one is the designed thing, the other is guaranteed legible, and no single fill is both. Offering the choice beats picking a compromise that is neither.

What makes it honest rather than an alibi is that the default has to be defensible on its own. The glass state isn't a knowingly-broken mode redeemed by an opt-out. It is tuned as far toward legible as it can go while remaining the effect, and the toggle covers the residual case the physics won't let me close.

## Watching whether it gets used

The toggle emits an \`ada_toggle\` event through the first-party telemetry, recording only that it was flipped and in which direction.

That's the part I'd defend most. A control like this is easy to ship and forget, and the two failure modes look identical from the code: nobody needs it, or nobody can find it. Usage is the only thing that distinguishes them. If it turns out people reach for it often, that isn't a vindication of the toggle, it's evidence the default is wrong.`,
  },
  {
    slug: 'the-esm-extension-that-only-production-needs',
    title: 'Imports that resolve locally and 500 in production',
    date: '2026-04-26',
    summary:
      'Node ESM requires the file extension on relative imports. The bundler in dev resolves them anyway, so every API route worked until it was deployed.',
    tags: ['Node', 'Deployment', 'Serverless'],
    commit: 'd96e682',
    body: `Every serverless function under \`api/\` imports shared helpers:

\`\`\`ts
import { sql } from './_lib/db'
\`\`\`

That is how the import is written everywhere else in this project and it works locally. Deployed, the function returns a 500 and the log says it cannot find the module.

## Two resolvers

Node's native ESM loader implements the spec: a relative specifier is a URL, and URLs are not guessed at. \`./_lib/db\` means a file named exactly \`db\`, which does not exist. It will not try \`.js\`, \`.ts\`, or \`/index.js\` on your behalf. That extension-guessing is a CommonJS behaviour, and ESM deliberately dropped it.

Bundlers kept it, because it's convenient and because every codebase expects it. So in dev the code passes through a resolver that guesses, and in production it runs on the one that doesn't.

The fix is to write what the spec wants:

\`\`\`ts
import { sql } from './_lib/db.js'
\`\`\`

\`.js\`, in a TypeScript file, pointing at a file that is currently \`db.ts\`. That looks wrong the first time and it's correct: the specifier describes the **emitted** module graph, not the source, and TypeScript deliberately does not rewrite it.

## What makes it nasty

Not the fix, which is mechanical. The shape of the failure:

- Only relative imports are affected. Package imports resolve through \`node_modules\` and are fine, so most of the file looks like a counter-example to the rule.
- It's invisible until deploy. Type-check passes, dev works, the build succeeds.
- It fails at **runtime**, per-function, so a route can be broken while the rest of the site is perfect.
- Adding one shared helper to a route that didn't have one reintroduces it months later.

That last point is why the follow-up commit is documentation rather than code. A gotcha you can reintroduce by writing an ordinary-looking import isn't fixed by fixing it once, and the rule now lives in the project docs where the next person adding a route will hit it.`,
  },
  {
    slug: 'a-resume-that-prints',
    title: 'The resume needed to be one page on paper and a full page on screen',
    date: '2026-05-07',
    summary:
      'Rather than maintain a separate PDF, the resume route carries a print stylesheet and a condensed copy variant that only the printed version uses.',
    tags: ['Print CSS', 'Design', 'Content'],
    commit: '58788c7',
    body: `People ask for a resume as a file. The obvious answer is to keep a PDF next to the web page, and the obvious problem with that is two copies of the same facts, one of which is always slightly out of date. Usually the one you sent.

So there is no PDF artifact. \`/resume\` prints to one, via \`@media print\`, and the browser's own "Save as PDF" is the export.

## Printing is a different medium, not a narrower screen

Treating print as a small viewport gets you something technically correct and clearly not designed. The specific differences that needed handling:

**Ambient backgrounds have to go.** The dark hero, the drifting blobs, the film grain: on screen they carry the page, on paper they are a solid ink field. The \`Backdrop\` gets \`print:hidden\` explicitly, because it renders child elements with their own backgrounds and the section's own \`background: none\` print rule can't reach them.

**Entrance animations have to be inert.** Content revealed by a scroll observer is content that might print at \`opacity: 0\`. Everything settles to its final state in print.

**Layout reflows rather than shrinks.** Job entries that sit as three lines on screen collapse into one on paper, because vertical space is the scarce resource and there is no scrolling to absorb it.

## The part I didn't expect

Layout wasn't enough. The prose was too long for one page and cutting it hurt the web version, which has room.

So the data carries an optional second copy. \`ResumeJob\` has \`descriptionPrint\` alongside \`description\`, and the summary has \`summaryPrint\`. Same facts, fewer lines, used only by print, falling back to the full text when absent.

That sounds like the duplication I was trying to avoid, and the difference is that it's *optional and adjacent*. It sits in the same object, so an out-of-date print variant is visible while editing the real one, rather than in a binary somebody has to remember to regenerate.

The rule that emerged: older roles condense hardest. That's what keeps a one-page resume weighted toward recent work instead of spending its lower half on a job from 2011, and it's an editorial decision that print forced and the web version quietly needed too.`,
  },
  {
    slug: 'a-content-security-policy-with-one-hole-left',
    title: 'Hardening the headers, and the one exception I could not close',
    date: '2026-05-13',
    summary:
      'A CSP, HSTS, rate limiting on the public endpoints and a cap on event payloads. script-src still needs unsafe-inline, and removing it breaks JSON-LD silently.',
    tags: ['Security', 'CSP', 'Deployment'],
    commit: '621f26d',
    body: `Three public endpoints write to a database: \`/api/chat\` calls an LLM, \`/api/contact\` sends email, \`/api/events\` records interactions. All three cost money per request and none of them required anything of the caller.

This commit added the boring layer that should exist before any of that ships.

**Rate limiting** on every public endpoint, backed by Upstash. The limiter soft-fails open if Upstash is unreachable, which is a deliberate tradeoff in the same family as the [second factor that fails open](/notes/a-second-factor-that-fails-open): a rate limiter that fails closed converts a third-party outage into a total site outage.

**A cap on event payloads**, because \`/api/events\` accepts a metadata object and an endpoint that stores arbitrary client-supplied JSON without a size limit is a storage bill with a stranger's name on it.

**A Content Security Policy**, plus HSTS, \`X-Content-Type-Options\`, \`X-Frame-Options\`, a referrer policy and a permissions policy.

## The hole

\`script-src\` carries \`'unsafe-inline'\`, and it is exactly as bad as it sounds: it disables the part of CSP that would otherwise stop an injected \`<script>\` from executing.

It's there because the structured-data blocks are inline \`<script type="application/ld+json">\` elements, and CSP applies \`script-src\` to those. Remove \`'unsafe-inline'\` and every JSON-LD block on the site stops being parsed. Nothing breaks visibly. The pages render identically and the rich search results quietly stop working, which is the worst possible failure profile for something you'd only remove in order to be safer.

The correct fix is a nonce or a hash per block, which needs the value to be generated per response and threaded into the HTML. On a static build served from a CDN that is real work, and it's on the list.

Until then the honest position is: this policy meaningfully constrains what can be loaded and connected to, and does not constrain inline execution. \`connect-src\` is now \`'self'\` alone, which was only possible after Google Analytics came out, so an exfiltration attempt has nowhere to send anything even if it ran.

Worth writing down as a known gap rather than filed as done. A CSP with \`'unsafe-inline'\` in \`script-src\` still reads like a security control in a checklist, and half of what it implies isn't true.`,
  },
  {
    slug: 'a-metric-that-had-never-once-been-true',
    title: 'The returning-visitor metric had never fired on a real person',
    date: '2026-08-03',
    summary:
      'It counted days with a session. Sessions are the one source a real visitor can be entirely missing from, so it reported a 0% return rate.',
    tags: ['Telemetry', 'Data modelling', 'CRM'],
    commit: '1385ef0',
    body: `The CRM has a `+"`Returning`"+` tag and a return-rate dial. Both answer the same question: did this visitor come back on a different day? Two visits twenty minutes apart is one sitting, not a return.

Both counted distinct days on which the visitor had a **session**.

Measured against the live table, that reported a **0% return rate**, and the tag had never once fired on a real visitor in the CRM's entire history. A metric reading zero forever is easy to accept, because "nobody comes back to a personal site" is a completely plausible thing for a number to be telling you.

## Why sessions were the wrong source

\`visitor_sessions\` is the one table a genuine visitor can be **completely absent from**.

Someone who sets Global Privacy Control records no session at all, by design, because [the telemetry honours the opt-out](/notes/privacy-respecting-visitors-flagged-as-spam). The table also postdates the earliest data in the database, so every visitor from before it existed had zero session days no matter how often they came back. And a visitor can chat or submit the contact form, which are the two most engaged things anyone does here, while producing a single session row or none.

So the query asked "on how many days did this person have a session" when the question was "on how many days did this person do anything."

## Counting activity instead

Both now resolve over the union of four tables: \`visitor_sessions\`, \`page_views\`, \`chat_messages\` and \`contact_submissions\`. Distinct UTC days with any recorded activity.

After the change the 30-day dial reads **2.6%**, and the tag fires on the visitors who genuinely came back. One chatted across four days before converting. Another chatted in May and returned in July.

It is not a large rate. It is the true one, and it was worth finding, because the previous answer was not a smaller version of the truth. It was a different question.

## The part that will bite later

The four sources have **different retention**. \`page_views\` and \`visitor_sessions\` are pruned at six months; chats and contact submissions are not. So an all-time activity-day count can outlive the sessions behind it, and a visitor's history can legitimately show more activity days than there is session data to explain.

Inside the 30-day dial nothing has been pruned, so it doesn't arise there. It is written down anyway, next to both queries, along with the rule that matters most: the row tag and the dial answer the same question from two different code paths, so **change both together.**

The general shape is one I keep meeting. A metric that is quietly, uniformly wrong reads exactly like a metric that is right and boring, and nothing about a zero looks like a bug.`,
  },
  {
    slug: 'spotting-fake-chrome-by-its-version-number',
    title: 'Real Chrome stopped sending a build number in 2023, and scrapers did not notice',
    date: '2026-08-03',
    summary:
      'Chrome froze its UA at major.0.0.0 with UA reduction in Chrome 113. A UA claiming 113 or newer with a build number is therefore not Chrome.',
    tags: ['Bot detection', 'Telemetry', 'CRM'],
    commit: '1385ef0',
    body: `Most bot detection by user-agent string is a losing arms race: you list the strings you have seen, anything unlisted walks straight through, and the list is stale the week you write it.

There is one signal here that works differently, because it relies on something real Chrome *stopped* doing.

## User-agent reduction

Chrome spent years shipping a full four-part version in its UA, like \`Chrome/98.0.4758.102\`. Those last two components are a build and patch number, and they are a fingerprinting surface. As part of user-agent reduction, completed in **Chrome 113**, Chrome froze the version it reports at \`<major>.0.0.0\`.

Real Chrome 113 or newer sends \`Chrome/113.0.0.0\`. It does not send a build number. It cannot.

So a UA claiming Chrome 113 or above **with** a build number, something like \`Chrome/149.0.7827.0\`, did not come from Chrome. It is Chromium, or Chrome for Testing (which is what Puppeteer and Playwright ship), or a scraper reciting a version string it copied from somewhere and then incremented to look current.

That last case is the satisfying one. The strings that look *most* plausibly up to date are the ones that give it away, because a real browser at that version would be less specific, not more.

## Making it a rule rather than a list

Three constraints keep the false-positive rate where I want it.

**Major 113 or newer only, never older.** Every pre-reduction Chrome legitimately sent a build number, so the rule cannot apply below 113. Chrome's final Windows 7 release was 109, and someone pinned there is a person on an old machine, not a bot. This costs real recall: the Chrome 96 and 99 scrapers sitting in my visitor table are let straight through. That is the correct trade. A flag I do not trust is a flag I will start ignoring.

**Chromium forks are skipped.** Edge, Opera, Samsung Internet and WebView all embed \`Chrome/…\` in their own UA and do not all follow the reduction on the same schedule. Any of them could legitimately carry a build number.

**It flags, it does not block.** Nothing is denied a page. The row gets a \`Spoofed\` tag so I can discount it when reading the dashboard.

## Why this one holds up

It isn't a blocklist. It's a consistency check against a documented, dated change in how a real browser behaves, so it does not decay as new scrapers appear. Faking it correctly requires knowing that being *less* specific is what looks legitimate, which is the opposite of the instinct that produced the string in the first place.

The general version: the strongest signals are usually not "this looks like a known bad thing." They are "this claims to be a thing that does not behave this way."`,
  },
  {
    slug: 'truncating-a-uuid-from-the-middle',
    title: 'Cutting an id to its first 8 characters made it useless for the one thing it is for',
    date: '2026-08-03',
    summary:
      'The visitor column sliced UUIDs in JS, so copying a cell gave you a stump. Truncating from the middle in CSS keeps the whole value selectable.',
    tags: ['UX', 'CSS', 'Accessibility'],
    commit: '49e3df1',
    body: `A v4 UUID is 36 characters. The CRM's Visitor column is 128 to 144 pixels wide. Something has to give.

It used to give in JavaScript: cut the string to its first 8 characters and render that. Which is fine to look at, and quietly destroys the column's only real use.

**Copying a cell gave you a stump.** The reason I ever touch a visitor id is to paste it into a SQL \`where\` clause. A \`.slice()\` puts eight characters on the clipboard, so every lookup meant opening the detail drawer to get the value the table was already showing me part of.

**The cut was silent.** Nothing on screen said the value continued. An 8-character string just looks like a short id.

## Doing it in CSS instead

The approach is [Wes Bos's CSS truncate-from-the-middle tip](https://wesbos.com/tip/css-truncate-text-from-middle), and it is worth reading in its original form because the whole thing is about five declarations. A flex container with \`white-space: nowrap\` and \`overflow: hidden\`, holding two spans: the first gets \`flex-shrink: 1\` and \`text-overflow: ellipsis\`, the second gets \`min-width: fit-content\` so it never gives up any of its characters. The head absorbs all the pressure, the tail is immovable, and the browser does the arithmetic.

What that buys, applied here: the whole id sits in the DOM and the browser decides how much of it fits. Two things fall out for free:

- **Selecting the cell copies the entire id**, middle included. The ellipsis is generated content, so it is not in the text.
- **It is width-reactive with no breakpoints.** The phone card has more room than the table cell, so it simply shows more of the id. No second rule anywhere.

Screen readers get the whole value from an \`sr-only\` span, and the visible halves are \`aria-hidden\`. That matters more than it first looks: the two halves read as one contiguous string and the ellipsis is never announced, so without the override the truncated form is not heard as a shortened id, it is heard as *a different id*.

## The artifact I decided to keep

The head's shrunk box is a fractional number of characters wide, so up to one character of slack can sit between the ellipsis and the tail. Measured 4.3px of a 7.4px character at \`md\`, and 0 at \`lg\`.

\`round(down, calc(100% - 4ch), 1ch)\` looks like the fix and is not: the percentage resolves against a flex container that is itself sized by this span, and the circularity puts the slack straight back. Pinning the head to a fixed \`ch\` count does remove it, at the cost of hardcoding a character budget per breakpoint, which is exactly the rigidity this replaced.

So it stays. It is identical on all 25 rows at a given width, which is why it reads as spacing rather than as damage, and the ellipses still line up in one column because the font is monospace and the table is \`table-fixed\`. That alignment is the entire reason the column is monospace.

To be clear about the boundary: the flex mechanism is Wes Bos's and I would not have arrived at it. What I added on top is the screen-reader handling, a configurable tail length, and the decision to live with the sub-character slack rather than trade it for a hardcoded budget. That is roughly the right split for a good tip. It hands you the mechanism, and the work left is deciding what it has to survive in your own context.

Worth writing down mainly for the first point. Truncation is presentation, and doing it to the data instead of to the pixels takes something away from the user that the design never intended to remove.`,
  },
  {
    slug: 'clearing-a-filter-killed-the-keyboard',
    title: 'Clearing a filter killed the keyboard, because the focused button stopped existing',
    date: '2026-08-03',
    summary:
      'The Clear row unmounted while holding focus. The browser handed focus to body, outside the subtree listening for keys, and Escape and the arrows died.',
    tags: ['Accessibility', 'React', 'UX'],
    commit: '05edb4e',
    body: `The Work grid and the notes index used to show one dismissible button per active tag, inline beside the sort control. That row grows a control per selection. At four tags it wrapped onto a second line and pushed the grid down, and every addition shoved the sort dropdown further from the grid it sorts.

It was also the only view of the tag vocabulary, and it could only ever show tags that were already picked. The notes index has 37 tags and the work grid 24. A reader could filter by a tag they happened to see on a card, and the rest may as well not have existed.

So: a \`MultiSelect\`, reusing \`Dropdown\`'s trigger, portal and keyboard model with a set-valued selection. One fixed-width control however many tags are on, and the panel carries the whole vocabulary without spending any layout on it.

## The bug worth writing down

The panel has a Clear row at the top, which appears only when something is selected. Clear it with the keyboard and the whole control went dead: Escape did nothing, the arrow keys did nothing, and it stayed that way until you clicked back into the panel.

The row you just activated is the row that unmounts. The browser answers a focused element disappearing by moving focus to \`<body>\`, and \`<body>\` is outside the React subtree whose wrapper holds the key handler. Nothing was broken. Every listener was still attached to a subtree that no longer contained the focus.

This is a general shape and I had not run into it before: **an element that removes itself is an element that hands your focus somewhere you did not choose.** It does not throw, nothing logs, and it only reproduces if you drive the control the way a keyboard user does. Clicking Clear with a mouse hides it completely, because you are about to click again anyway.

The fix is two-sided. Refusing the focus on \`mousedown\` keeps it where it already was, and an explicit refocus covers a click that lands some other way. Both, because either alone leaves a path uncovered.

## Two more that only show up at real size

**The panel opens upward when there is more room above.** \`Dropdown\` never needed this because its lists are three or four items. A 37-tag list pinned below a trigger sitting near the fold is simply unreachable, and it was, at the exact viewport heights a phone has.

**Position is recomputed on scroll and resize, listening with \`capture\`.** \`position: fixed\` coordinates measured once go stale the moment the page moves underneath them, and unlike a select-one dropdown this panel stays open long enough for that to happen: choosing an option keeps it open, which is the entire point of it. Capture rather than bubble so it tracks any scrolling ancestor, not only the window.

## One deliberate difference from Dropdown

\`role="option"\` sits on the \`<li>\` itself rather than on a \`<button>\` inside it. A listbox option's contents are meant to be presentational, and since focus never leaves the trigger or the filter field, an inner button contributes nothing except a second and wrong accessibility tree.

The option lists themselves are derived from the data at both call sites rather than hand-listed, so a tag added to \`work.ts\` or \`notes.ts\` is filterable with no second edit, and a tag no item carries can never be offered and then filter to an empty grid.`,
  },
  {
    slug: 'filters-that-left-no-trace',
    title: 'Keeping filters out of the URL made them invisible to my own analytics',
    date: '2026-08-03',
    summary:
      'A filtered list has no distinct content, so it gets no address. That also left page views unable to tell a narrowed list from a whole one.',
    tags: ['Telemetry', 'CRM', 'Privacy'],
    commit: '026aa11',
    body: `Both filterable indexes on this site keep their filter state in React and out of the URL. That was a deliberate SEO decision: a filtered view has no distinct title and no distinct content, and giving it a crawlable address puts a pile of near-duplicate URLs in front of a crawler that already has the canonical list.

I still think that is right. What I had not noticed is what it costs on the other side. \`page_views\` records \`/notes\` identically whether the list was read whole or narrowed to two tags, so I had no signal at all for which topics people come here looking for. The decision that keeps the URLs clean is the same decision that makes the behaviour unmeasurable, and nothing about the first one announces the second.

## One event type, not two

\`visitor_events\` already had a \`jsonb metadata\` column, so this is a new \`type\` value carrying \`{ section, tags, sort }\` rather than a new table, and rather than one type per surface. Two reasons, both practical.

Every new type costs a hand-run \`ALTER\` against Neon, because \`create table if not exists\` will not widen a check constraint on a table that already exists. Until that migration runs the endpoint accepts the event and the insert is swallowed by its own best-effort catch, so the event silently vanishes. That is a good reason to spend the type budget carefully.

The other is that \`api/\` sits one function below the Hobby plan's cap of 12, and a deploy that exceeds it fails *after* a green build with the reason visible only in the REST API. Reusing an endpoint that already exists is free. Adding one is not.

## The debounce is not cosmetic

The tag control keeps its panel open across picks, so choosing four tags is four state changes describing one decision. Sending per change writes four rows for that decision, and \`/api/events\` allows **10 requests a minute**, a bucket it shares with outbound click tracking. Undebounced, a visitor idly exploring the filters would blow the window and silently lose the outbound click that followed, which is the single most valuable event on the site.

So it waits **800ms** for the controls to settle and sends the resulting selection rather than the change. Three rules fall out of that, and each one is there to stop a row that says nothing:

- **The default state is never reported.** Every visitor lands on it. A row for it would record that the page rendered.
- **Tags are sorted before they go.** The same two tags picked in either order are one filter, not two, so the aggregate can group on them.
- **A state this page load already reported is not reported again.** Toggling a tag off and back on is one decision, revisited.

Clearing the filters is silent for the same reason as the first rule.

## The path the debounce would have eaten

Filter the list, then immediately open a result. That is the most interesting single path through the whole feature, and it is exactly the one an 800ms timer loses, because the document unloads first.

So a settle still pending is flushed on \`pagehide\`, and the request carries \`keepalive\` so it survives the navigation. Verified in Chromium: filter, navigate 100ms later, event still lands.

## What it deliberately does not record

Not the individual toggles, only the selection they arrived at. Not anything typed into the tag search field. Nothing changes for visitors sending Global Privacy Control or Do Not Track, who are still never recorded at all, because the telemetry exits before it reaches any of this. The privacy page names the new category in the same commit, which is a rule here rather than a courtesy.

## The honest gap

A selection that only changed the sort order is recorded and then never surfaced, because the chart ranks tags and a sort-only change names none. It is a row that currently answers no question. I would rather write that down than quietly drop the field and discover in six months that I wanted it.`,
  },
]

/**
 * The canonical order: newest first, ties broken by authored order.
 *
 * `Array.prototype.sort` is required to be stable, which is what makes the two
 * halves of that sentence compatible. Five entries currently share
 * 2026-08-01, and the sequence they sit in is a deliberate editorial choice;
 * sorting on date alone would be free to shuffle them on any engine.
 *
 * Everything reads from this: the index, both sort directions, the prev/next
 * pager, the sitemap, and the Blog JSON-LD. One order, derived once, so a
 * mis-slotted entry can't disagree with itself across four surfaces.
 */
export const notes: Note[] = [...entries].sort((a, b) => b.date.localeCompare(a.date))

/** Lookup for the detail route. Returns undefined for an unknown slug. */
export function noteBySlug(slug: string): Note | undefined {
  return notes.find((n) => n.slug === slug)
}

/**
 * Adjacent entries for the prev/next pager, in the array's authored order.
 * `previous` is the older note and `next` the newer one, reading order rather
 * than array order, which is why they look inverted against the indices.
 */
export function noteNeighbours(slug: string): { previous?: Note; next?: Note } {
  const i = notes.findIndex((n) => n.slug === slug)
  if (i === -1) return {}
  return { previous: notes[i + 1], next: notes[i - 1] }
}
