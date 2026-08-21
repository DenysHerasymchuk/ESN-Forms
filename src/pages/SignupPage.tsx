import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { CenteredCardShell } from '../components/layout/CenteredCardShell'
import { PageHeader } from '../components/ui/PageHeader'
import { TextField } from '../components/ui/TextField'
import { PrimaryButton } from '../components/ui/Button'
import { StatusMessage } from '../components/ui/StatusMessage'
import { useAuth } from '../auth/useAuth'
import { supabase } from '../lib/supabaseClient'

export function SignupPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isAuthLoading && user) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    setIsSubmitting(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    if (data.session) {
      navigate('/dashboard', { replace: true })
      return
    }

    setError('Account created. Try logging in.')
  }

  return (
    <CenteredCardShell>
      <PageHeader title="Sign up" subtitle="Create an account to start building ESN forms." />
      <form onSubmit={handleSubmit} noValidate>
        <TextField label="Email" type="email" required autoComplete="email" value={email} onChange={setEmail} />
        <TextField
          label="Password"
          type="password"
          required
          helpText="At least 6 characters."
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
        />
        <TextField
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />
        <PrimaryButton type="submit" isSubmitting={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? 'Creating account…' : 'Sign up'}
        </PrimaryButton>
        <div className="mt-4">
          <StatusMessage tone={error ? 'error' : 'idle'} message={error} />
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-esn-blue hover:underline">
          Log in
        </Link>
      </p>
    </CenteredCardShell>
  )
}
