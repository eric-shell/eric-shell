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

export const adminMdComponents: Components = {
  ...baseComponents,
  a: ({ href, children, ...props }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass} {...props}>
      {children}
    </a>
  ),
}
