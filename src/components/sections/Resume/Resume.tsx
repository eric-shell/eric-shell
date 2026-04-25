import { CascadeGroup, CascadeItem, Eyebrow, H1, H2, H3 } from '../../ui'

const jobs = [
  {
    company: 'MMGY GLobal',
    role: 'AI Design Systems Engineer',
    dates: 'Nov. 2025 - Present',
    bullets: [
      'Fulfill Tech Lead and Front End Specialist roles for all resourced web applications.',
      'Supporting internal and external team contributions, documentation and training.',
      'Plan and execute new feature development, releases and coordinate maintenance.',
      'Front-End project architecture ownership, education leadership and SME guidance.',
    ],
  },
  {
    company: 'Bounteous',
    role: 'Lead Software Developer',
    dates: 'Oct. 2021 – Oct. 2024',
    bullets: [
      'Fulfill Tech Lead and Front End Specialist roles for all resourced web applications.',
      'Supporting internal and external team contributions, documentation and training.',
      'Plan and execute new feature development, releases and coordinate maintenance.',
      'Front-End project architecture ownership, education leadership and SME guidance.',
    ],
  },
  {
    company: 'TransUnion',
    role: 'Senior Software Engineer',
    dates: 'Sept. 2018 – Oct. 2021',
    bullets: [
      'Fulfill Front End Specialist roles for all direct-to-consumer and client web applications.',
      'Lead custom feature development, planning/estimation and release coordination.',
      'Provide effective UI/UX solutions for business requirements and new feature development.',
      'Effectively communicate and problem solve with other web/mobile application teams.',
    ],
  },
  {
    company: 'Hathway',
    role: 'Software Engineer',
    dates: 'May 2015 – Sept. 2018',
    bullets: [
      'Fulfill Tech Lead and Front End Specialist roles for all resourced web applications.',
      'Supporting digital designer for troubleshooting assets and providing UI/UX feedback.',
      'Effectively communicate with clients by providing education and solutions.',
      'Work seamlessly with teams of all sizes both internally and externally.',
    ],
  },
  {
    company: 'Accuair',
    role: 'Digital Media Director',
    dates: 'March 2013 – May 2015',
    bullets: [
      'Web development and Front End innovation lead specializing in Drupal Commerce.',
      'Educate and support employees responsible for managing content and online storefront.',
      'Supporting cinematographer and photographer for feature and event content creation.',
      'Supporting graphic designer for digital and print media assets.',
    ],
  },
]

const values = [
  { label: 'Sales & Strategy',      desc: 'Partnered with sales teams to create RFPs and deliver complex, six-figure project estimates.' },
  { label: 'Talent & Hiring',       desc: 'Helped scale dev teams by crafting interview processes, screening candidates, and conducting interviews.' },
  { label: 'Agile Leadership',      desc: 'Collaborated with project managers to establish Agile practices and lead stakeholder calls/demos.' },
  { label: 'Design Collaboration',  desc: 'Worked closely with UI/UX teams to turn design concepts into robust, production-ready interfaces.' },
  { label: 'Developer Enablement', desc: 'Built component libraries, defined coding standards, and served as an SME to mentor developers.' },
  { label: 'QA & Compliance',       desc: 'Established code quality, accessibility (WCAG, ADA), modern SEO best practices, and GTM analytics.' },
  { label: 'Client Education',      desc: 'Delivered comprehensive documentation, live training sessions, and support tailored to project goals.' },
]

const certifications = [
  'Acquia Certified Drupal Front End Specialist',
  'Acquia Certified Drupal Site Builder',
]

