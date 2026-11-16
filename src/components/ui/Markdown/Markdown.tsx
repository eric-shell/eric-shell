import { Suspense, use } from 'react'
import type { Components } from 'react-markdown'
import { linkifyEmail, loadMarkdown } from '@/lib/markdown'

/*
 * react-markdown is split out of the initial bundle.
 *
 * It carries micromark + hast — 115KB raw, ~35KB gzipped — and it used to sit
 * in the shared `ui` chunk, which every homepage visit downloads before first
 * paint. Nothing renders markdown until the chat has something to say, so it
 * has no business in the critical path. Splitting it took the `ui` chunk from
 * 61KB gzipped to 28KB.
 *
 * The one value import of it in the app is the dynamic `import()` inside
 * `loadMarkdown` (lib/markdown.tsx). A plain
 * `import ReactMarkdown from 'react-markdown'` anywhere puts it straight back
 * into the initial graph.
 *
 * Read with `use()` rather than wrapped in `React.lazy`. They behave the same
 * while the chunk is in flight, but a lazy component cannot be loaded ahead of
 * its first render, and the note pages need exactly that — see `loadMarkdown`.
 */

interface MarkdownProps {
  components: Components
  /** Raw text. Email linkification is applied here, not by the caller. */
  children: string
}

/**
 * Renders markdown, falling back to plain text until the parser lands.
 *
 * The fallback renders the RAW text, deliberately, rather than the linkified
 * form: the linkifier rewrites addresses into `[a@b.com](mailto:a@b.com)`,
 * which reads as markdown source if it is shown before there is a parser to
 * consume it.
 *
 * It mirrors `baseComponents.p` exactly, so the swap costs no layout shift. In
 * practice it is only ever seen for the first frames of the welcome message,
 * which is plain prose — see prefetchMarkdown, which warms the chunk on idle.
 */
export default function Markdown({ components, children }: MarkdownProps) {
  return (
    <Suspense fallback={<p className="mb-2 last:mb-0">{children}</p>}>
      <Parsed components={components}>{children}</Parsed>
    </Suspense>
  )
}

/** Suspends until the parser has loaded, then renders through it. */
function Parsed({ components, children }: MarkdownProps) {
  const { default: ReactMarkdown } = use(loadMarkdown())
  return <ReactMarkdown components={components}>{linkifyEmail(children)}</ReactMarkdown>
}
