export interface Visitor {
  id: string
  first_seen_at: string
  last_seen_at: string
  user_agent: string | null
  country: string | null
  city: string | null
  referrer: string | null
  notes: string | null
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ContactSubmission {
  id: number
  name: string
  email: string
  message: string
  created_at: string
}

export interface VisitorDetailPayload {
  visitor: Visitor
  messages: ChatMessage[]
  submissions: ContactSubmission[]
  events: Record<string, number>
  clearEvents: { created_at: string }[]
}

export interface VisitorSummary {
  id: string
  first_seen_at: string
  last_seen_at: string
  user_agent: string | null
  country: string | null
  city: string | null
  referrer: string | null
  chat_message_count: number
  contact_count: number
  last_activity_at: string
  contact_name: string | null
  contact_email: string | null
}

export interface StatDay {
  date: string
  visitors: number
}

export interface StatsPayload {
  days: StatDay[]
}

export interface VisitorListPayload {
  visitors: VisitorSummary[]
}
