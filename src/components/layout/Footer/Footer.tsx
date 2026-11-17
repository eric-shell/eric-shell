import { ArrowUpRight } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { CascadeGroup, CascadeItem, Container, useCascade } from '../../ui'
import { navLinks, connectLinks, socialLinks } from '@/data'

/** The hairline above the copyright, drawn left to right when the footer comes into view. */
function Rule() {
  const { inView } = useCascade()
  return (
    <span
      aria-hidden="true"
      className={`block h-px bg-white/[0.18] origin-left transition-transform duration-[1400ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
        inView ? 'scale-x-100' : 'scale-x-0'
      }`}
    />
  )
}

/**
 * One labelled group of footer links. The links are set like the page's
 * headings (Display caps, even tracking), large, since they are the whole right
 * side of the footer; on hover a link brightens and a cyan arrow slides in.
 */
function LinkGroup({ label, links }: { label: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="mb-4 font-sans text-xs font-bold uppercase tracking-[0.16em] text-glow">{label}</p>
      <CascadeGroup as="ul" className="flex flex-col gap-1.5" threshold={0.2}>
        {links.map(({ label: text, href }, i) => (
          <CascadeItem key={text} as="li" index={i}>
            <a
              href={href}
              className="group inline-flex items-center gap-2 font-display font-bold uppercase tracking-display text-[clamp(19px,2.2vw,30px)] leading-[1.1] text-white/80 hover:text-white transition-colors"
            >
              {text}
              <ArrowUpRight
                size={18}
                strokeWidth={2.75}
                aria-hidden="true"
                className="text-glow opacity-0 -translate-x-2 transition-[opacity,translate] duration-300 ease-[cubic-bezier(0.3,1.45,0.5,1)] group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0"
              />
            </a>
          </CascadeItem>
        ))}
      </CascadeGroup>
    </div>
  )
}

/**
 * `className` merges onto the `<footer>` itself, per the convention every
 * component here follows. The admin is the only caller passing one: the
 * dashboard ends in a panel and needs the gap stated rather than inherited.
 */
export default function Footer({ className }: { className?: string }) {
  const year = new Date().getFullYear()

  return (
    // pb-32: the docked chat button (fixed, bottom right) parks in this band at
    // the end of the page instead of over the rule and the copyright line.
    <footer className={twMerge('relative z-50 pt-[72px] pb-32 bg-ink text-white', className)}>
      <Container>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_auto] md:gap-16">
          {/* Left: who, and where else to find me. */}
          <CascadeGroup className="flex flex-col items-start gap-4" threshold={0.2}>
            <CascadeItem index={0}>
              <img src="/logo.svg" alt="Eric Shell" width={170} height={93} className="w-[170px] h-auto" />
            </CascadeItem>
            <CascadeItem index={1}>
              <p className="font-sans text-sm text-[#AEB6DA]">AI Design Systems Engineer</p>
            </CascadeItem>
            <CascadeItem index={2} className="pt-3">
              <div className="flex gap-2.5">
                {socialLinks.map(({ label, href, path }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-11 h-11 rounded-full border border-white/25 flex items-center justify-center text-[#C9D0EC] hover:text-white hover:border-lum hover:bg-lum hover:-translate-y-1 transition-[color,background-color,border-color,translate] duration-300 ease-[cubic-bezier(0.3,1.45,0.5,1)]"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d={path} />
                    </svg>
                  </a>
                ))}
              </div>
            </CascadeItem>
          </CascadeGroup>

          {/* Right: the site. The taller list (the sections) sits on the outside. */}
          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-8 gap-y-10 md:gap-x-14">
            <LinkGroup label="More" links={connectLinks} />
            <LinkGroup label="Sections" links={navLinks} />
          </nav>
        </div>

        <CascadeGroup className="pt-14" threshold={0.2}>
          <Rule />
          <CascadeItem index={1} className="pt-5 leading-none">
            {/* The year is baked into the prerendered HTML at build time and
                read from the clock in the browser. They differ only between New
                Year and the next deploy; without this, that one stale digit
                would make React discard the whole prerendered page. */}
            <span suppressHydrationWarning className="font-sans text-xs leading-none tracking-[0.06em] text-[#9AA3C8]">
              <span className="align-baseline font-mono">©</span> {year} Eric Shell. All Rights Reserved.
            </span>
          </CascadeItem>
        </CascadeGroup>
      </Container>
    </footer>
  )
}
