// Type-only, so it is erased at build time and pulls no runtime with it. The
// only value import of react-markdown in the app is the lazy() inside
// components/ui/Markdown — keep it that way, or the parser lands back in the
// initial bundle.
import type { Components } from 'react-markdown'

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
  h2: ({ children }) => (
    <h2 className="font-display font-bold uppercase leading-none tracking-tight text-2xl md:text-3xl mt-12 mb-4 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-sans font-semibold text-lg md:text-xl mt-8 mb-3">{children}</h3>
  ),
  p: ({ children }) => <p className="font-sans text-base md:text-lg leading-relaxed mb-5 last:mb-0">{children}</p>,
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
 * a component (react-refresh/only-export-components). Same module specifier, so
 * it resolves to the same chunk.
 *
 * Safe to call repeatedly: the module registry dedupes, so extra calls are free.
 */
export function prefetchMarkdown() {
  if (typeof window === 'undefined') return
  const load = () => { void import('react-markdown') }
  // Typed as possibly-undefined on purpose. lib.dom declares
  // requestIdleCallback as always present, so an `in` check narrows the else
  // branch to `never` and the Safari fallback stops compiling — while older
  // Safari genuinely does not have it.
  const idle: Window['requestIdleCallback'] | undefined = window.requestIdleCallback
  if (idle) idle.call(window, load, { timeout: 3000 })
  else window.setTimeout(load, 1000)
}
