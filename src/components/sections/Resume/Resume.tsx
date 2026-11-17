import type { ReactNode } from 'react'
import { FileDown, Mail } from 'lucide-react'
import { cn } from '@/components/ui/cn'
import { Button, CascadeGroup, CascadeItem, Container, H3, Lead, Page, PageHero, Section, SectionTitle, Sheet, descDelay } from '../../ui'
import { certifications, contact, education, headline, intros, jobs, summary, summaryPrint, values } from '@/data/resume'
import type { ResumeIdentity } from '@/data/resume'

/** The earliest year in the work history, so the section's eyebrow can't go stale. */
const FIRST_YEAR = Math.min(...jobs.flatMap(job => (job.dates.match(/\d{4}/g) ?? []).map(Number)))

/**
 * Company / role / dates. Shared by a job entry and by the contract rows that
 * stand in for a description, so the two always read identically — including in
 * print, where `.entry-identity` is what reflows the three lines into
 * company-left / dates-right (see index.css).
 *
 * On screen the same reflow applies from `sm` (company and dates on one line,
 * role under the company), because the entry sits in the 8/12 content column
 * and three stacked lines would leave most of it empty. `stackFromXl` puts a
 * contract back into three lines from `xl`, where the contracts sit side by
 * side and each one is only a third of the column wide.
 */
// Written out in full rather than built from a prefix: Tailwind only generates
// class names it finds whole in the source.
const BAND = {
  sm: {
    root: 'sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-x-8',
    company: 'sm:col-start-1 sm:row-start-1',
    role: 'sm:col-start-1 sm:row-start-2',
    dates: 'sm:col-start-2 sm:row-start-1 sm:justify-self-end',
  },
  smToXl: {
    root: 'sm:max-xl:grid sm:max-xl:grid-cols-[minmax(0,1fr)_auto] sm:max-xl:items-baseline sm:max-xl:gap-x-8',
    company: 'sm:max-xl:col-start-1 sm:max-xl:row-start-1',
    role: 'sm:max-xl:col-start-1 sm:max-xl:row-start-2',
    dates: 'sm:max-xl:col-start-2 sm:max-xl:row-start-1 sm:max-xl:justify-self-end',
  },
}

function EntryIdentity({ company, role, dates, stackFromXl = false }: ResumeIdentity & { stackFromXl?: boolean }) {
  const band = BAND[stackFromXl ? 'smToXl' : 'sm']
  return (
    <div className={cn('entry-identity flex flex-col gap-1', band.root)}>
      <H3 className={cn('text-ink', band.company)}>
        {company}
      </H3>
      <p className={cn('font-sans text-base font-semibold pt-1', band.role)}>
        {role}
      </p>
      <p className={cn('font-sans text-sm font-semibold text-lum-deep', band.dates)}>
        {dates}
      </p>
    </div>
  )
}

/**
 * One section of the resume: its head in the left 4/12 (sticky, so a long
 * section keeps its label in view), the content in the right 8/12. The same
 * split the home page's Testimonials uses. Stacked below `lg`, and in print,
 * where the print grid takes over the layout entirely.
 */
function ResumeSection({
  className,
  eyebrow,
  title,
  children,
}: {
  className: string
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <Section tone="inherit" rhythm="block" className={cn('resume-section', className)}>
      <Container className="grid-split gap-8 lg:gap-20 print:block">
        <SectionTitle
          size="compact"
          sticky
          eyebrow={eyebrow}
          title={title}
          eyebrowClassName="text-lum-deep print:hidden"
          className="resume-section-title"
        />
        {children}
      </Container>
    </Section>
  )
}

