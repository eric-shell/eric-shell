import { useEffect, useState } from 'react'
import { toast } from '../../components/ui'
import { apiCall } from '../lib/api'
import { dropDetail, readDetail, writeDetail } from '../lib/detailCache'
import type { VisitorDetailPayload } from '@/../api/_lib/types'

/** The admin-editable fields, as the list row should now show them. */
export interface VisitorEdits {
  location_override: string | null
  notes: string | null
}

interface Options {
  onClose: () => void
  onDeleted?: (id: string) => void
  /**
   * Lets the parent list re-render its Location cell and notes marker without
   * waiting for the next poll.
   */
  onSaved?: (id: string, edits: VisitorEdits) => void
}

/**
 * Loads one visitor's detail payload, and holds it in the page-view cache so
 * reopening a row is instant.
 *
 * `stamp` (from `detailStamp()`) is read **once, on mount** and then frozen.
 * The open drawer has never refreshed itself — only the list behind it polls —
 * and honouring a mid-view stamp change would mean refetching under someone's
 * cursor and wiping whatever they had typed into Notes. A newer stamp takes
 * effect the next time the row is opened, which is when it can't cost anyone
 * their work.
 */
export function useVisitorDetail(id: string, stamp: string, { onClose, onDeleted, onSaved }: Options) {
  // Frozen at mount: see above. `useState` rather than a ref so it is a stable
  // value the effect below can depend on.
  const [key] = useState(stamp)
  // A hit means this row was opened earlier and nothing about it has changed
  // since. Read during the initial render, not in an effect, so a revisit
  // paints the real content on the first frame instead of a skeleton.
  const [cached] = useState(() => readDetail(id, key))

  const [data, setData] = useState<VisitorDetailPayload | null>(cached)
  const [notes, setNotes] = useState(cached?.visitor?.notes ?? '')
  const [locationOverride, setLocationOverride] = useState(cached?.visitor?.location_override ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (cached) return
    let cancelled = false
    apiCall<VisitorDetailPayload>(`/api/admin/visitors/${id}`, undefined, {
      errorMessage: 'Failed to load visitor.',
    }).then(json => {
      if (json && !cancelled) {
        setData(json)
        setNotes(json.visitor?.notes ?? '')
        setLocationOverride(json.visitor?.location_override ?? '')
      }
    })
    return () => { cancelled = true }
  }, [id, cached])

  // Mirror whatever is on screen into the cache, from one place: this covers
  // the fetch landing and the local merge after a save, and can't drift the way
  // a `writeDetail` at each of those call sites could. Rewriting an entry we
  // just read from is a no-op beyond refreshing its LRU position.
  useEffect(() => {
    if (data) writeDetail(id, key, data)
  }, [id, key, data])

  async function saveDetails() {
    if (!data) return
    setSaving(true)
    const result = await apiCall(`/api/admin/visitors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, location_override: locationOverride }),
    }, { errorMessage: 'Failed to save changes.' })
    setSaving(false)
    if (result) {
      const edits = {
        notes: notes.trim() || null,
        location_override: locationOverride.trim() || null,
      }
      setData(prev => prev ? { ...prev, visitor: { ...prev.visitor, ...edits } } : prev)
      onSaved?.(id, edits)
      toast.success('Changes saved.')
    }
  }

  async function deleteVisitor() {
    if (!confirm('Permanently delete this visitor and all their chat messages, contact submissions, and events? This cannot be undone.')) return
    setDeleting(true)
    const result = await apiCall(`/api/admin/visitors/${id}`, { method: 'DELETE' }, {
      errorMessage: 'Failed to delete visitor.',
    })
    if (result) {
      // Before the unmount, so nothing can re-mirror the payload on the way out.
      dropDetail(id)
      toast.success('Visitor deleted.')
      onDeleted?.(id)
      onClose()
    } else {
      setDeleting(false)
    }
  }

  return {
    data,
    notes, setNotes,
    locationOverride, setLocationOverride,
    saving, saveDetails,
    deleting, deleteVisitor,
  }
}
