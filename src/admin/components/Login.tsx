import { useState } from 'react'
import { Button, Eyebrow, H1, Input, Panel } from '../../components/ui'

interface LoginProps {
  onSuccess: () => void
}

type Step = 'password' | 'code'

interface LoginResponse {
  ok?: boolean
  mfa?: boolean
  challengeId?: string
  error?: string
}

/**
 * H1's own scale (`md:text-8xl`) is the hero size. The sign-in family — this
 * page, public/404.html, public/403.html — shares one headline clamp so the
 * three read as one system; it is set inline because both values are font-size
 * utilities of equal specificity and their order in the generated stylesheet,
 * not the class list, would decide the winner.
 */
const HEADLINE = { fontSize: 'clamp(2.25rem, 9vw, 4.5rem)' }

/**
 * Two-step sign-in: password, then the 6-digit code emailed to
 * `ADMIN_2FA_EMAIL`. The server decides whether step two happens — when the
 * second factor isn't configured, or Upstash or Resend is down, `/api/admin/login`
 * answers `mfa: false` with a session already set and this jumps straight
 * through (see the fail-open note in api/_lib/auth.ts).
 *
 * Errors are inline rather than toasts. A toast is transient and lands in the
 * corner; a failed sign-in is the only thing on this page and the message often
 * says what to do next ("start again to get a new one").
 */
export default function Login({ onSuccess }: LoginProps) {
  const [step, setStep] = useState<Step>('password')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function post(url: string, payload: unknown): Promise<LoginResponse | null> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null) as LoginResponse | null
      if (!res.ok) {
        setError(data?.error || 'Sign-in failed. Try again.')
        return null
      }
      return data ?? {}
    } catch {
      setError('Network error. Check your connection and try again.')
      return null
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!password || submitting) return
    setSubmitting(true)
    setError('')

    const data = await post('/api/admin/login', { password })
    setSubmitting(false)
    if (!data) return

    if (data.mfa && data.challengeId) {
      setChallengeId(data.challengeId)
      setPassword('')
      setCode('')
      setStep('code')
      return
    }
    onSuccess()
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6 || submitting) return
    setSubmitting(true)
    setError('')

    const data = await post('/api/admin/verify', { challengeId, code })
    setSubmitting(false)
    if (!data) {
      setCode('')
      return
    }
    onSuccess()
  }

  function startOver() {
    setStep('password')
    setChallengeId('')
    setCode('')
    setPassword('')
    setError('')
  }

  const isCodeStep = step === 'code'

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-120 text-center">

        <div className="mb-10 flex justify-center gap-3">
          <img src="/icon.svg" alt="" className="h-10" />
          <img src="/logo.svg" alt="Eric Shell" className="h-10" />
        </div>

        {/* <Eyebrow className="mb-3 block text-white/85">eric.sh</Eyebrow> */}
        <H1 className="mb-5 text-white" style={HEADLINE}>
          {isCodeStep ? 'Verify' : 'Admin'}
        </H1>
        <p className="mx-auto mb-8 max-w-104 text-base leading-relaxed text-white/65">
          {isCodeStep
            ? 'A 6-digit code is on its way to your inbox. It expires in five minutes and can be used once.'
            : 'This area is private. Sign in to continue.'}
        </p>

        <Panel
          variant="raised-dark"
          className="mx-auto w-full max-w-sm rounded-2xl p-6 text-left shadow-2xl shadow-black/40"
        >
          {isCodeStep ? (
            <form onSubmit={submitCode} className="flex flex-col gap-4">
              <Input
                id="admin-code"
                label="Verification code"
                theme="dark"
                value={code}
                // Strip anything that isn't a digit as it's typed — pasting a
                // code out of an email frequently brings a space with it.
                onChange={v => { setCode(v.replace(/\D/g, '').slice(0, 6)); setError('') }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                showCount={false}
                placeholder="000000"
                className="text-center text-lg tracking-[0.4em]"
                autoFocus
                disabled={submitting}
              />
              {error && (
                <Panel variant="error-glass" role="alert" className="rounded-lg px-3 py-2 text-sm leading-snug">
                  {error}
                </Panel>
              )}
              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="raised-dark" size="sm" onClick={startOver} disabled={submitting}>
                  Start over
                </Button>
                <Button type="submit" variant="primary" disabled={submitting || code.length !== 6}>
                  {submitting ? 'Verifying…' : 'Verify'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={submitPassword} className="flex flex-col gap-4">
              <Input
                id="admin-password"
                label="Password"
                type="password"
                theme="dark"
                value={password}
                onChange={v => { setPassword(v); setError('') }}
                autoComplete="current-password"
                autoFocus
                disabled={submitting}
              />
              {error && (
                <Panel variant="error-glass" role="alert" className="rounded-lg px-3 py-2 text-sm leading-snug">
                  {error}
                </Panel>
              )}
              <Button type="submit" variant="primary" disabled={submitting || !password} className="self-end">
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          )}
        </Panel>

      </div>
    </div>
  )
}
