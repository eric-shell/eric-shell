import { cn } from '@/components/ui/cn'
import { CascadeGroup, CascadeItem, Container, Label, Section, SocialLink, useCascade } from '../../ui'
import DisplayLink from '../DisplayLink'
import { navLinks, connectLinks, socialLinks } from '@/data'
import { formatDate } from '@/lib/formatDate'

/** The hairline above the copyright, drawn left to right when the footer comes into view. */
function Rule() {
  const { inView } = useCascade()
  return (
    <span
      aria-hidden="true"
      className={`block h-px bg-white/[0.18] origin-left transition-transform duration-[1400ms] ease-settle motion-reduce:transition-none ${
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
      <Label as="p" className="mb-4 text-glow">{label}</Label>
      <CascadeGroup as="ul" className="flex flex-col gap-1.5" threshold={0.2}>
        {links.map(({ label: text, href }, i) => (
          <CascadeItem key={text} as="li" index={i}>
            <DisplayLink href={href} className="text-[clamp(19px,2.2vw,30px)] leading-[1.1]">
              {text}
            </DisplayLink>
          </CascadeItem>
        ))}
      </CascadeGroup>
    </div>
  )
}

interface FooterProps {
  /**
   * `className` merges onto the `<footer>` itself, per the convention every
   * component here follows. The admin is the only caller passing one: the
   * dashboard ends in a panel and needs the gap stated rather than inherited.
   */
  className?: string
  /**
   * When the current page last changed (ISO), from `PAGES` in src/data/pages.ts.
   * Shown beside the copyright, and the same date the page's JSON-LD
   * `dateModified` carries: Google reads the two together. Omitted where the
   * page carries its own dates (the notes) and in the admin.
   */
  updated?: string
}

export default function Footer({ className, updated }: FooterProps) {
  const year = new Date().getFullYear()

  return (
    // pb-32: the docked chat button (fixed, bottom right) parks in this band at
    // the end of the page instead of over the rule and the copyright line.
    <Section as="footer" tone="ink" rhythm="none" className={cn('z-50 pt-[72px] pb-32', className)}>
      <Container>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_auto] md:gap-16">
          {/* Left: who, and where else to find me. */}
          <CascadeGroup className="flex flex-col items-start gap-4" threshold={0.2}>
            <CascadeItem index={0}>
              <img src="/logo.svg" alt="Eric Shell" width={170} height={93} className="w-[170px] h-auto" />
            </CascadeItem>
            <CascadeItem index={1}>
              <p className="font-sans text-sm text-ice/75">AI Design Systems Engineer</p>
            </CascadeItem>
            <CascadeItem index={2} className="pt-3">
              <div className="flex gap-2.5">
                {socialLinks.map(({ label, href, path }) => (
                  <SocialLink key={label} tone="ink" href={href} label={label} path={path} />
                ))}
              </div>
            </CascadeItem>
          </CascadeGroup>

          {/* Right: the site. The taller list (the sections) sits on the outside. */}
          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-8 md:gap-x-14">
            <LinkGroup label="More" links={connectLinks} />
            <LinkGroup label="Sections" links={navLinks} />
          </nav>
        </div>

        <CascadeGroup className="pt-14" threshold={0.2}>
          <Rule />
          <CascadeItem index={1} className="flex flex-col gap-3 pt-5 font-sans text-xs leading-none tracking-[0.06em] text-ice/65 sm:flex-row sm:justify-between">
            {/* The year is baked into the prerendered HTML at build time and
                read from the clock in the browser. They differ only between New
                Year and the next deploy; without this, that one stale digit
                would make React discard the whole prerendered page. */}
            <span suppressHydrationWarning>
              <span className="align-baseline font-mono">©</span> {year} Eric Shell. All Rights Reserved.
            </span>
            {updated && (
              <span>
                Updated <time dateTime={updated}>{formatDate(updated)}</time>
              </span>
            )}
          </CascadeItem>
        </CascadeGroup>
      </Container>
    </Section>
  )
}
