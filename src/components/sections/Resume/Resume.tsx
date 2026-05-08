import { FileDown, Mail } from 'lucide-react'
import { Button, CascadeGroup, CascadeItem, Eyebrow, H1, H2, H3 } from '../../ui'
import { certifications, education, headline, jobs, summary, values } from '../../../data/resume'

export default function Resume() {
  return (
    <main className="bg-white text-blue-950">

      <section className="resume-hero relative bg-blue-950 text-white overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="max-w-[1440px] mx-auto px-6">
          <CascadeGroup mountOnly className="flex flex-col gap-4 print:gap-1">
            <CascadeItem index={0} className="print:hidden">
              <Eyebrow size="lg" className="text-white">Resume</Eyebrow>
            </CascadeItem>
            <CascadeItem index={1}>
              <H1 className="text-white">Eric Shell</H1>
            </CascadeItem>
            <CascadeItem index={2}>
              <p className="font-sans text-lg md:text-xl text-white max-w-2xl pt-1 pb-3 leading-relaxed">
                {headline}
              </p>
            </CascadeItem>
            <CascadeItem index={3}>
              <div className="flex items-center gap-3">
                <Button
                  href="mailto:ericjshell@gmail.com?subject=Resume%20Inquiry"
                  variant="primary"
                  leftIcon={<Mail size={14} />}
                >
                  ericjshell@gmail.com
                </Button>
                <Button
                  variant="glass-light"
                  onClick={() => window.print()}
                  leftIcon={<FileDown size={14} />}
                  className="print:hidden"
                >
                  Download PDF
                </Button>
              </div>
            </CascadeItem>
          </CascadeGroup>
        </div>
      </section>

      {/* Print: About + Values + Credentials stack in left column; Work spans right column */}
      <div className="print-grid">

        <section className="resume-section py-16 md:py-24">
          <div className="max-w-[1440px] mx-auto px-6">
            <CascadeGroup className="flex flex-col gap-6" threshold={0.15}>
              <CascadeItem index={0}>
                <H2>About</H2>
              </CascadeItem>
              {summary.map((paragraph, i) => (
                <CascadeItem key={i} index={i + 1}>
                  <p className="font-sans text-base md:text-lg leading-relaxed max-w-4xl">
                    {paragraph}
                  </p>
                </CascadeItem>
              ))}
            </CascadeGroup>
          </div>
        </section>

        <section className="resume-section work-section py-16 md:py-24 border-t border-blue-950/10">
          <div className="max-w-[1440px] mx-auto px-6">
            <CascadeGroup className="flex flex-col gap-12" threshold={0.1}>
              <CascadeItem index={0}>
                <H2>Work Experience</H2>
              </CascadeItem>
              {jobs.map((job, i) => (
                <CascadeItem key={job.company} index={i + 1}>
                  <article className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-12 pt-8 border-t border-blue-950/10">
                    <div className="flex flex-col gap-1">
                      <H3 className="text-blue-800">{job.company}</H3>
                      <p className="font-sans text-base font-semibold pt-1">{job.role}</p>
                      <p className="font-sans text-sm text-blue-950/60">{job.dates}</p>
                    </div>
                    <p className="font-sans text-base leading-relaxed">{job.description}</p>
                  </article>
                </CascadeItem>
              ))}
            </CascadeGroup>
          </div>
        </section>

        <section className="resume-section py-16 md:py-24 border-t border-blue-950/10 print:hidden">
          <div className="max-w-[1440px] mx-auto px-6">
            <CascadeGroup className="flex flex-col gap-8" threshold={0.1}>
              <CascadeItem index={0}>
                <H2>Values</H2>
              </CascadeItem>
              <CascadeItem index={1}>
                <p className="font-sans text-base md:text-lg leading-relaxed max-w-3xl">
                  Beyond developing code, I've contributed across the full project lifecycle:
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
          </div>
        </section>

        <section className="resume-section py-16 md:py-24 border-t border-blue-950/10">
          <div className="max-w-[1440px] mx-auto px-6">
            <CascadeGroup className="flex flex-col gap-8" threshold={0.1}>
              <CascadeItem index={0}>
                <H2>Credentials</H2>
              </CascadeItem>
              <CascadeItem index={1}>
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
          </div>
        </section>

      </div>

    </main>
  )
}
