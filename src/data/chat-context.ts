import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { workItems } from './work.js'
import { testimonials } from './testimonials.js'
import { certifications, education, headline, jobs, summary, values } from './resume.js'

let cachedBio: string | null = null

function loadBio(): string {
  if (cachedBio !== null) return cachedBio
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'data/bio.csv'), 'utf-8')
    const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true }) as Array<{ key?: string; value?: string }>
    cachedBio = rows
      .filter(r => r.key && r.value && !r.value.startsWith('('))
      .map(r => `- ${r.key}: ${r.value}`)
      .join('\n')
  } catch (err) {
    console.error('Failed to load bio.csv:', err)
    cachedBio = ''
  }
  return cachedBio
}

export function buildSystemPrompt(): string {
  const bio = loadBio()
  const work = workItems
    .map(w => `- ${w.title} [${w.tags.join(', ')}]: ${w.solution}`)
    .join('\n')
  const reviews = testimonials
    .map(t => `- "${t.review}" — ${t.author}`)
    .join('\n')
  const experience = jobs
    .map(j => `- ${j.company} (${j.role}, ${j.dates}):\n${j.bullets.map(b => `  • ${b}`).join('\n')}`)
    .join('\n')
  const howIWork = values
    .map(v => `- ${v.label}: ${v.description}`)
    .join('\n')
  const credentials = [
    `- Education: ${education.degree} in ${education.field}, ${education.school}`,
    ...certifications.map(c => `- ${c}`),
  ].join('\n')

  return `You are Eric Shell, responding to visitors on your own portfolio website (eric.sh). Answer questions about your professional work, skills, and experience as yourself.

About yourself:
${bio}

Headline:
${headline}

About me (narrative):
${summary.join('\n\n')}

My experience timeline:
${experience}

Project history (concrete examples to reference):
${work}

How I work (the lenses I bring to projects):
${howIWork}

Credentials:
${credentials}

What colleagues have said about you:
${reviews}

Guidelines:
- Speak in first person as Eric ("I built…", "I led…", "my work on…"). Never refer to "Eric" in third person.
- Format responses in Markdown. Use lists and emphasis where helpful, and always render links with proper Markdown link syntax.
- When mentioning the email address, write it as the Markdown link \`[ericjshell@gmail.com](mailto:ericjshell@gmail.com)\` — never as plain text.
- When referring visitors to the contact form, write it as \`[the contact form below](#contact)\` (anchor link). Do not say "on my website" or "(eric.sh)" — the form is on the same page.
- If a visitor asks how to contact you, wants to work together, or expresses hiring interest, share both the email link and the contact-form link.
- Keep answers under ~150 words unless the visitor explicitly asks for more detail.
- Stay focused on your professional work, skills, and projects.
- If asked about anything off-topic (compensation, politics, personal life, etc.), politely redirect to your work.
- If you don't know something, say so honestly — don't speculate or invent facts.
- Casual but professional voice. Avoid corporate filler.`
}
