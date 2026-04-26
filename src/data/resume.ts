export type ResumeJob = {
  company: string
  role: string
  dates: string
  bullets: string[]
}

export type ResumeValue = {
  label: string
  description: string
}

export type ResumeEducation = {
  school: string
  degree: string
  field: string
}

export const headline: string =
  'Lead Front End Developer with 15+ years building performant, accessible, and scalable web applications across restaurant, automotive, government, and finance.'

export const summary: string[] = [
  "I am a Lead Front End Developer with over 15 years of experience building performant, accessible, and scalable web applications across a variety of industries—including restaurant, automotive, government, and finance. I've recently led the development of marketing platforms for major national brands like Red Robin, Denny's, Bubba's 33, Noodles & Company, Panda Express and more.",
  "My technical foundation is rooted in Drupal development, where I've delivered complex, content-rich websites for high-profile clients and government entities. With multiple Acquia Certifications, I bring proven expertise in site architecture, presentation layer development, custom module enhancements, and performance optimization within the Drupal ecosystem.",
  'In addition to my Drupal expertise, I also develop with modern JavaScript frameworks like React, React Native, Next.js, Expo and more—allowing me to build web and mobile applications that are fast, data-driven, and responsive. My formal education in Design from Lehigh University uniquely positions me to bridge the gap between design and development, consistently delivering pixel-perfect interfaces that are both accessible and intuitive. I currently secure government clearance with the DOI via a PIV Card through March 2030.',
]

export const jobs: ResumeJob[] = [
  {
    company: 'MMGY Global',
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

export const values: ResumeValue[] = [
  { label: 'Sales & Strategy',     description: 'Partnered with sales teams to create RFPs and deliver complex, six-figure project estimates.' },
  { label: 'Talent & Hiring',      description: 'Helped scale dev teams by crafting interview processes, screening candidates, and conducting interviews.' },
  { label: 'Agile Leadership',     description: 'Collaborated with project managers to establish Agile practices and lead stakeholder calls/demos.' },
  { label: 'Design Collaboration', description: 'Worked closely with UI/UX teams to turn design concepts into robust, production-ready interfaces.' },
  { label: 'Developer Enablement', description: 'Built component libraries, defined coding standards, and served as an SME to mentor developers.' },
  { label: 'QA & Compliance',      description: 'Established code quality, accessibility (WCAG, ADA), modern SEO best practices, and GTM analytics.' },
  { label: 'Client Education',     description: 'Delivered comprehensive documentation, live training sessions, and support tailored to project goals.' },
]

export const certifications: string[] = [
  'Acquia Certified Drupal Front End Specialist',
  'Acquia Certified Drupal Site Builder',
]

export const education: ResumeEducation = {
  school: 'Lehigh University, Bethlehem Pennsylvania',
  degree: "Bachelor's Degree",
  field: 'Product, Graphic & Web Design',
}
