import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import Toast from './Toast'
import { subscribe, getToasts } from './toastStore'

export default function Toaster() {
  const items = useSyncExternalStore(subscribe, getToasts)

  return createPortal(
    <div
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[950] flex flex-col-reverse gap-2 pointer-events-none items-center"
    >
      {items.map(item => (
        <Toast key={item.id} item={item} />
      ))}
    </div>,
    document.body,
  )
}
