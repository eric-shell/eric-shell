import { useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { Button, Panel } from '../../components/ui'
import { useVisitorDetail } from '../hooks/useVisitorDetail'
import { DetailSkeleton } from './Skeleton'
import VisitorMetaGrid from './VisitorMetaGrid'
import ConversationTimeline from './ConversationTimeline'
import ContactSubmissionList from './ContactSubmissionList'
import ActivityTimeline from './ActivityTimeline'
import TabBar from './TabBar'

interface VisitorDetailProps {
  id: string
  onClose: () => void
  onDeleted?: (id: string) => void
  onSaved?: (id: string, locationOverride: string | null) => void
}

type Tab = 'chat' | 'contact' | 'activity'

export default function VisitorDetail({ id, onClose, onDeleted, onSaved }: VisitorDetailProps) {
  const {
    data,
    notes, setNotes,
    locationOverride, setLocationOverride,
    saving, saveDetails,
    deleting, deleteVisitor,
  } = useVisitorDetail(id, { onClose, onDeleted, onSaved })
  const [tab, setTab] = useState<Tab>('chat')

  // Shown as placeholder context so it's obvious what the override replaces.
  const ipGuess = [data?.visitor.city, data?.visitor.region, data?.visitor.country]
    .filter(Boolean).join(', ') || null

  return (
    <Panel
      variant="raised-dark"
      // Reads as a drawer hanging off the selected row: tinted a step off the
      // white table so it doesn't look like yet another flat top-level card.
      className="rounded-b-xl rounded-t-none border-t-0 bg-black/25 p-5"
    >
      <div className="mb-5 flex items-start justify-between gap-6">
        <VisitorMetaGrid id={id} data={data} />
        <Button variant="raised-dark" size="sm" shape="square" className="rounded-full" onClick={onClose} aria-label="Close">
          <X aria-hidden="true" />
        </Button>
      </div>

      {data === null ? (
        <DetailSkeleton />
      ) : (
        <>
          <TabBar
            className="mb-4"
            tabs={[
              ['chat', `Chat (${data.messages.length})`],
              ['contact', `Contact (${data.submissions.length})`],
              ['activity', `Activity (${data.pageViews.length})`],
            ] as const}
            active={tab}
            onChange={setTab}
          />

          {tab === 'chat' && (
            <ConversationTimeline
              messages={data.messages}
              clearEvents={data.clearEvents}
              scrollDep={data}
            />
          )}

          {tab === 'contact' && <ContactSubmissionList submissions={data.submissions} />}

          {tab === 'activity' && (
            <ActivityTimeline sessions={data.sessions} pageViews={data.pageViews} />
          )}

          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">Location</p>
            <input
              type="text"
              value={locationOverride}
              onChange={e => setLocationOverride(e.target.value)}
              placeholder={ipGuess ? `Correct the IP guess (${ipGuess})…` : 'Set a location…'}
              maxLength={120}
              className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-white/55 outline-none focus:border-accent/60 focus:bg-white/[0.08] transition"
            />
            <p className="mt-1 text-[10px] text-white/65">
              Overrides IP geolocation, which is approximate and can be off by hundreds of miles. Clear to fall back to the IP guess.
            </p>

            <p className="mb-1.5 mt-4 text-[10px] font-semibold uppercase tracking-wider text-white/50">Notes</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add private notes about this visitor…"
              rows={3}
              className="w-full resize-y rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-white/55 outline-none focus:border-accent/60 focus:bg-white/[0.08] transition"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteVisitor}
                disabled={deleting}
                leftIcon={<Trash2 strokeWidth={2.5} aria-hidden="true" />}
                className="text-red-400 hover:text-red-300"
              >
                {deleting ? 'Deleting…' : 'Delete visitor data'}
              </Button>
              <Button variant="primary" size="sm" onClick={saveDetails} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </>
      )}
    </Panel>
  )
}
