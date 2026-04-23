import { useState } from 'react'
import { createPortal } from 'react-dom'
import { MessagesSquare, X } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import Button from '../Button'

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
        size="md"
        className="genie-button fixed bottom-6 right-6 z-50 bg-white text-blue shadow-xl hover:bg-off-white [animation:genie-button-in_350ms_cubic-bezier(0.34,1.56,0.64,1)_both]"
        rightIcon={<MessagesSquare size={15} aria-hidden="true" />}
      >
        Start a Chat
      </Button>,
      document.body
    )
  }

  return (
    <div
      className={twMerge(
        'genie-panel relative flex flex-col rounded-2xl border border-white/20 overflow-hidden',
        isClosing && '[animation:genie-out_480ms_cubic-bezier(0.4,0,0.9,0.6)_both]',
        isClosing && 'pointer-events-none',
        className
      )}
    >
      <div className="glass-blur absolute inset-0 bg-white/10 [animation:blur-in_1s_cubic-bezier(0.16,1,0.3,1)_0.3s_both]" />
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-white hover:bg-off-black/20 transition cursor-pointer"
        aria-label="Close chat"
      >
        <X size={16} aria-hidden="true" />
      </button>
      <div className="relative flex-1 min-h-[320px] p-6 flex items-end">
        {children}
      </div>
      <div className="relative border-t border-white/20 p-4 flex flex-col gap-3">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSubmit() }}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-4 py-3 font-sans text-base resize-none focus:outline-none focus:border-white/60 focus:bg-white/15 transition"
        />
        <Button
          onClick={onSubmit}
          size="md"
          className="self-end bg-white text-blue hover:bg-off-white"
          rightIcon={<MessagesSquare size={15} aria-hidden="true" />}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
