import { useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { Button, Panel } from '../../components/ui'
import { useVisitorDetail } from '../hooks/useVisitorDetail'
import { DetailSkeleton } from './Skeleton'
import VisitorMetaGrid from './VisitorMetaGrid'
import ConversationTimeline from './ConversationTimeline'
import ContactSubmissionList from './ContactSubmissionList'
import TabBar from './TabBar'

interface VisitorDetailProps {
  id: string
  onClose: () => void
  onDeleted?: (id: string) => void
}

type Tab = 'chat' | 'contact'

export default function VisitorDetail({ id, onClose, onDeleted }: VisitorDetailProps) {
  const { data, notes, setNotes, notesSaving, saveNotes, deleting, deleteVisitor } =
    useVisitorDetail(id, { onClose, onDeleted })
  const [tab, setTab] = useState<Tab>('chat')

  return (
    <Panel variant="white" className="rounded-b-xl rounded-t-none p-5">
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

          <div className="mt-5 border-t border-blue-950/10 pt-4">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-950/50">Notes</p>
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
              <Button variant="primary" size="sm" onClick={saveNotes} disabled={notesSaving}>
                {notesSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </>
      )}
    </Panel>
  )
}
