import { useState, type FormEvent } from 'react'
import { validate, type Answers, type Field, type ValidationError } from '../../lib/formField'
import { DynamicFormField } from './DynamicFormField'
import { PrimaryButton } from '../ui/Button'
import { StatusMessage } from '../ui/StatusMessage'
import { Turnstile } from '../ui/Turnstile'

export type SubmitResult = { success: true } | { success: false; error?: string; errors?: ValidationError[] }

type Props = {
  formId: string
  fields: Field[]
  onSubmit: (answers: Answers, turnstileToken: string) => Promise<SubmitResult>
}

// Best-effort only, not real duplicate prevention - a respondent can still
// clear storage or use another browser/device. This just fixes the
// "refreshing brings the form back" UX problem, so it's scoped to
// localStorage rather than anything server-enforced.
function submittedStorageKey(formId: string): string {
  return `esn-forms:submitted:${formId}`
}

function hasAlreadySubmitted(formId: string): boolean {
  try {
    return localStorage.getItem(submittedStorageKey(formId)) === 'true'
  } catch {
    return false
  }
}

// Only active when explicitly configured for local dev (matches a
// TURNSTILE_DEV_BYPASS secret set on submit-form) - never true in a
// production build just because import.meta.env.DEV happens to be set.
const devBypassToken = import.meta.env.DEV ? import.meta.env.VITE_TURNSTILE_DEV_BYPASS : ''

export function DynamicForm({ formId, fields, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Answers>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(() => hasAlreadySubmitted(formId))
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const visibleFields = fields.filter((field) => !field.deprecated)

  function handleChange(fieldId: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))
    setFieldErrors((prev) => {
      if (!(fieldId in prev)) return prev
      const next = { ...prev }
      delete next[fieldId]
      return next
    })
  }

  function applyErrors(errors: ValidationError[]) {
    const next: Record<string, string> = {}
    for (const error of errors) {
      next[error.fieldId] = error.message
    }
    setFieldErrors(next)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError('')

    const clientErrors = validate(fields, answers)
    if (clientErrors.length > 0) {
      applyErrors(clientErrors)
      return
    }

    const token = devBypassToken || turnstileToken
    if (!token) {
      setFormError('Please complete the verification below before submitting.')
      return
    }

    setIsSubmitting(true)
    const result = await onSubmit(answers, token)
    setIsSubmitting(false)

    if (!result.success) {
      if (result.errors && result.errors.length > 0) {
        applyErrors(result.errors)
      }
      setFormError(result.error ?? 'Something went wrong. Please check your answers and try again.')
      return
    }

    setIsSubmitted(true)
    try {
      localStorage.setItem(submittedStorageKey(formId), 'true')
    } catch {
      // Storage unavailable (private browsing, disabled) - the in-memory
      // state above still covers this page load, it just won't survive a
      // refresh.
    }
  }

  if (isSubmitted) {
    return <StatusMessage tone="success" message="Thanks — your response has been recorded." />
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {visibleFields.map((field) => (
        <DynamicFormField key={field.id} field={field} answers={answers} errors={fieldErrors} onChange={handleChange} />
      ))}
      {devBypassToken ? (
        <p className="mb-6 text-xs text-muted">Turnstile skipped (dev mode).</p>
      ) : (
        <Turnstile onVerify={setTurnstileToken} onExpire={() => setTurnstileToken(null)} />
      )}
      <PrimaryButton type="submit" isSubmitting={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting…' : 'Submit'}
      </PrimaryButton>
      <div className="mt-4">
        <StatusMessage tone={formError ? 'error' : 'idle'} message={formError} />
      </div>
    </form>
  )
}
