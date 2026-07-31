/** Company / role / dates — the identity block every work entry leads with. */
export type ResumeIdentity = {
  company: string
  role: string
  dates: string
}

/**
 * A job entry carries either a `description` or a list of `contracts`, never
 * both. Contracts render as identity blocks in the description's place, which
 * is what lets concurrent, overlapping engagements sit under one heading
 * instead of fighting each other for a slot in the timeline.
 */
export type ResumeJob = ResumeIdentity & (
  | { description: string; contracts?: never }
  | { description?: never; contracts: ResumeIdentity[] }
)

export type ResumeValue = {
  label: string
  description: string
}

export type ResumeEducation = {
  school: string
  degree: string
  field: string
}

/** Contact details surfaced in the print/PDF masthead. */
export const contact = {
  email: 'ericjshell@gmail.com',
  site: 'eric.sh',
  linkedin: 'linkedin.com/in/ericshell',
  github: 'github.com/eric-shell',
} as const

export const headline: string =
  'An AI Design Systems Engineer with over 15 years of professional experience developing modern web and mobile applications.'

/**
 * Condensed profile for the print/PDF layout. Same facts as `summary`,
 * compressed to a single paragraph so the left rail has room to show the
 * `values` descriptions rather than bare labels.
 */
export const summaryPrint: string =
  'AI Design Systems Engineer with over 15 years building modern web and mobile applications. At MMGY Global I own front-end architecture across a portfolio of enterprise marketing platforms, integrating LLMs directly into how those systems are built and delivered. My track record spans Fortune 500 brands, financial institutions, federal agencies, and national restaurant chains. Formal education in Design from Lehigh University. Active DOI government clearance through March 2030.'

export const summary: string[] = [
  "Over 15 years I've evolved from shipping pixel-perfect UIs to architecting the systems that produce them at scale, and now to integrating AI natively into how those systems are built and delivered. As an AI Design Systems Engineer at MMGY Global, I own front-end architecture for a portfolio of enterprise marketing platforms, treating large language models not just as productivity tools but as first-class collaborators in the development lifecycle.",
  "My track record spans Fortune 500 brands, financial institutions, federal agencies, and major national restaurant chains including Red Robin, Denny's, Bubba's 33, Noodles & Company, Panda Express, and more. Whether leading a developer team at Bounteous, architecting reusable component libraries for TransUnion's consumer products, or delivering Drupal-powered platforms for government entities, the standard has always been the same: performant, accessible, and design-faithful work that outlasts the engagement that built it.",
  "Today my focus is the intersection of design systems and AI. I build LLM-powered features directly into production applications, from Claude-driven chat interfaces to AI-assisted tooling, and actively research how models like Claude change the way teams design, document, and scale front-end architecture. My formal education in Design from Lehigh University keeps the human side of that equation grounded. I hold an active DOI government clearance through March 2030.",
]

/**
 * Screen-only lead-in copy framing each section. Print omits these — the
 * one-page layout has no room for framing prose, and the section labels
 * carry enough on their own there.
 */
export const intros = {
  work: 'Each role has widened the scope from writing the interface to owning the systems and teams behind it:',
  values: "Beyond developing code, I've contributed across the full project lifecycle:",
  credentials: 'My design training and developer certifications both still shape how I work:',
} as const

