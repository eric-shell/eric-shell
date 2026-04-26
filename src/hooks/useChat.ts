import { useCallback, useEffect, useState } from 'react'
import { toast } from '../components/ui'

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // quota exceeded or storage disabled — silently ignore
    }
  }, [messages])

  const send = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    const history = [...messages, userMessage]
    setMessages(history)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, website: '' }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        toast.error(data.error || 'Chat failed. Please try again.')
        setMessages(prev => prev.slice(0, -1))
        setInput(trimmed)
        return
      }

      if (!response.body) {
        toast.error('Chat failed. Please try again.')
        setMessages(prev => prev.slice(0, -1))
        setInput(trimmed)
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
      toast.error('An unexpected error occurred. Please try again.')
      setMessages(prev => {
        const last = prev[prev.length - 1]
        // If we already started streaming an assistant message, drop both turns;
        // otherwise just drop the user message we optimistically added.
        if (last?.role === 'assistant') return prev.slice(0, -2)
        return prev.slice(0, -1)
      })
      setInput(trimmed)
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages])

  const reset = useCallback(() => {
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
