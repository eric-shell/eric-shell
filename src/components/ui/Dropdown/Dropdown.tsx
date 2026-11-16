import { useState, useRef, useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import Button from '../Button'

export interface DropdownOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface DropdownProps {
  options: DropdownOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  className = '',
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number; minWidth: number } | null>(null)
  const listboxId = useId()

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const inTrigger = ref.current?.contains(e.target as Node)
      const inList = listRef.current?.contains(e.target as Node)
      if (!inTrigger && !inList) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + 6, left: rect.left, minWidth: rect.width })
      const selectedIdx = options.findIndex((o) => o.value === value)
      setFocusedIndex(selectedIdx >= 0 ? selectedIdx : 0)
    } else {
      setFocusedIndex(-1)
    }
  }, [open, options, value])

  useEffect(() => {
    if (!open || focusedIndex < 0) return
    const el = listRef.current?.querySelector<HTMLLIElement>(`#${CSS.escape(listboxId)}-opt-${focusedIndex}`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [focusedIndex, listboxId, open])

  function selectAt(i: number) {
    const opt = options[i]
    if (!opt) return
    onChange(opt.value)
    setOpen(false)
    // The list unmounts on close. Whatever had focus inside it is gone, and
    // the browser's answer to that is to drop focus on <body>, which leaves the
    // keyboard dead until the next click. See the list's `onMouseDown` too.
    triggerRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(i => (i + 1) % options.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(i => (i - 1 + options.length) % options.length)
        break
      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        break
      case 'End':
        e.preventDefault()
        setFocusedIndex(options.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0) selectAt(focusedIndex)
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  const activeDescendant = open && focusedIndex >= 0 ? `${listboxId}-opt-${focusedIndex}` : undefined

  return (
    <div ref={ref} className={`relative inline-block ${className}`} onKeyDown={handleKeyDown}>
      <Button
        ref={triggerRef}
        type="button"
        variant="primary"
        size="md"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={activeDescendant}
        leftIcon={selected?.icon}
        rightIcon={
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            strokeWidth={2.5}
            aria-hidden="true"
          />
        }
      >
        {selected?.label ?? placeholder}
      </Button>

      {open && coords && createPortal(
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          // Focus never moves into the list: the trigger keeps it and points at
          // the active option with `aria-activedescendant`, which is what the
          // keyboard handling above assumes. A mouse press would otherwise
          // focus the option being clicked, and that option is about to
          // unmount. Same fix MultiSelect carries, for the same bug.
          onMouseDown={(e) => e.preventDefault()}
          style={{ top: coords.top, left: coords.left, minWidth: coords.minWidth }}
          className="fixed z-[9999] overflow-hidden rounded-lg border border-blue-950/10 bg-white shadow-lg"
        >
          {options.map((option, i) => {
            const isSelected = option.value === value
            const isFocused = i === focusedIndex
            return (
              <li
                key={option.value}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={isSelected}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => selectAt(i)}
                  onMouseEnter={() => setFocusedIndex(i)}
                  className={`flex items-center gap-2 w-full px-4 py-2 text-left font-sans text-sm font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'text-white bg-blue-700'
                      : isFocused
                        ? 'text-blue-950 bg-blue-50'
                        : 'text-blue-950 hover:bg-blue-50'
                  }`}
                >
                  {option.icon && <span aria-hidden="true">{option.icon}</span>}
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>,
        document.body
      )}
    </div>
  )
}
