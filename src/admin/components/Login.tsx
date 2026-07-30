import { useState } from 'react'
import { Button, Eyebrow, H2, Input, Panel } from '../../components/ui'
import { apiCall } from '../lib/api'

interface LoginProps {
  onSuccess: () => void
}

export default function Login({ onSuccess }: LoginProps) {
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || submitting) return
    setSubmitting(true)
    const result = await apiCall('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }, { errorMessage: 'Login failed.' })
    setSubmitting(false)
    if (result) onSuccess()
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Panel
        variant="raised-dark"
        className="w-full max-w-sm rounded-2xl p-8 shadow-2xl shadow-black/50"
      >
        <div className="mb-6 flex flex-col gap-1">
          <Eyebrow className="text-white/70">eric.sh</Eyebrow>
          <H2 className="text-white">Admin</H2>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="admin-password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            autoFocus
            disabled={submitting}
          />
          <Button type="submit" variant="primary" disabled={submitting || !password} className="self-end">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Panel>
    </div>
  )
}
