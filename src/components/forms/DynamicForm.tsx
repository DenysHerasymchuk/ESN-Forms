import { useState, type FormEvent } from 'react'
import { FaCircleCheck } from 'react-icons/fa6'
import { isEmpty, validate, type Answers, type Field, type ValidationError } from '../../lib/formField'
import { DynamicFormField } from './DynamicFormField'
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
  const requiredFields = visibleFields.filter((field) => field.required)
  const answeredRequiredCount = requiredFields.filter((field) => !isEmpty(answers[field.id])).length
  const progressPercent =
    requiredFields.length > 0 ? Math.round((answeredRequiredCount / requiredFields.length) * 100) : 0
  const fillPercent = isSubmitting ? 100 : progressPercent

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
    return (
      <div className="animate-rise flex flex-col items-center py-6 text-center">
        <FaCircleCheck aria-hidden="true" className="animate-success-pop text-6xl text-success" />
        <p className="mt-4 text-xl font-semibold text-ink">Thanks!</p>
        <p className="mt-1 text-sm text-muted">Your response has been recorded.</p>
      </div>
    )
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
      <button
        type="submit"
        disabled={isSubmitting}
        aria-label={isSubmitting ? 'Submitting…' : 'Submit'}
        className={`relative isolate w-full overflow-hidden rounded-lg bg-slate-400 py-3.5 text-base font-semibold transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esn-blue active:scale-[0.97] ${
          isSubmitting ? 'cursor-progress' : ''
        }`}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 -z-10 bg-esn-blue transition-[width] duration-300 ease-out"
          style={{ width: fillPercent === 100 ? '100%' : `max(0px, calc(${fillPercent}% - 12px))` }}
        />
        {/* Stays mounted always (rather than conditionally rendered) so its
            `left` transition can animate it in from fully off-screen as
            fillPercent first goes above 0 - conditionally mounting it
            meant it had no prior state to transition from, so it just
            popped into place instead of sweeping in with the blue fill.
            At 100% there's no boundary left for it to sit at, so it just
            fades out in place instead of visibly sliding away. */}
        <span
          aria-hidden="true"
          className="wave-fill-edge absolute inset-y-0 -z-10 w-6 transition-[left,opacity] duration-300 ease-out"
          style={{
            left: fillPercent === 0 ? '-24px' : `calc(${fillPercent}% - 12px)`,
            opacity: fillPercent === 100 ? 0 : 1,
          }}
        />
        <span className="relative z-10 text-white">{isSubmitting ? 'Submitting…' : 'Submit'}</span>
      </button>
      {requiredFields.length > 0 && (
        <p className="mt-2 flex items-center justify-between text-xs font-medium text-muted">
          <span>
            {answeredRequiredCount} of {requiredFields.length} required question
            {requiredFields.length === 1 ? '' : 's'} answered
          </span>
          <span>{progressPercent}%</span>
        </p>
      )}
      <div className="mt-4">
        <StatusMessage tone={formError ? 'error' : 'idle'} message={formError} />
      </div>
    </form>
  )
}