export const jobs: ResumeJob[] = [
  {
    company: 'MMGY Global',
    role: 'AI Design Systems Engineer',
    dates: 'Nov. 2025 - Present',
    description: 'I build AI-augmented tooling across the team and establish the coding standards and documentation practices around it, integrating LLMs directly into the development and delivery workflow. I own front-end architecture across a portfolio of enterprise marketing platforms, building and maintaining design systems that bridge the gap between design intent and production output at scale. As the resident front-end SME, I drive experience-guided feature development and white-label solution architecture: a productized front-end foundation we spin off into every client engagement. It delivers deep, complex feature parity across everything we build, scaling in lockstep as our team, solutions, and projects evolve.',
  },
  {
    company: 'Independent',
    role: 'Contract Engagements',
    dates: 'Dec. 2024 - Feb. 2026',
    contracts: [
      { company: 'Promet Source', role: 'Solutions Architect',          dates: 'Dec. 2024 - Jan. 2025' },
      { company: 'Isaiah',        role: 'Principal Software Developer', dates: 'Mar. 2025 - Feb. 2026' },
      { company: 'Saksoft',       role: 'Senior Consultant',            dates: 'Aug. 2025 - Jan. 2026' },
    ],
  },
  {
    company: 'Bounteous',
    role: 'Lead Software Developer',
    dates: 'Oct. 2021 - Oct. 2024',
    description: "I served as Tech Lead and Front End Specialist on enterprise marketing platforms for national QSR brands including Red Robin, Denny's, Bubba's 33, Noodles & Company, and Panda Express. I architected reusable component libraries and design system foundations used across multiple client engagements, led sprint planning, estimation, and release coordination, and provided technical mentorship to developers at all levels.",
  },
  {
    company: 'TransUnion',
    role: 'Senior Software Engineer',
    dates: 'Sept. 2018 - Oct. 2021',
    description: 'I built and maintained direct-to-consumer and client-facing web applications for one of the three major U.S. credit bureaus. I led custom feature development from scoping and estimation through to production release, delivering accessible and performant UI solutions for complex financial data products used by millions of consumers. I also collaborated closely with web and mobile teams across the organization to solve shared front-end challenges.',
  },
  {
    company: 'Hathway',
    role: 'Software Engineer',
    dates: 'May 2015 - Sept. 2018',
    description: 'I delivered front-end development and tech lead responsibilities across a diverse portfolio of agency clients, specializing in Drupal-powered platforms with contributions to site architecture, theming, and custom module work. I collaborated directly with designers to refine assets and provide actionable UI/UX feedback, and managed client relationships with clear communication and hands-on support at every stage of a project.',
  },
  {
    company: 'Accuair',
    role: 'Digital Media Director',
    dates: 'March 2013 - May 2015',
    description: 'I led web development and front-end innovation for an automotive brand specializing in Drupal Commerce, while also training and supporting internal staff responsible for content management and online storefront operations. The role spanned multiple disciplines including video, photography, and graphic design, giving me an early foundation in bridging development with creative production.',
  },
]

export const values: ResumeValue[] = [
  { label: 'AI System Engineering', description: 'Leveraged the lastest technologies from LLMs to craft high-quality, dependable results for teams.' },
  { label: 'Sales & Strategy',      description: 'Partnered with sales teams to create RFPs and deliver complex, six-figure project estimates.' },
  { label: 'Talent & Hiring',       description: 'Helped scale dev teams by crafting interview processes, screening candidates, and conducting interviews.' },
  { label: 'Agile Leadership',      description: 'Collaborated with project managers to establish Agile practices and lead stakeholder calls/demos.' },
  { label: 'Design Collaboration',  description: 'Worked closely with UI/UX teams to turn design concepts into robust, production-ready interfaces.' },
  { label: 'Developer Enablement',  description: 'Built component libraries, defined coding standards, and served as an SME to mentor developers.' },
  { label: 'QA & Compliance',       description: 'Established code quality, accessibility (WCAG, ADA), modern SEO best practices, and GTM analytics.' },
  { label: 'Client Education',      description: 'Delivered comprehensive documentation, live training sessions, and support tailored to project goals.' },
]

export const certifications: string[] = [
  'Department of the Interior (DOI) Government Clearance',
  'Acquia Certified Drupal Front End Specialist',
  'Acquia Certified Drupal Site Builder',
]

export const education: ResumeEducation = {
  school: 'Lehigh University, Bethlehem Pennsylvania',
  degree: "Bachelor's Degree",
  field: 'Product, Graphic & Web Design',
}
