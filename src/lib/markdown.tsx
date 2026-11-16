// Type-only, so it is erased at build time and pulls no runtime with it. The
// only value import of react-markdown in the app is the dynamic one inside
// `loadMarkdown` below — keep it that way, or the parser lands back in the
// initial bundle.
import type { Components } from 'react-markdown'
import NoteFigure from './NoteFigure'

const EMAIL_RE = /(?<!\]\(mailto:)(?<!\[)([\w.+-]+@[\w-]+\.[\w.-]+)(?!\w)(?!\]\(mailto:)/g

export function linkifyEmail(text: string): string {
  return text.replace(EMAIL_RE, '[$1](mailto:$1)')
}

const linkClass = 'font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity'

const baseComponents: Omit<Components, 'a'> = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 last:mb-0 [&_li>p]:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 last:mb-0 [&_li>p]:mb-0">{children}</ol>,
  li: ({ children }) => <li className="mb-1.5 last:mb-0">{children}</li>,
  code: ({ children }) => <code className="px-1 py-0.5 rounded bg-blue-100 font-mono text-xs">{children}</code>,
  strong: ({ children }) => <span className="font-semibold">{children}</span>,
  // The prompt asks for no headings, quotes or rules, but the model doesn't
  // always comply, and Tailwind's preflight strips all three to bare unspaced
  // text. Give each a chat-sized form so a stray one still reads as intended.
  h1: ({ children }) => <p className="mb-2 last:mb-0 font-semibold">{children}</p>,
  h2: ({ children }) => <p className="mb-2 last:mb-0 font-semibold">{children}</p>,
  h3: ({ children }) => <p className="mb-2 last:mb-0 font-semibold">{children}</p>,
  h4: ({ children }) => <p className="mb-2 last:mb-0 font-semibold">{children}</p>,
  blockquote: ({ children }) => <blockquote className="mb-2 last:mb-0 border-l-2 border-blue-200 pl-3">{children}</blockquote>,
  hr: () => <hr className="my-3 border-blue-100" />,
}

export function chatMdComponents(onAnchorNavigate?: () => void): Components {
  return {
    ...baseComponents,
    a: ({ href, children, ...props }) => {
      if (!href) return <>{children}</>
      if (href.startsWith('#')) {
        return (
          <a href={href} onClick={onAnchorNavigate} className={linkClass} {...props}>
            {children}
          </a>
        )
      }
      const isExternal = /^(https?|mailto):/.test(href)
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className={linkClass}
          {...props}
        >
          {children}
        </a>
      )
    },
  }
}

/**
 * Long-form components for a note body — the only place on the site that
 * renders headings, code blocks, and blockquotes out of markdown.
 *
 * Kept separate from `baseComponents` rather than extending it: the chat and
 * admin renderers are tuned for short messages inside a narrow panel (tight
 * margins, `text-xs` code) and a note is a full editorial column. Sharing a
 * spacing scale between the two makes both worse.
 *
 * `pre` carries the block-code surface and resets the `code` inside it,
 * because a fenced block with no language tag reaches `code` with no className
 * to distinguish it from an inline span — so the wrapper is the only reliable
 * signal of which one it is.
 */
