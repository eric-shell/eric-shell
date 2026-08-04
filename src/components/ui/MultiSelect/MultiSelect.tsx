import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import Button from '../Button'
import type { DropdownOption } from '../Dropdown'
import type { Variant } from '../variants'

export interface MultiSelectProps {
  options: DropdownOption[]
  /** Selected values, in the order they were selected. */
  values: string[]
  onChange: (values: string[]) => void
  /** Trigger label when nothing is selected. Also the accessible name. */
  placeholder?: string
  /** Renders a filter field above the list. Worth it past ~15 options. */
  searchable?: boolean
  searchPlaceholder?: string
  variant?: Variant
  className?: string
}

/** Panel ceiling, and the height below which it would rather open upward. */
const MAX_PANEL_HEIGHT = 288
const MIN_PANEL_HEIGHT = 200
/** Gap between the trigger and the panel, and the panel and the viewport edge. */
const OFFSET = 6
const VIEWPORT_MARGIN = 16

type Coords = {
  top?: number
  bottom?: number
  left: number
  minWidth: number
  maxHeight: number
}

/**
 * A checkbox listbox in a dropdown: the same trigger, portal, and keyboard model
 * as `Dropdown`, but selection is a set and choosing an option does not close
 * the panel.
 *
 * It exists because the Work grid and the notes index used to render one
 * dismissible Button per active tag inline next to the sort control. That row
 * grows without bound — every additional tag pushes the sort dropdown further
 * from the grid it sorts and eventually wraps the control bar onto a third line.
 * A single trigger summarising the selection is a fixed-width control no matter
 * how many tags are on, and it doubles as the standing list of what *can* be
 * filtered, which clicking tags on the cards never exposed.
 *
 * Differences from `Dropdown` that are deliberate, not oversights:
 *
 * - `role="option"` sits on the `<li>` itself rather than on a `<button>` inside
 *   it. A listbox option's contents are supposed to be presentational, and since
 *   focus never leaves the trigger (or the filter field) there is nothing for an
 *   inner button to contribute except a second, wrong accessibility tree.
 * - The panel measures the space around the trigger and opens upward when there
 *   is more of it there. `Dropdown` can skip this because its lists are short;
 *   a 37-tag list pinned below a trigger near the fold is unreachable.
 * - Position is recomputed on scroll and resize. `position: fixed` coordinates
 *   taken once go stale the moment the page moves under them, and this panel
 *   stays open long enough for that to happen.
 */
