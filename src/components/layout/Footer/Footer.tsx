import { CascadeGroup, CascadeItem } from '../../ui'
import { navLinks, connectLinks, socialLinks } from '../../../data'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-black text-white border-t border-white/10 skew-footer">
      <div className="max-w-[1440px] mx-auto px-6 pt-24 pb-24 flex items-center justify-between gap-12 flex-wrap unskew-inner">

        <nav aria-label="Footer navigation" className="flex gap-12">
          <CascadeGroup as="ul" className="flex flex-col gap-4" threshold={0.2}>
            {navLinks.slice(0, 4).map(({ label, href, Icon }, i) => (
              <CascadeItem key={label} as="li" index={i}>
                <a href={href} className="flex items-center gap-2 font-sans text-sm font-semibold text-white/50 hover:text-white transition-colors">
                  <Icon size={14} />
                  {label}
                </a>
              </CascadeItem>
            ))}
          </CascadeGroup>
          <CascadeGroup as="ul" className="flex flex-col gap-4" threshold={0.2}>
            {connectLinks.map(({ label, href, Icon }, i) => (
              <CascadeItem key={label} as="li" index={i}>
                <a href={href} className="flex items-center gap-2 font-sans text-sm font-semibold text-white/50 hover:text-white transition-colors">
                  <Icon size={14} />
                  {label}
                </a>
              </CascadeItem>
            ))}
          </CascadeGroup>
        </nav>

        <CascadeGroup className="flex flex-col items-end gap-6" threshold={0.2}>
          <CascadeItem index={0}>
            <div className="flex flex-row gap-3">
              <img src="/icon.svg" alt="Eric Shell Icon" className="h-10" />
              <img src="/logo.svg" alt="Eric Shell Logo" className="h-10" />
            </div>
          </CascadeItem>

          <CascadeItem index={1}>
            <div className="flex gap-2.5">
              {socialLinks.map(({ label, href, path }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 hover:bg-white/10 transition-all"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d={path} />
                  </svg>
                </a>
              ))}
            </div>
          </CascadeItem>

          <CascadeItem index={2} className="leading-none">
            <span className="font-sans text-xs leading-none tracking-wider text-white/50">
              <span className="align-baseline font-mono">©</span> {year} Eric Shell. All Rights Reserved.
            </span>
          </CascadeItem>
        </CascadeGroup>

      </div>
    </footer>
  )
}