export const noteMdComponents: Components = {
  img: ({ src, alt, title }) => (
    <NoteFigure src={typeof src === 'string' ? src : undefined} alt={alt} title={title} />
  ),
  // react-markdown wraps a lone image in a paragraph, and a <figure> inside a
  // <p> is invalid. An HTML parser would close the paragraph early; React does
  // not, because it builds the DOM through createElement and never parses, so
  // the bad nesting survives into the live document. Unwrap it here.
  //
  // The test is the source node, not the rendered child's component identity.
  // Identity looks like it should work and does not: react-markdown renders an
  // image through the `img` entry above, so the child's `type` is that wrapper
  // rather than the NoteFigure it returns, and comparing against NoteFigure
  // matched nothing. Verified in a browser afterwards rather than assumed.
  p: ({ node, children }) => {
    const kids = (node?.children ?? []).filter(
      c => !(c.type === 'text' && c.value.trim() === ''),
    )
    if (kids.length === 1 && kids[0].type === 'element' && kids[0].tagName === 'img') {
      return <>{children}</>
    }
    return <p className="font-sans text-base md:text-lg leading-relaxed mb-5 last:mb-0">{children}</p>
  },
  h2: ({ children }) => (
    <h2 className="font-display font-bold uppercase leading-none tracking-tight text-2xl md:text-3xl mt-12 mb-4 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-sans font-semibold text-lg md:text-xl mt-8 mb-3">{children}</h3>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-5 last:mb-0 font-sans text-base md:text-lg leading-relaxed [&_li>p]:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-5 last:mb-0 font-sans text-base md:text-lg leading-relaxed [&_li>p]:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="mb-2 last:mb-0 pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-blue-950/20 pl-5 my-6 text-blue-950/70 [&_p]:mb-3 [&_p]:last:mb-0">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="mb-6 overflow-x-auto rounded-lg bg-blue-950 text-white p-4 font-mono text-xs md:text-sm leading-relaxed [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit [&_code]:text-[length:inherit]">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="px-1.5 py-0.5 rounded bg-blue-100 font-mono text-[0.85em]">{children}</code>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  hr: () => <hr className="my-10 border-blue-950/10" />,
  a: ({ href, children, ...props }) => {
    const isExternal = /^(https?|mailto):/.test(href ?? '')
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className={linkClass}
        {...props}
      >
        {children}
      </a>
    )
  },
}

export const adminMdComponents: Components = {
  ...baseComponents,
  a: ({ href, children, ...props }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass} {...props}>
      {children}
    </a>
  ),
}

let markdownModule: Promise<typeof import('react-markdown')> | undefined

/**
 * The react-markdown module, as ONE promise shared by everything that needs it.
 *
 * `<Markdown>` reads it with React's `use()`, and that is why it has to be the
 * same promise object every time rather than a fresh `import()` per call: React
 * records on the promise itself that it has settled, and only a promise it has
 * already seen settle can be read without suspending.
 *
 * That property is load-bearing on the note pages. They are prerendered and
 * hydrated, and the article sits inside a `CascadeGroup`, whose context changes
 * the moment it scrolls into view. React answers a context change above a
 * not-yet-hydrated Suspense boundary by hydrating it immediately, and if
 * anything inside suspends at that instant it gives up on the prerendered HTML
 * and shows the fallback instead: the article collapsed to one paragraph of raw
 * markdown and re-expanded, a layout shift of 0.47. `NoteArticle` therefore
 * waits on this promise before it renders anything, so by the time `<Markdown>`
 * reads it underneath, it cannot suspend. `React.lazy` could not give that
 * guarantee, because a lazy component only starts loading when first rendered.
 */
export function loadMarkdown() {
  return (markdownModule ??= import('react-markdown'))
}

/**
 * Warm the react-markdown chunk without blocking anything.
 *
 * The chat panel is open at first paint, so the welcome message renders through
 * <Markdown> immediately — but pulling the parser in for that is exactly what
 * the split avoids. Fetching it on idle instead means it downloads while the
 * browser has nothing better to do, and is resident long before the first
 * assistant reply (which is gated on a network round trip to Groq anyway).
 *
 * Lives here rather than beside the component so that file exports nothing but
 * a component (react-refresh/only-export-components).
 *
 * Safe to call repeatedly: `loadMarkdown` hands back the same promise.
 */
export function prefetchMarkdown() {
  if (typeof window === 'undefined') return
  const load = () => { void loadMarkdown() }
  // Typed as possibly-undefined on purpose. lib.dom declares
  // requestIdleCallback as always present, so an `in` check narrows the else
  // branch to `never` and the Safari fallback stops compiling — while older
  // Safari genuinely does not have it.
  const idle: Window['requestIdleCallback'] | undefined = window.requestIdleCallback
  if (idle) idle.call(window, load, { timeout: 3000 })
  else window.setTimeout(load, 1000)
}