export default function MultiSelect({
  options,
  values,
  onChange,
  placeholder = 'Select…',
  searchable = false,
  searchPlaceholder = 'Filter…',
  variant = 'primary',
  className = '',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [query, setQuery] = useState('')
  const [coords, setCoords] = useState<Coords | null>(null)

  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()

  const selected = useMemo(
    () => values.map(v => options.find(o => o.value === v)).filter((o): o is DropdownOption => !!o),
    [values, options],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter(o => o.label.toLowerCase().includes(q)) : options
  }, [options, query])

  const measure = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const below = window.innerHeight - rect.bottom - OFFSET - VIEWPORT_MARGIN
    const above = rect.top - OFFSET - VIEWPORT_MARGIN
    const dropUp = below < MIN_PANEL_HEIGHT && above > below
    setCoords({
      ...(dropUp
        ? { bottom: window.innerHeight - rect.top + OFFSET }
        : { top: rect.bottom + OFFSET }),
      left: rect.left,
      minWidth: rect.width,
      maxHeight: Math.max(Math.min(MAX_PANEL_HEIGHT, dropUp ? above : below), 120),
    })
  }, [])

  /**
   * Open and close do their own state setup rather than leaning on an effect
   * that watches `open`. Measuring in the handler also means `coords` is ready
   * on the panel's first render, so it never paints at the wrong position.
   */
  function openPanel() {
    measure()
    setFocusedIndex(0)
    setOpen(true)
  }

  function close(restoreFocus = false) {
    setOpen(false)
    setQuery('')
    setFocusedIndex(-1)
    setCoords(null)
    if (restoreFocus) triggerRef.current?.focus()
  }

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const inTrigger = wrapRef.current?.contains(e.target as Node)
      const inPanel = panelRef.current?.contains(e.target as Node)
      if (!inTrigger && !inPanel) close()
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    if (!open) return
    // `capture` so the panel tracks any scrolling ancestor, not only the window.
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [open, measure])

  // Focus moves into the filter field so typing goes somewhere sensible; without
  // it the first keystroke lands on the trigger and does nothing.
  useEffect(() => {
    if (open && searchable) searchRef.current?.focus()
  }, [open, searchable])

  useEffect(() => {
    if (!open || focusedIndex < 0) return
    const el = listRef.current?.querySelector<HTMLLIElement>(
      `#${CSS.escape(listboxId)}-opt-${focusedIndex}`,
    )
    el?.scrollIntoView({ block: 'nearest' })
  }, [focusedIndex, listboxId, open])

  function toggleAt(i: number) {
    const opt = filtered[i]
    if (!opt) return
    onChange(
      values.includes(opt.value)
        ? values.filter(v => v !== opt.value)
        : [...values, opt.value],
    )
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openPanel()
      }
      return
    }
    const count = filtered.length
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        close(true)
        break
      case 'ArrowDown':
        e.preventDefault()
        if (count) setFocusedIndex(i => (i + 1) % count)
        break
      case 'ArrowUp':
        e.preventDefault()
        if (count) setFocusedIndex(i => (i - 1 + count) % count)
        break
      case 'Home':
        // Left to the caret when there is a field to move it in.
        if (searchable) break
        e.preventDefault()
        setFocusedIndex(0)
        break
      case 'End':
        if (searchable) break
        e.preventDefault()
        setFocusedIndex(count - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0) toggleAt(focusedIndex)
        break
      case ' ':
        // Space is a character while the filter field has focus.
        if (searchable && document.activeElement === searchRef.current) break
        e.preventDefault()
        if (focusedIndex >= 0) toggleAt(focusedIndex)
        break
      case 'Tab':
        close()
        break
    }
  }

  const count = selected.length
  const triggerLabel =
    count === 0 ? placeholder : count === 1 ? selected[0].label : `${selected[0].label} +${count - 1}`
  // Range-checked, not just `>= 0`: a query that narrows the list to nothing
  // would otherwise point assistive tech at an id no longer in the document.
  const activeDescendant =
    open && focusedIndex >= 0 && focusedIndex < filtered.length
      ? `${listboxId}-opt-${focusedIndex}`
      : undefined

  return (
    <div ref={wrapRef} className={`relative inline-block ${className}`} onKeyDown={handleKeyDown}>
      <Button
        ref={triggerRef}
        type="button"
        variant={variant}
        size="md"
        onClick={() => (open ? close() : openPanel())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        // Without this the button announces as "Tailwind +2" — the visual
        // summary alone never says what it is a summary of.
        aria-label={count === 0 ? placeholder : `${placeholder}, ${count} selected`}
        {...(searchable ? {} : { 'aria-activedescendant': activeDescendant })}
        rightIcon={
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            strokeWidth={2.5}
            aria-hidden="true"
          />
        }
      >
        {triggerLabel}
      </Button>

      {open && coords && createPortal(
        <div
          ref={panelRef}
          style={{
            top: coords.top,
            bottom: coords.bottom,
            left: coords.left,
            minWidth: coords.minWidth,
            maxHeight: coords.maxHeight,
          }}
          className="fixed z-[9999] flex flex-col overflow-hidden rounded-lg border border-blue-950/10 bg-white shadow-lg"
        >
          {searchable && (
            <div className="relative shrink-0 border-b border-blue-950/10">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-950/40"
                strokeWidth={2.5}
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={listboxId}
                aria-activedescendant={activeDescendant}
                aria-label={searchPlaceholder}
                autoComplete="off"
                value={query}
                // Narrowing the list renumbers every option, so a held index
                // would point at a different tag than the one it highlighted.
                onChange={(e) => { setQuery(e.target.value); setFocusedIndex(0) }}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent py-2.5 pl-9 pr-3 font-sans text-sm font-semibold text-blue-950 placeholder:font-normal placeholder:text-blue-950/40 focus:outline-none"
              />
            </div>
          )}

          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            aria-label={placeholder}
            tabIndex={-1}
            className="min-h-0 flex-1 overflow-y-auto py-1"
          >
            {filtered.map((option, i) => {
              const isSelected = values.includes(option.value)
              const isFocused = i === focusedIndex
              return (
                <li
                  key={option.value}
                  id={`${listboxId}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggleAt(i)}
                  onMouseEnter={() => setFocusedIndex(i)}
                  className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 font-sans text-sm font-semibold text-blue-950 transition ${
                    isFocused ? 'bg-blue-50' : ''
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                      isSelected
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : 'border-blue-950/25 bg-white text-transparent'
                    }`}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {option.icon && <span aria-hidden="true">{option.icon}</span>}
                  <span className="truncate">{option.label}</span>
                </li>
              )
            })}

            {filtered.length === 0 && (
              <li className="px-3 py-3 font-sans text-sm text-blue-950/50">No matches</li>
            )}
          </ul>

          {count > 0 && (
            <div className="shrink-0 border-t border-blue-950/10">
              {/*
                Same `px-3` inset, `gap-2.5`, and 4x4 leading box as an option
                row, so the X sits in the checkbox column rather than starting a
                second, ragged text edge under the list.
              */}
              <button
                type="button"
                tabIndex={-1}
                // Clearing unmounts this row, and the browser answers a focused
                // element disappearing by resetting focus to <body> — outside
                // the React tree the wrapper's key handler listens on, which
                // left Escape and the arrows dead until the user clicked back
                // in. Refusing the focus on mousedown keeps it where it was;
                // the explicit refocus covers a click that lands some other way.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange([])
                  ;(searchable ? searchRef : triggerRef).current?.focus()
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left font-sans text-sm font-semibold text-blue-950/60 transition hover:bg-blue-50 hover:text-blue-950"
              >
                <span aria-hidden="true" className="flex h-4 w-4 shrink-0 items-center justify-center">
                  <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                Clear {count} selected
              </button>
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
