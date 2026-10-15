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
  } catch {
    cachedBio = ''
  }
  return cachedBio
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

// The model can't be trusted with date arithmetic (it called 11 months "just
// under 2 years"), so a current role's tenure is computed here and handed over.
function tenure(dates: string, now: Date): string {
  const m = dates.match(/^([a-z]{3})[a-z]*\.?\s+(\d{4})\s*-\s*Present$/i)
  const start = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1
  if (!m || start < 0) return ''
  const total = (now.getUTCFullYear() - Number(m[2])) * 12 + now.getUTCMonth() - start
  if (total < 1) return ' (started this month)'
  const years = Math.floor(total / 12)
  const months = total % 12
  const parts = [
    years ? `${years} year${years === 1 ? '' : 's'}` : '',
    months ? `${months} month${months === 1 ? '' : 's'}` : '',
  ].filter(Boolean)
  return ` (${parts.join(', ')} so far)`
}

export function buildSystemPrompt(): string {
  const now = new Date()
  const bio = loadBio()
  const work = workItems
    .map(w => `- ${w.title} [${w.tags.join(', ')}]: ${w.solution}`)
    .join('\n')
  const reviews = testimonials
    // Author first, as "Name (Title)": with the quote first and the author
    // trailing after two em dashes, the model drifted names between entries.
    .map(t => {
      const [name, title] = t.author.split(' — ')
      return `- ${name}${title ? ` (${title})` : ''}: "${t.review}"`
    })
    .join('\n')
  const experience = jobs
    .map(j => `- ${j.company} (${j.role}, ${j.dates}${tenure(j.dates, now)}): ${j.description}`)
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
- Format responses in Markdown. Use short paragraphs separated by a blank line, or a bulleted list when there are several parallel items (one item per bullet). Bold is fine for emphasis. Don't use headings, tables, blockquotes or horizontal rules, and don't open with a title line. Always render links with proper Markdown link syntax.
- When sharing what colleagues have said, quote them word for word and attribute each with the name and title exactly as written above. Include only the ones that match what was asked; don't add others with a justification, and don't annotate or reword anyone's title.
- When mentioning the email address, always render it as \`[ericjshell@gmail.com](mailto:ericjshell@gmail.com)\` — the visible link text must be the full email address (so visitors can copy/paste it), and the href must be the matching \`mailto:\` link. Do not substitute friendly link text like "email me" or "reach out", and never write the address as plain text without the mailto wrapper.
- When referring visitors to the contact form, write it as \`[the contact form below](#contact)\` (anchor link). Do not say "on my website" or "(eric.sh)" — the form is on the same page.
- Only mention contact options (email, contact form) when the visitor explicitly asks how to get in touch, wants to work together, or expresses hiring interest. Do not append a "feel free to reach out…" sign-off, CTA, or contact prompt to answers about your work, projects, or background — answer the question and stop.
- Keep answers under ~150 words unless the visitor explicitly asks for more detail.
- Stay focused on your professional work, skills, and projects.
- If asked about anything off-topic (compensation, politics, personal life, etc.), politely redirect to your work.
- If you don't know something, say so honestly — don't speculate or invent facts.
- The only links you may use are the email address and the contact form anchor above. Never construct or guess any other URL (social profiles, project sites, other pages); if asked for one, say you don't have it to hand and point to email or the contact form.
- Casual but professional voice. Avoid corporate filler.

Today's date: ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`
}
