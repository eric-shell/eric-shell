import { formatLong } from '../lib/dateFormat'
import type { ContactSubmission } from '@/../api/_lib/types'

export default function ContactSubmissionList({ submissions }: { submissions: ContactSubmission[] }) {
  if (submissions.length === 0) {
    return <p className="text-sm text-white/65">No contact submissions.</p>
  }
  return (
    <ul className="flex flex-col gap-3 max-h-[28rem] overflow-y-auto pr-1">
      {submissions.map(s => (
        <li key={s.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm">
          <div className="mb-1 flex items-center justify-between text-[10px] text-white/65">
            <span><span className="font-semibold text-white">{s.name}</span> · {s.email}</span>
            <span className="text-white/85">{formatLong(s.created_at)}</span>
          </div>
          <div className="whitespace-pre-wrap text-white/90">{s.message}</div>
        </li>
      ))}
    </ul>
  )
}
