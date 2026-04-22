const LINKS_LEFT = [
  { label: 'GitHub', href: 'https://github.com/eric-shell', external: true },
  { label: 'Instagram', href: 'https://instagram.com/ericshell', external: true },
  { label: 'YouTube', href: 'http://youtube.com/ericshell', external: true },
]

const LINKS_RIGHT = [
  { label: 'LinkedIn', href: 'http://linkedin.com/in/ericshell', external: true },
  { label: 'Resume', href: '/files/resume.pdf', download: true },
  { label: 'Contact', href: 'mailto:ericjshell@gmail.com?subject=New%20Website%20Contact', external: true },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-[1440px] mx-auto px-6 flex items-end justify-between gap-8 flex-wrap">

        <nav className="flex gap-12" aria-label="Footer navigation">
          <ul className="flex flex-col gap-3">
            {LINKS_LEFT.map(({ label, href, external }) => (
              <li key={label}>
                <a
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="font-sans text-sm font-semibold text-white/50 hover:text-white transition"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <ul className="flex flex-col gap-3">
            {LINKS_RIGHT.map(({ label, href, external, download }) => (
              <li key={label}>
                <a
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  {...(download ? { download: true } : {})}
                  className="font-sans text-sm font-semibold text-white/50 hover:text-white transition"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <span className="font-sans text-sm text-white/30">{year} | Eric Shell</span>
        </div>

      </div>
    </footer>
  )
}
