import { twMerge } from 'tailwind-merge'
import { type LucideIcon, CalendarDays, Clock, Compass, Eye, Fingerprint, Globe, Languages, Link, Mail, Monitor, MousePointer2, RotateCcw, User } from 'lucide-react'
import { formatDuration, formatLong } from '../lib/dateFormat'
import { resolveLocation } from '../lib/location'
import { formatUserAgent } from '../lib/userAgent'
import { MetaFieldSkeletons } from './Skeleton'
import type { VisitorDetailPayload } from '@/../api/_lib/types'

function MetaField({ icon: Icon, label, value, mono = false, title }: {
  icon: LucideIcon
  label: string
  value: string
  mono?: boolean
  title?: string
}) {
  return (
    <div className="flex items-center gap-3 min-w-0" title={title}>
      <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-white/10">
        <Icon size={13} className="text-white/70" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-white/70 mb-0.5">{label}</p>
        <p className={twMerge('text-xs font-semibold text-white/80', mono && 'font-mono')}>{value}</p>
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
  const location = resolveLocation(visitor)
  const sessions = data?.sessions ?? []
  const sessionCount = sessions.length
  const totalEngagedMs = sessions.reduce((sum, s) => sum + s.engaged_ms, 0)

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 flex-1 min-w-0">
      <MetaField icon={Fingerprint} label="Visitor ID" value={id} mono />
      {/* Skeleton count approximates what an enriched visitor renders, so the
          block doesn't jump in height when the fetch resolves. */}
      {data === null ? (
        <MetaFieldSkeletons count={8} />
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
          {visitor?.user_agent && (
            <MetaField
              icon={Monitor}
              label="Browser"
              value={formatUserAgent(visitor.user_agent)!}
              title={visitor.user_agent}
            />
          )}
          {location.label && (
            <MetaField
              icon={Globe}
              label={location.approximate ? 'Location (approx.)' : 'Location'}
              value={location.label}
              title={location.approximate
                ? 'Derived from IP geolocation — can be off by hundreds of miles. Correct it below.'
                : 'Manually corrected.'}
            />
          )}
          {/* Browser-reported timezone beats the IP-derived one, so prefer it
              and label the fallback so they're never confused. */}
          {(visitor?.client_timezone || visitor?.timezone) && (
            <MetaField
              icon={Compass}
              label={visitor.client_timezone ? 'Timezone' : 'Timezone (from IP)'}
              value={visitor.client_timezone ?? visitor.timezone!}
              title={visitor.client_timezone ? 'Reported by the browser.' : 'Inferred from IP — less reliable.'}
            />
          )}
          {visitor?.language && <MetaField icon={Languages} label="Language" value={visitor.language} />}
          {/* Views, sessions, and engaged time are one thought — three separate
              fields made this block tall enough to push the tabs below the fold. */}
          {sessionCount > 0 && (
            <MetaField
              icon={MousePointer2}
              label="Engagement"
              value={[
                `${data.pageViews.length} ${data.pageViews.length === 1 ? 'view' : 'views'}`,
                `${sessionCount} ${sessionCount === 1 ? 'session' : 'sessions'}`,
                ...(totalEngagedMs > 0 ? [formatDuration(totalEngagedMs)] : []),
              ].join(' · ')}
              title="Engaged time counts only while the tab was visible, summed across sessions."
            />
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
