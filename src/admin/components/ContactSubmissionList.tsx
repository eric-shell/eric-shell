import { formatLong } from '../lib/dateFormat'
import type { ContactSubmission } from '@/../api/_lib/types'

export default function ContactSubmissionList({ submissions }: { submissions: ContactSubmission[] }) {
  if (submissions.length === 0) {
    return <p className="text-sm text-blue-950/50">No contact submissions.</p>
  }
  return (
    <ul className="flex flex-col gap-3 max-h-[28rem] overflow-y-auto pr-1">
      {submissions.map(s => (
        <li key={s.id} className="rounded-lg border border-blue-950/10 bg-white p-3 text-sm">
          <div className="mb-1 flex items-center justify-between text-[10px] text-blue-950/50">
            <span><span className="font-semibold text-blue-950">{s.name}</span> · {s.email}</span>
            <span className="text-blue-950/70">{formatLong(s.created_at)}</span>
          </div>
          <div className="whitespace-pre-wrap text-blue-950/80">{s.message}</div>
        </li>
      ))}
    </ul>
  )
}
