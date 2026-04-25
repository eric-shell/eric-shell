import { useState, useRef, useEffect } from 'react'
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
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number; minWidth: number } | null>(null)

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
    }
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={ref} className={`relative inline-block ${className}`} onKeyDown={handleKeyDown}>
      <Button
        type="button"
        variant="primary"
        size="md"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        leftIcon={selected?.icon}
        rightIcon={
          <ChevronDown
            className={`h-5 w-5 text-blue-950 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            strokeWidth={2}
            aria-hidden="true"
          />
        }
        className="rounded-lg border border-blue-950/10 hover:bg-white hover:border-blue-950/30 hover:shadow-sm"
      >
        {selected?.label ?? placeholder}
      </Button>

      {open && coords && createPortal(
        <ul
          ref={listRef}
          role="listbox"
          style={{ top: coords.top, left: coords.left, minWidth: coords.minWidth }}
          className="fixed z-[9999] overflow-hidden rounded-lg border border-blue-950/10 bg-white shadow-lg"
        >
          {options.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={`flex items-center gap-2 w-full px-4 py-2 text-left font-sans text-sm font-semibold transition hover:bg-blue-950/5 cursor-pointer ${
                  option.value === value ? 'text-blue-700' : 'text-blue-950'
                }`}
              >
                {option.icon && <span aria-hidden="true">{option.icon}</span>}
                {option.label}
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  )
}
