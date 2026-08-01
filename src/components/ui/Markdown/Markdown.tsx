import { lazy, Suspense } from 'react'
import type { Components } from 'react-markdown'
import { linkifyEmail } from '@/lib/markdown'

/**
 * react-markdown, split out of the initial bundle.
 *
 * It carries micromark + hast — 115KB raw, ~35KB gzipped — and it used to sit
 * in the shared `ui` chunk, which every homepage visit downloads before first
 * paint. Nothing renders markdown until the chat has something to say, so it
 * has no business in the critical path. Splitting it took the `ui` chunk from
 * 61KB gzipped to 28KB.
 *
 * This lazy() is the ONLY value import of react-markdown in the app. A plain
 * `import ReactMarkdown from 'react-markdown'` anywhere else puts it straight
 * back into the initial graph.
 */
const ReactMarkdown = lazy(() => import('react-markdown'))

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
      <ReactMarkdown components={components}>{linkifyEmail(children)}</ReactMarkdown>
    </Suspense>
  )
}
