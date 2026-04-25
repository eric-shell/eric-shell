import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { SURFACE, type Variant } from '../variants'
import Button from '../Button'
import { toast, type ToastItem, type ToastKind } from './toastStore'

const KIND_VARIANT: Record<ToastKind, Variant> = {
  success: 'success-glass',
  error: 'error-glass',
  info: 'glass-dark',
}

const ICON_COLOR: Record<ToastKind, string> = {
  success: 'text-green-200',
  error: 'text-red-200',
  info: 'text-blue-200',
}

const ICON: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const EXIT_MS = 250

export default function Toast({ item }: { item: ToastItem }) {
  const [exiting, setExiting] = useState(false)
  const timeoutRef = useRef<number | null>(null)
  const remainingRef = useRef(item.duration)
  const startedAtRef = useRef(Date.now())

  const beginDismiss = () => {
    setExiting(true)
    window.setTimeout(() => toast.dismiss(item.id), EXIT_MS)
  }

  const startTimer = (ms: number) => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    startedAtRef.current = Date.now()
    timeoutRef.current = window.setTimeout(beginDismiss, ms)
  }

  const pauseTimer = () => {
    if (timeoutRef.current === null) return
    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current))
  }

  useEffect(() => {
    startTimer(remainingRef.current)
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const Icon = ICON[item.kind]

  return (
    <div
      role={item.kind === 'error' ? 'alert' : 'status'}
      onMouseEnter={pauseTimer}
      onMouseLeave={() => startTimer(remainingRef.current)}
      className={twMerge(
        'toast-item pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg w-[360px] max-w-[calc(100vw-3rem)]',
        SURFACE[KIND_VARIANT[item.kind]],
        item.kind === 'info' && 'border-l-4 border-l-blue-400',
        exiting
          ? '[animation:toast-out_250ms_cubic-bezier(0.4,0,0.9,0.6)_both]'
          : '[animation:toast-in_300ms_cubic-bezier(0.16,1,0.3,1)_both]',
      )}
    >
      <Icon size={18} strokeWidth={2.5} aria-hidden="true" className={twMerge('mt-0.5 shrink-0', ICON_COLOR[item.kind])} />
      <p className="flex-1 font-sans text-sm leading-snug text-white">{item.message}</p>
      <Button
        onClick={beginDismiss}
        variant="glass-dark"
        shape="square"
        size="sm"
        className="-mr-1 -mt-1 border-0 bg-transparent shrink-0"
        aria-label="Dismiss notification"
      >
        <X size={14} strokeWidth={2.5} aria-hidden="true" />
      </Button>
    </div>
  )
}
