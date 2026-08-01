import { Component, type ErrorInfo, type ReactNode } from 'react'
import { sendEvent } from '@/lib/telemetry'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Rendered in place of children once an error is caught. Defaults to rendering nothing. */
  fallback?: ReactNode
  /** Label used in the console and analytics event so the crash site is identifiable. */
  name: string
}

interface ErrorBoundaryState {
  hasError: boolean
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.name}] section crashed:`, error, info.componentStack)
    sendEvent('section_error', { section: this.props.name, message: error.message })
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null
    return this.props.children
  }
}
