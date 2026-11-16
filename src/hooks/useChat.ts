import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '../components/ui'
import { identityHeaders, sendEvent } from '../lib/telemetry'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'eric.sh:chat:v1'

function readStored(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (m): m is ChatMessage =>
        m && typeof m === 'object' &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string'
    )
  } catch {
    return []
  }
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(readStored)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // The request in flight, if any. `reset` aborts it: clearing the thread while
  // a reply was pending used to leave the fetch running, and the reply then
  // landed in the emptied thread (and in localStorage) as a lone assistant turn.
  const inFlight = useRef<AbortController | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // quota exceeded or storage disabled — silently ignore
    }
  }, [messages])

  const send = useCallback(async (promptText?: string) => {
    const trimmed = (promptText ?? input).trim()
    if (!trimmed || isLoading) return

    const turnIndex = messages.length
    const startedAt = performance.now()
    const elapsed = () => Math.round(performance.now() - startedAt)

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    const history = [...messages, userMessage]
    setMessages(history)
    setInput('')
    setIsLoading(true)

    const controller = new AbortController()
    inFlight.current = controller

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...identityHeaders(),
          'X-Referrer': document.referrer,
        },
        body: JSON.stringify({ messages: history, website: '' }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        toast.error(data.error || 'Chat failed. Please try again.')
        setMessages(prev => prev.slice(0, -1))
        setInput(trimmed)
        sendEvent('chat_error', {
          turn_index: turnIndex,
          error_type: 'http_error',
          duration_ms: elapsed(),
        })
        return
      }

      if (!response.body) {
        toast.error('Chat failed. Please try again.')
        setMessages(prev => prev.slice(0, -1))
        setInput(trimmed)
        sendEvent('chat_error', {
          turn_index: turnIndex,
          error_type: 'empty_body',
          duration_ms: elapsed(),
        })
        return
      }

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        if (!text) continue
        setMessages(prev => {
          const next = prev.slice()
          const last = next[next.length - 1]
          if (!last || last.role !== 'assistant') return prev
          next[next.length - 1] = { ...last, content: last.content + text }
          return next
        })
      }

    } catch {
      // Cleared on purpose, not a failure: `reset` has already emptied the
      // thread, so there is nothing to roll back, report, or apologise for.
      if (controller.signal.aborted) return
      toast.error('An unexpected error occurred. Please try again.')
      setMessages(prev => {
        const last = prev[prev.length - 1]
        // If we already started streaming an assistant message, drop both turns;
        // otherwise just drop the user message we optimistically added.
        if (last?.role === 'assistant') return prev.slice(0, -2)
        return prev.slice(0, -1)
      })
      setInput(trimmed)
      sendEvent('chat_error', {
        turn_index: turnIndex,
        error_type: 'network',
        duration_ms: elapsed(),
      })
    } finally {
      // Only if this is still the current request. After a clear, `reset` has
      // already dropped the flag, and a send started since then owns it — an
      // aborted request settling late must not switch that one's spinner off.
      if (inFlight.current === controller) {
        inFlight.current = null
        setIsLoading(false)
      }
    }
  }, [input, isLoading, messages])

  const reset = useCallback(() => {
    inFlight.current?.abort()
    inFlight.current = null
    setMessages([])
    setInput('')
    setIsLoading(false)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    }
  }, [])

  return { messages, input, setInput, send, isLoading, reset }
}
