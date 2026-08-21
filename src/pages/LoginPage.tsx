import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CenteredCardShell } from '../components/layout/CenteredCardShell'
import { PageHeader } from '../components/ui/PageHeader'
import { TextField } from '../components/ui/TextField'
import { PrimaryButton } from '../components/ui/Button'
import { StatusMessage } from '../components/ui/StatusMessage'
import { useAuth } from '../auth/useAuth'
import { supabase } from '../lib/supabaseClient'

type LocationState = { from?: { pathname: string } } | null

export function LoginPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isAuthLoading && user) {
    const redirectTo = (location.state as LocationState)?.from?.pathname ?? '/dashboard'
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setIsSubmitting(false)
    if (signInError) {
      setError(signInError.message)
      return
    }
    const redirectTo = (location.state as LocationState)?.from?.pathname ?? '/dashboard'
    navigate(redirectTo, { replace: true })
  }

  return (
    <CenteredCardShell>
      <PageHeader title="Log in" subtitle="Sign in to manage your ESN forms." />
      <form onSubmit={handleSubmit} noValidate>
        <TextField label="Email" type="email" required autoComplete="email" value={email} onChange={setEmail} />
        <TextField
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
        />
        <PrimaryButton type="submit" isSubmitting={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </PrimaryButton>
        <div className="mt-4">
          <StatusMessage tone={error ? 'error' : 'idle'} message={error} />
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Don't have an account? Ask an ESN Form Admin to create one for you.
      </p>
    </CenteredCardShell>
  )
}
