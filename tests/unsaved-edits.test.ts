/**
 * The CRM's unsaved-notes guard. Every close path for the visitor drawer asks
 * this module before throwing edits away, so a regression here loses work
 * silently, in every one of them at once.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearUnsaved, confirmDiscard, setUnsaved, unsavedVisitorId } from '../src/admin/lib/unsavedEdits'

const confirmSpy = vi.fn<(message?: string) => boolean>()

beforeEach(() => {
  clearUnsaved()
  confirmSpy.mockReset()
  vi.stubGlobal('confirm', confirmSpy)
})
afterEach(() => { vi.unstubAllGlobals() })

describe('unsavedEdits', () => {
  it('does not prompt when nothing is unsaved', () => {
    expect(confirmDiscard()).toBe(true)
    expect(confirmSpy).not.toHaveBeenCalled()
  })

  it('prompts when a drawer is dirty, and honours the answer', () => {
    setUnsaved('a', true)
    confirmSpy.mockReturnValueOnce(false)
    expect(confirmDiscard()).toBe(false)
    confirmSpy.mockReturnValueOnce(true)
    expect(confirmDiscard()).toBe(true)
  })

  it('lets a drawer clear only its own flag', () => {
    // Two drawers can be mounted for one visitor, and a closing one lingers for
    // its animation. A bare boolean let either wipe the flag the visible one set.
    setUnsaved('a', true)
    setUnsaved('b', false)
    expect(unsavedVisitorId()).toBe('a')
    setUnsaved('a', false)
    expect(unsavedVisitorId()).toBeNull()
  })

  it('forgets everything on clearUnsaved', () => {
    setUnsaved('a', true)
    clearUnsaved()
    expect(confirmDiscard()).toBe(true)
    expect(confirmSpy).not.toHaveBeenCalled()
  })
})