export default function Resume() {
  return (
    <main className="bg-white text-blue-950">

      <section className="relative bg-blue-950 text-white overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="max-w-[1440px] mx-auto px-6">
          <CascadeGroup mountOnly className="flex flex-col gap-4">
            <CascadeItem index={0}>
              <Eyebrow size="lg" className="text-white/70">Resume</Eyebrow>
            </CascadeItem>
            <CascadeItem index={1}>
              <H1 className="text-white">Eric Shell</H1>
            </CascadeItem>
            <CascadeItem index={2}>
              <p className="font-sans text-lg md:text-xl text-white/80 max-w-2xl pt-2 leading-relaxed">
                Lead Front End Developer with 15+ years building performant, accessible, and scalable web applications across restaurant, automotive, government, and finance.
              </p>
            </CascadeItem>
            <CascadeItem index={3}>
              <a
                href="mailto:ericjshell@gmail.com?subject=Resume%20Inquiry"
                className="font-sans text-base text-white/70 hover:text-white transition-colors w-fit pt-2"
              >
                ericjshell@gmail.com
              </a>
            </CascadeItem>
          </CascadeGroup>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-[1440px] mx-auto px-6">
          <CascadeGroup className="flex flex-col gap-6" threshold={0.15}>
            <CascadeItem index={0}>
              <H2>About</H2>
            </CascadeItem>
            <CascadeItem index={1}>
              <p className="font-sans text-base md:text-lg leading-relaxed max-w-3xl">
                I am a Lead Front End Developer with over 15 years of experience building performant, accessible, and scalable web applications across a variety of industries—including restaurant, automotive, government, and finance. I've recently led the development of marketing platforms for major national brands like Red Robin, Denny's, Bubba's 33, Noodles &amp; Company, Panda Express and more.
              </p>
            </CascadeItem>
            <CascadeItem index={2}>
              <p className="font-sans text-base md:text-lg leading-relaxed max-w-3xl">
                My technical foundation is rooted in Drupal development, where I've delivered complex, content-rich websites for high-profile clients and government entities. With multiple Acquia Certifications, I bring proven expertise in site architecture, presentation layer development, custom module enhancements, and performance optimization within the Drupal ecosystem.
              </p>
            </CascadeItem>
            <CascadeItem index={3}>
              <p className="font-sans text-base md:text-lg leading-relaxed max-w-3xl">
                In addition to my Drupal expertise, I also develop with modern JavaScript frameworks like React, React Native, Next.js, Expo and more—allowing me to build web and mobile applications that are fast, data-driven, and responsive. My formal education in Design from Lehigh University uniquely positions me to bridge the gap between design and development, consistently delivering pixel-perfect interfaces that are both accessible and intuitive. I currently secure government clearance with the DOI via a PIV Card through March 2030.
              </p>
            </CascadeItem>
          </CascadeGroup>
        </div>
      </section>

      <section className="py-16 md:py-24 border-t border-blue-950/10">
        <div className="max-w-[1440px] mx-auto px-6">
          <CascadeGroup className="flex flex-col gap-12" threshold={0.1}>
            <CascadeItem index={0}>
              <H2>Work Experience</H2>
            </CascadeItem>
            {jobs.map((job, i) => (
              <CascadeItem key={job.company} index={i + 1}>
                <article className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-12 pt-8 border-t border-blue-950/10">
                  <div className="flex flex-col gap-1">
                    <H3 className="text-blue-900">{job.company}</H3>
                    <p className="font-sans text-base font-semibold pt-2">{job.role}</p>
                    <p className="font-sans text-sm text-blue-950/60">{job.dates}</p>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {job.bullets.map((bullet, j) => (
                      <li key={j} className="font-sans text-base leading-relaxed">{bullet}</li>
                    ))}
                  </ul>
                </article>
              </CascadeItem>
            ))}
          </CascadeGroup>
        </div>
      </section>

      <section className="py-16 md:py-24 border-t border-blue-950/10">
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
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-5xl">
                {values.map(({ label, desc }) => (
                  <div key={label}>
                    <dt className="font-sans text-sm font-bold uppercase tracking-wider text-blue-800">{label}</dt>
                    <dd className="font-sans text-base leading-relaxed pt-1">{desc}</dd>
                  </div>
                ))}
              </dl>
            </CascadeItem>
          </CascadeGroup>
        </div>
      </section>

      <section className="py-16 md:py-24 border-t border-blue-950/10">
        <div className="max-w-[1440px] mx-auto px-6">
          <CascadeGroup className="flex flex-col gap-8" threshold={0.1}>
            <CascadeItem index={0}>
              <H2>Credentials</H2>
            </CascadeItem>
            <CascadeItem index={1}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="flex flex-col gap-3">
                  <H3>Certifications</H3>
                  <ul className="flex flex-col gap-2 pt-2">
                    {certifications.map(cert => (
                      <li key={cert} className="font-sans text-base leading-relaxed">{cert}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-3">
                  <H3>Education</H3>
                  <div className="flex flex-col gap-1 pt-2">
                    <p className="font-sans text-base font-semibold">Lehigh University, Bethlehem Pennsylvania</p>
                    <p className="font-sans text-base">Bachelor's Degree, Product, Graphic &amp; Web Design</p>
                  </div>
                </div>
              </div>
            </CascadeItem>
          </CascadeGroup>
        </div>
      </section>

    </main>
  )
}
