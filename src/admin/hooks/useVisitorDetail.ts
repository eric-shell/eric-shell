import { useEffect, useState } from 'react'
import { toast } from '../../components/ui'
import { apiCall } from '../lib/api'
import type { VisitorDetailPayload } from '@/../api/_lib/types'

interface Options {
  onClose: () => void
  onDeleted?: (id: string) => void
}

export function useVisitorDetail(id: string, { onClose, onDeleted }: Options) {
  const [data, setData] = useState<VisitorDetailPayload | null>(null)
  const [notes, setNotes] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiCall<VisitorDetailPayload>(`/api/admin/visitors/${id}`, undefined, {
      errorMessage: 'Failed to load visitor.',
    }).then(json => {
      if (json && !cancelled) {
        setData(json)
        setNotes(json.visitor?.notes ?? '')
      }
    })
    return () => { cancelled = true }
  }, [id])

  async function saveNotes() {
    if (!data) return
    setNotesSaving(true)
    const result = await apiCall(`/api/admin/visitors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    }, { errorMessage: 'Failed to save notes.' })
    setNotesSaving(false)
    if (result) {
      setData(prev => prev ? { ...prev, visitor: { ...prev.visitor, notes: notes.trim() || null } } : prev)
      toast.success('Notes saved.')
    }
  }

  async function deleteVisitor() {
    if (!confirm('Permanently delete this visitor and all their chat messages, contact submissions, and events? This cannot be undone.')) return
    setDeleting(true)
    const result = await apiCall(`/api/admin/visitors/${id}`, { method: 'DELETE' }, {
      errorMessage: 'Failed to delete visitor.',
    })
    if (result) {
      toast.success('Visitor deleted.')
      onDeleted?.(id)
      onClose()
    } else {
      setDeleting(false)
    }
  }

  return { data, notes, setNotes, notesSaving, saveNotes, deleting, deleteVisitor }
}
