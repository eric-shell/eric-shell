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
      variant="white"
      // Reads as a drawer hanging off the selected row: tinted a step off the
      // white table so it doesn't look like yet another flat top-level card.
      className="rounded-b-xl rounded-t-none border-t-0 bg-blue-50/60 p-5 shadow-inner"
    >
      <div className="mb-5 flex items-start justify-between gap-6">
        <VisitorMetaGrid id={id} data={data} />
        <Button variant="white" size="sm" shape="square" className="rounded-full" onClick={onClose}>
          <X size={13} />
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

          <div className="mt-5 border-t border-blue-950/10 pt-4">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-950/50">Location</p>
            <input
              type="text"
              value={locationOverride}
              onChange={e => setLocationOverride(e.target.value)}
              placeholder={ipGuess ? `Correct the IP guess (${ipGuess})…` : 'Set a location…'}
              maxLength={120}
              className="w-full rounded-lg border border-blue-950/10 bg-white px-3 py-2 text-sm text-blue-950 placeholder:text-blue-950/30 outline-none focus:border-blue-950/30 transition-colors"
            />
            <p className="mt-1 text-[10px] text-blue-950/40">
              Overrides IP geolocation, which is approximate and can be off by hundreds of miles. Clear to fall back to the IP guess.
            </p>

            <p className="mb-1.5 mt-4 text-[10px] font-semibold uppercase tracking-wider text-blue-950/50">Notes</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add private notes about this visitor…"
              rows={3}
              className="w-full resize-y rounded-lg border border-blue-950/10 bg-white px-3 py-2 text-sm text-blue-950 placeholder:text-blue-950/30 outline-none focus:border-blue-950/30 transition-colors"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteVisitor}
                disabled={deleting}
                leftIcon={<Trash2 size={13} strokeWidth={2.5} aria-hidden="true" />}
                className="text-red-700 hover:text-red-900"
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
