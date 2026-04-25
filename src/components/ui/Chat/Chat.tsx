import { useState } from 'react'
import { createPortal } from 'react-dom'
import { MessagesSquare, X } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import Button from '../Button'
import Panel from '../Panel'

interface ChatProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  submitLabel?: string
  children?: React.ReactNode
  className?: string
}

const GENIE_DURATION_MS = 480

export default function Chat({
  value,
  onChange,
  onSubmit,
  placeholder = 'Ask me anything…',
  submitLabel = 'Start a Chat',
  children,
  className,
}: ChatProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [isWhite, setIsWhite] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
    }, GENIE_DURATION_MS)
  }

  if (!isOpen) {
    return createPortal(
      <Button
        onClick={() => setIsOpen(true)}
        variant="primary"
        size="md"
        className="genie-button fixed bottom-6 right-6 z-50 shadow-xl [animation:genie-button-in_350ms_cubic-bezier(0.34,1.56,0.64,1)_both]"
        rightIcon={<MessagesSquare size={15} strokeWidth={2.5} aria-hidden="true" />}
      >
        Start a Chat
      </Button>,
      document.body
    )
  }

  return (
    <div
      className={twMerge(
        'genie-panel relative flex flex-col rounded-2xl overflow-hidden border',
        isWhite ? 'border-blue-950/10' : 'border-white/20',
        isClosing && '[animation:genie-out_480ms_cubic-bezier(0.4,0,0.9,0.6)_both]',
        isClosing && 'pointer-events-none',
        className
      )}
    >
      <Panel
        variant={isWhite ? 'white' : 'glass-light'}
        className="absolute inset-0 border-0 [animation:blur-in_1s_cubic-bezier(0.16,1,0.3,1)_0.3s_both]"
      />
      <button
        role="switch"
        aria-checked={isWhite}
        aria-label="Toggle high-contrast mode"
        onClick={() => setIsWhite(v => !v)}
        className={twMerge(
          'absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors',
          isWhite ? 'text-blue-950' : 'text-white'
        )}
      >
        <span className={twMerge(
          'relative inline-flex h-4 w-7 items-center rounded-full transition-colors',
          isWhite ? 'bg-blue-700' : 'bg-white/30'
        )}>
          <span className={twMerge(
            'inline-block h-2.5 w-2.5 rounded-full bg-white shadow transition-transform',
            isWhite ? 'translate-x-3.5' : 'translate-x-0.5'
          )} />
        </span>
        <span className="font-sans text-xs font-semibold tracking-wide">AA</span>
      </button>
      <Button
        onClick={handleClose}
        variant={isWhite ? 'ghost' : 'glass-dark'}
        shape="square"
        size="sm"
        className="absolute top-3 right-3 z-10 border-0"
        aria-label="Close chat"
      >
        <X size={16} strokeWidth={2.5} aria-hidden="true" />
      </Button>
      <div className="relative flex-1 min-h-[320px] p-6 flex items-end">
        {children}
      </div>
      <div className={twMerge(
        'relative border-t p-4 flex flex-col gap-3',
        isWhite ? 'border-blue-950/10' : 'border-white/20'
      )}>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSubmit() }}
          placeholder={placeholder}
          rows={3}
          className={twMerge(
            'w-full rounded-lg border px-4 py-3 font-sans text-base resize-none focus:outline-none transition',
            isWhite
              ? 'bg-white border-blue-950/20 text-blue-950 placeholder:text-blue-950/30 focus:border-blue-700'
              : 'bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/60 focus:bg-white/15'
          )}
        />
        <Button
          onClick={onSubmit}
          variant="primary"
          size="md"
          className="shadow-md self-end"
          rightIcon={<MessagesSquare size={15} strokeWidth={2.5} aria-hidden="true" />}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
