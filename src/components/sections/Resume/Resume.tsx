import { FileDown, Mail } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { Backdrop, Button, CascadeGroup, CascadeItem, Container, Eyebrow, H1, H2, H3 } from '../../ui'
import { certifications, contact, education, headline, intros, jobs, summary, summaryPrint, values } from '@/data/resume'
import type { ResumeIdentity } from '@/data/resume'

/**
 * Company / role / dates. Shared by a job entry and by the contract rows that
 * stand in for a description, so the two always read identically — including in
 * print, where `.entry-identity` is what reflows the three lines into
 * company-left / dates-right (see index.css).
 *
 * `band` opts into that same company-left / dates-right reflow on screen,
 * between `sm` and `lg`. It exists for a block that is spanning the full page
 * width there: three stacked lines occupy about 255px of it and leave the rest
 * empty, where the two-column form uses the measure it has been given. Above
 * `lg` the block is one of several sharing a row and goes back to stacking.
 */
function EntryIdentity({ company, role, dates, band = false }: ResumeIdentity & { band?: boolean }) {
  const cell = (classes: string) => (band ? classes : undefined)
  return (
    <div
      className={twMerge(
        'entry-identity flex flex-col gap-1',
        band && 'sm:max-lg:grid sm:max-lg:grid-cols-[minmax(0,1fr)_auto] sm:max-lg:items-baseline sm:max-lg:gap-x-8',
      )}
    >
      <H3 className={twMerge('text-blue-800', cell('sm:max-lg:col-start-1 sm:max-lg:row-start-1'))}>
        {company}
      </H3>
      <p className={twMerge('font-sans text-base font-semibold pt-1', cell('sm:max-lg:col-start-1 sm:max-lg:row-start-2 sm:max-lg:pt-0'))}>
        {role}
      </p>
      <p className={twMerge('font-sans text-sm text-blue-950/60', cell('sm:max-lg:col-start-2 sm:max-lg:row-start-1 sm:max-lg:justify-self-end'))}>
        {dates}
      </p>
    </div>
  )
}

