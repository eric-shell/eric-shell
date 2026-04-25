export type ToastKind = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  kind: ToastKind
  message: string
  duration: number
}

export interface ToastOptions {
  duration?: number
  id?: string
}

type Listener = (toasts: ToastItem[]) => void

const MAX_VISIBLE = 3
const DEDUPE_WINDOW_MS = 1000
const DEFAULT_DURATIONS: Record<ToastKind, number> = {
  success: 4000,
  info: 4000,
  error: 7000,
}

let toasts: ToastItem[] = []
const listeners = new Set<Listener>()
const recent = new Map<string, number>()

function notify() {
  for (const l of listeners) l(toasts)
}

function add(kind: ToastKind, message: string, options?: ToastOptions): string {
  const key = `${kind}:${message}`
  const now = Date.now()
  const last = recent.get(key)
  if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return ''
  recent.set(key, now)

  const id = options?.id ?? `${now}-${Math.random().toString(36).slice(2, 8)}`
  const duration = options?.duration ?? DEFAULT_DURATIONS[kind]
  const item: ToastItem = { id, kind, message, duration }

  toasts = [...toasts, item].slice(-MAX_VISIBLE)
  notify()
  return id
}

export const toast = {
  success: (message: string, options?: ToastOptions) => add('success', message, options),
  error: (message: string, options?: ToastOptions) => add('error', message, options),
  info: (message: string, options?: ToastOptions) => add('info', message, options),
  dismiss: (id: string) => {
    toasts = toasts.filter(t => t.id !== id)
    notify()
  },
}

export function subscribe(listener: Listener) {
  listeners.add(listener)
  listener(toasts)
  return () => { listeners.delete(listener) }
}
