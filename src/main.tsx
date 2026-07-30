import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { initTelemetry } from './lib/telemetry'

console.log(
  '%ceric.sh%c\n\nYou opened the console — my kind of visitor.\nBuilt with React 19, Tailwind v4, and restraint.\nTalk shop: ericjshell@gmail.com',
  'font: 700 14px/2.2 system-ui; padding: 2px 10px; background: oklch(0.546 0.091 231.5); color: #fff; border-radius: 4px;',
  'font: 13px/1.5 system-ui; color: inherit;',
)

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found in index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Outside the React tree on purpose: StrictMode double-invokes effects in dev,
// which would double-count the pageview. Never let telemetry break the render.
try {
  initTelemetry()
} catch (err) {
  if (import.meta.env.DEV) console.warn('Telemetry init failed:', err)
}