export default function Resume() {
  return (
    <Page tone="white" className="resume-root">

      <PageHero className="resume-hero" containerClassName="resume-masthead">
        <SectionTitle
          as="h1"
          mountOnly
          eyebrow="Resume"
          title="Eric Shell"
          className="resume-identity"
          titleClassName="resume-name"
          eyebrowClassName="text-white print:hidden"
          actionClassName="print:hidden"
          action={
            <div className="flex flex-wrap gap-2.5">
              <Button
                href={`mailto:${contact.email}?subject=Resume%20Inquiry`}
                variant="white"
                leftIcon={<Mail size={15} strokeWidth={2.5} aria-hidden="true" />}
              >
                {contact.email}
              </Button>
              <Button
                variant="tint-white"
                onClick={() => window.print()}
                leftIcon={<FileDown size={15} strokeWidth={2.5} aria-hidden="true" />}
              >
                Download PDF
              </Button>
            </div>
          }
        >
          <CascadeItem delayMs={descDelay(1)}>
            <Lead size="lg" className="resume-headline max-w-3xl pt-8">{headline}</Lead>
          </CascadeItem>
        </SectionTitle>

        {/* Print-only contact block — screen users get the buttons above. */}
        <ul className="resume-contact hidden print:block" aria-hidden="true">
          <li>{contact.email}</li>
          <li>{contact.site}</li>
          <li>{contact.linkedin}</li>
          <li>{contact.github}</li>
        </ul>
      </PageHero>

      {/* Print: About + Values + Credentials stack in the left column;
          Work Experience spans the full height of the right column. */}
      <Sheet tone="white" className="print-grid">

        <ResumeSection className="about-section" eyebrow="Profile" title="About">
          <div>
            <CascadeGroup className="flex flex-col gap-6" threshold={0.1}>
              {summary.map((paragraph, i) => (
                <CascadeItem key={i} delayMs={descDelay(i)} className="print:hidden">
                  {/* The first paragraph leads, set like a testimonial quote. */}
                  <p
                    className={
                      i === 0
                        ? 'font-sans text-xl md:text-2xl font-medium leading-[1.4] tracking-[-0.01em] text-pretty max-w-3xl'
                        : 'font-sans text-base md:text-lg leading-relaxed text-ink-soft max-w-3xl'
                    }
                  >
                    {paragraph}
                  </p>
                </CascadeItem>
              ))}
            </CascadeGroup>
            {/* Print swaps the three-paragraph narrative for a single
                condensed profile — see `summaryPrint`. */}
            <p className="resume-summary-print hidden print:block">{summaryPrint}</p>
          </div>
        </ResumeSection>

        <ResumeSection className="work-section border-t border-ink/10" eyebrow={`Since ${FIRST_YEAR}`} title="Work Experience">
          <CascadeGroup className="flex flex-col gap-10" threshold={0.1}>
            <CascadeItem delayMs={descDelay(0)} className="print:hidden">
              <Lead className="max-w-3xl text-ink-soft">
                {intros.work}
              </Lead>
            </CascadeItem>
            {jobs.map((job, i) => (
              <CascadeItem key={job.company} delayMs={descDelay(i + 1)}>
                {/* `first-entry` lets print drop the leading rule without
                    counting siblings — the intro above shifts positions. */}
                <article className={`${i === 0 ? 'first-entry ' : ''}flex flex-col gap-4 pt-8 border-t border-ink/10`}>
                  <EntryIdentity company={job.company} role={job.role} dates={job.dates} />
                  {/* Contracts take the description's place. They are
                      concurrent by nature — overlapping each other and the
                      role above — so they are listed rather than slotted into
                      the timeline as entries of their own. */}
                  {job.contracts
                    ? (
                      // Side by side from `xl` — they ran concurrently, and a
                      // row says that where a stack would imply sequence.
                      // A wrapping flex row rather than three equal grid
                      // columns: equal columns are set by the widest cell,
                      // so a long company name would break onto a second line
                      // and push that column's role and dates out of line
                      // with its neighbours. Sized to their content they fit,
                      // and wrap only if they genuinely cannot. Below `xl`
                      // they stack, and the rule indents them back under the
                      // role they belong to.
                      <div className="entry-contracts flex flex-col gap-6 pl-5 border-l-2 border-ice xl:flex-row xl:flex-wrap xl:gap-x-16">
                        {job.contracts.map(contract => (
                          <EntryIdentity key={contract.company} {...contract} stackFromXl />
                        ))}
                      </div>
                    )
                    : (
                      <>
                        {/* Print swaps in the condensed `descriptionPrint`
                            where a job defines one — see resume.ts. Both are
                            direct children of the article so the print rules
                            keyed to `article > p` catch either. */}
                        <p className={`font-sans text-base leading-relaxed max-w-3xl${job.descriptionPrint ? ' print:hidden' : ''}`}>
                          {job.description}
                        </p>
                        {job.descriptionPrint && (
                          <p className="hidden print:block font-sans text-base leading-relaxed">
                            {job.descriptionPrint}
                          </p>
                        )}
                      </>
                    )}
                </article>
              </CascadeItem>
            ))}
          </CascadeGroup>
        </ResumeSection>

        <ResumeSection className="values-section border-t border-ink/10" eyebrow="How I Work" title="Values">
          <CascadeGroup className="flex flex-col gap-8" threshold={0.1}>
            <CascadeItem delayMs={descDelay(0)} className="print:hidden">
              <Lead className="max-w-3xl text-ink-soft">
                {intros.values}
              </Lead>
            </CascadeItem>
            <CascadeItem delayMs={descDelay(1)}>
              <dl className="values-grid grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {values.map(({ label, description }) => (
                  <div key={label} className="border-t border-ink/10 pt-5 print:border-0 print:pt-0">
                    <dt className="font-display font-bold uppercase tracking-display text-xl leading-none text-ink">{label}</dt>
                    <dd className="font-sans text-base leading-relaxed text-ink-soft pt-2">{description}</dd>
                  </div>
                ))}
              </dl>
            </CascadeItem>
          </CascadeGroup>
        </ResumeSection>

        <ResumeSection className="credentials-section border-t border-ink/10" eyebrow="Certifications and Education" title="Credentials">
          <CascadeGroup className="flex flex-col gap-8" threshold={0.1}>
            <CascadeItem delayMs={descDelay(0)} className="print:hidden">
              <Lead className="max-w-3xl text-ink-soft">
                {intros.credentials}
              </Lead>
            </CascadeItem>
            <CascadeItem delayMs={descDelay(1)}>
              <div className="credentials-grid grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="flex flex-col gap-3">
                  <H3 className="text-ink">Certifications</H3>
                  <ul className="flex flex-col gap-2 pt-2">
                    {certifications.map(cert => (
                      <li key={cert} className="font-sans text-base leading-relaxed">{cert}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-3">
                  <H3 className="text-ink">Education</H3>
                  <div className="flex flex-col gap-1 pt-2">
                    <p className="font-sans text-base font-semibold">{education.school}</p>
                    <p className="font-sans text-base text-ink-soft">{education.degree}, {education.field}</p>
                  </div>
                </div>
              </div>
            </CascadeItem>
          </CascadeGroup>
        </ResumeSection>

      </Sheet>

    </Page>
  )
}