export default function Resume() {
  return (
    <main id="main" className="resume-root bg-white text-blue-950">

      {/* pt is 2rem beyond the visual target to offset skew-hero's -2rem margin. */}
      <section className="resume-hero relative bg-gradient-to-br from-blue-950 to-blue-900 text-white overflow-hidden skew-hero pt-40 pb-16 md:pt-48 md:pb-24">
        {/* print:hidden — the blobs and grain are child backgrounds, so the
            hero's own `background: none` print rule can't suppress them, and
            they'd render if "Background graphics" is enabled. */}
        <Backdrop tone="dark" className="print:hidden" />
        <Container className="resume-masthead unskew-hero">
          <CascadeGroup mountOnly className="resume-identity flex flex-col gap-4 print:gap-1">
            <CascadeItem index={0} className="print:hidden">
              <Eyebrow size="lg" className="text-white">Resume</Eyebrow>
            </CascadeItem>
            <CascadeItem index={1}>
              <H1 className="resume-name text-white">Eric Shell</H1>
            </CascadeItem>
            <CascadeItem index={2}>
              <p className="resume-headline font-sans text-lg md:text-xl text-white max-w-2xl pt-1 pb-3 leading-relaxed">
                {headline}
              </p>
            </CascadeItem>
            <CascadeItem index={3} className="print:hidden">
              <div className="flex items-center gap-3">
                <Button
                  href={`mailto:${contact.email}?subject=Resume%20Inquiry`}
                  variant="primary"
                  leftIcon={<Mail size={14} />}
                >
                  {contact.email}
                </Button>
                <Button
                  variant="glass-light"
                  onClick={() => window.print()}
                  leftIcon={<FileDown size={14} />}
                >
                  Download PDF
                </Button>
              </div>
            </CascadeItem>
          </CascadeGroup>

          {/* Print-only contact block — screen users get the buttons above. */}
          <ul className="resume-contact hidden print:block" aria-hidden="true">
            <li>{contact.email}</li>
            <li>{contact.site}</li>
            <li>{contact.linkedin}</li>
            <li>{contact.github}</li>
          </ul>
        </Container>
      </section>

      {/* Print: About + Capabilities + Credentials stack in the left column;
          Work Experience spans the full height of the right column. */}
      <div className="print-grid">

        <section className="resume-section about-section py-16 md:py-24">
          <Container>
            <CascadeGroup className="flex flex-col gap-6" threshold={0.15}>
              <CascadeItem index={0}>
                <H2>About</H2>
              </CascadeItem>
              {summary.map((paragraph, i) => (
                <CascadeItem key={i} index={i + 1} className="print:hidden">
                  <p className="font-sans text-base md:text-lg leading-relaxed max-w-4xl">
                    {paragraph}
                  </p>
                </CascadeItem>
              ))}
            </CascadeGroup>
            {/* Print swaps the three-paragraph narrative for a single
                condensed profile — see `summaryPrint`. */}
            <p className="resume-summary-print hidden print:block">{summaryPrint}</p>
          </Container>
        </section>

        <section className="resume-section work-section py-16 md:py-24 border-t border-blue-950/10">
          <Container>
            <CascadeGroup className="flex flex-col gap-12" threshold={0.1}>
              <CascadeItem index={0}>
                <H2>Work Experience</H2>
              </CascadeItem>
              <CascadeItem index={1} className="print:hidden">
                <p className="font-sans text-base md:text-lg leading-relaxed">
                  {intros.work}
                </p>
              </CascadeItem>
              {jobs.map((job, i) => (
                <CascadeItem key={job.company} index={i + 2}>
                  {/* `first-entry` lets print drop the leading rule without
                      counting siblings — the intro above shifts positions. */}
                  <article className={`${i === 0 ? 'first-entry ' : ''}grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-12 pt-8 border-t border-blue-950/10`}>
                    <EntryIdentity company={job.company} role={job.role} dates={job.dates} />
                    {/* Contracts take the description's column. They are
                        concurrent by nature — overlapping each other and the
                        role above — so they are listed rather than slotted into
                        the timeline as entries of their own. */}
                    {job.contracts
                      ? (
                        // Side by side from `lg` — they ran concurrently, and a
                        // row says that where a stack would imply sequence.
                        // A wrapping flex row rather than three equal grid
                        // columns: equal columns are set by the widest cell,
                        // so at the narrow end of `lg` every company name
                        // broke onto a second line and pushed that column's
                        // role and dates out of line with its neighbours.
                        // Sized to their content they fit, and wrap only if
                        // they genuinely cannot. Below `lg` — where this block
                        // spans the full page width — they stack, and the rule
                        // indents them back under the role they belong to.
                        // From `sm` to `lg` each one also takes the `band`
                        // form, which is what puts that full width to use.
                        <div className="entry-contracts flex flex-col gap-8 sm:max-lg:gap-6 pl-5 border-l border-blue-950/10 lg:flex-row lg:flex-wrap lg:gap-x-22 lg:pl-0 lg:border-l-0">
                          {job.contracts.map(contract => (
                            <EntryIdentity key={contract.company} {...contract} band />
                          ))}
                        </div>
                      )
                      : (
                        <>
                          {/* Print swaps in the condensed `descriptionPrint`
                              where a job defines one — see resume.ts. Both are
                              direct children of the article so the print rules
                              keyed to `article > p` catch either. */}
                          <p className={`font-sans text-base leading-relaxed${job.descriptionPrint ? ' print:hidden' : ''}`}>
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
          </Container>
        </section>

        <section className="resume-section values-section py-16 md:py-24 border-t border-blue-950/10">
          <Container>
            <CascadeGroup className="flex flex-col gap-8" threshold={0.1}>
              <CascadeItem index={0}>
                <H2>Values</H2>
              </CascadeItem>
              <CascadeItem index={1} className="print:hidden">
                <p className="font-sans text-base md:text-lg leading-relaxed">
                  {intros.values}
                </p>
              </CascadeItem>
              <CascadeItem index={2}>
                <dl className="values-grid grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-5xl">
                  {values.map(({ label, description }) => (
                    <div key={label}>
                      <dt className="font-display text-lg font-bold uppercase text-blue-800">{label}</dt>
                      <dd className="font-sans text-base leading-relaxed pt-1">{description}</dd>
                    </div>
                  ))}
                </dl>
              </CascadeItem>
            </CascadeGroup>
          </Container>
        </section>

        <section className="resume-section credentials-section py-16 md:py-24 border-t border-blue-950/10">
          <Container>
            <CascadeGroup className="flex flex-col gap-8" threshold={0.1}>
              <CascadeItem index={0}>
                <H2>Credentials</H2>
              </CascadeItem>
              <CascadeItem index={1} className="print:hidden">
                <p className="font-sans text-base md:text-lg leading-relaxed">
                  {intros.credentials}
                </p>
              </CascadeItem>
              <CascadeItem index={2}>
                <div className="credentials-grid grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="flex flex-col gap-3">
                    <H3 className="text-blue-800">Certifications</H3>
                    <ul className="flex flex-col gap-2 pt-2">
                      {certifications.map(cert => (
                        <li key={cert} className="font-sans text-base leading-relaxed">{cert}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col gap-3">
                    <H3 className="text-blue-800">Education</H3>
                    <div className="flex flex-col gap-1 pt-2">
                      <p className="font-sans text-base font-semibold">{education.school}</p>
                      <p className="font-sans text-base">{education.degree}, {education.field}</p>
                    </div>
                  </div>
                </div>
              </CascadeItem>
            </CascadeGroup>
          </Container>
        </section>

      </div>

    </main>
  )
}
