import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Toast from './Toast'
import { subscribe, type ToastItem } from './toastStore'

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return subscribe(setItems)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      aria-live="polite"
      className="fixed bottom-6 left-6 z-[950] flex flex-col-reverse gap-2 pointer-events-none"
    >
      {items.map(item => (
        <Toast key={item.id} item={item} />
      ))}
    </div>,
    document.body,
  )
}
