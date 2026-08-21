import { useState, type FormEvent } from 'react'
import { validate, type Answers, type Field, type ValidationError } from '../../lib/formField'
import { DynamicFormField } from './DynamicFormField'
import { PrimaryButton } from '../ui/Button'
import { StatusMessage } from '../ui/StatusMessage'

export type SubmitResult = { success: true } | { success: false; error?: string; errors?: ValidationError[] }

type Props = {
  fields: Field[]
  onSubmit: (answers: Answers) => Promise<SubmitResult>
}

export function DynamicForm({ fields, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Answers>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

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

    setIsSubmitting(true)
    const result = await onSubmit(answers)
    setIsSubmitting(false)

    if (!result.success) {
      if (result.errors && result.errors.length > 0) {
        applyErrors(result.errors)
      }
      setFormError(result.error ?? 'Something went wrong. Please check your answers and try again.')
      return
    }

    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return <StatusMessage tone="success" message="Thanks — your response has been recorded." />
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {visibleFields.map((field) => (
        <DynamicFormField key={field.id} field={field} answers={answers} errors={fieldErrors} onChange={handleChange} />
      ))}
      <PrimaryButton type="submit" isSubmitting={isSubmitting} className="mt-8 w-full">
        {isSubmitting ? 'Submitting…' : 'Submit'}
      </PrimaryButton>
      <div className="mt-4">
        <StatusMessage tone={formError ? 'error' : 'idle'} message={formError} />
      </div>
    </form>
  )
}
