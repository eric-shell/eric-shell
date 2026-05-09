import { twMerge } from 'tailwind-merge'
import { type LucideIcon, CalendarDays, Clock, Eye, Fingerprint, Globe, Link, Mail, Monitor, RotateCcw, User } from 'lucide-react'
import { formatLong } from '../lib/dateFormat'
import { MetaFieldSkeletons } from './Skeleton'
import type { VisitorDetailPayload } from '@/../api/_lib/types'

function MetaField({ icon: Icon, label, value, mono = false }: {
  icon: LucideIcon
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-blue-950/10">
        <Icon size={13} className="text-blue-950/70" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-blue-950/70 mb-0.5">{label}</p>
        <p className={twMerge('text-xs font-semibold text-blue-950/80', mono && 'font-mono')}>{value}</p>
      </div>
    </div>
  )
}

interface Props {
  id: string
  data: VisitorDetailPayload | null
}

export default function VisitorMetaGrid({ id, data }: Props) {
  const contact = data?.submissions[0]
  const visitor = data?.visitor
  const events = data?.events

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 flex-1 min-w-0">
      <MetaField icon={Fingerprint} label="Visitor ID" value={id} mono />
      {data === null ? (
        <MetaFieldSkeletons count={5} />
      ) : (
        <>
          {contact?.name  && <MetaField icon={User} label="Name"  value={contact.name} />}
          {contact?.email && <MetaField icon={Mail} label="Email" value={contact.email} />}
          {visitor && (
            <>
              <MetaField icon={CalendarDays} label="First seen" value={formatLong(visitor.first_seen_at)} />
              <MetaField icon={Clock}        label="Last seen"  value={formatLong(visitor.last_seen_at)} />
            </>
          )}
          {visitor?.user_agent && <MetaField icon={Monitor} label="User agent" value={visitor.user_agent} />}
          {(visitor?.city || visitor?.country) && (
            <MetaField icon={Globe} label="Location" value={[visitor.city, visitor.country].filter(Boolean).join(', ')} />
          )}
          {visitor?.referrer && <MetaField icon={Link} label="Referrer" value={visitor.referrer} />}
          {(events?.ada_toggle ?? 0) > 0 && (
            <MetaField icon={Eye} label="High-contrast" value={`${events!.ada_toggle}×`} />
          )}
          {(events?.chat_cleared ?? 0) > 0 && (
            <MetaField icon={RotateCcw} label="Chats cleared" value={`${events!.chat_cleared}×`} />
          )}
        </>
      )}
    </div>
  )
}
