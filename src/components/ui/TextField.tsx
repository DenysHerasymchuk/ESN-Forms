import { useId } from 'react'

const requiredMark = "after:ml-0.5 after:text-error after:content-['*']"
const inputBase =
  'w-full rounded-lg border bg-white px-4 py-3 text-base text-ink placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-esn-blue/30'
const inputValid = 'border-slate-300 focus:border-esn-blue'
const inputInvalid = 'border-error focus:border-error focus:ring-error/25'
// The app's --color-success (#166534) is a dark, muted green meant for
// text - at 1-2px border widths it reads as near-black rather than a
// clear "success" signal. esn-green (#22c55e) is the brighter brand green
// used elsewhere and stays legibly green even that thin.
const inputSuccess = 'border-esn-green ring-2 ring-esn-green/25 focus:border-esn-green focus:ring-esn-green/30'

type TextFieldProps = {
  id?: string
  label: string
  helpText?: string
  error?: string
  // Live positive feedback (a green border) once the current value passes
  // validation - distinct from `error`, which only ever appears after a
  // submit attempt.
  success?: boolean
  // A non-blocking "did you mean X?" hint (e.g. a likely email domain
  // typo) - unlike `error`, it never prevents submission.
  suggestion?: string
  onAcceptSuggestion?: () => void
  required?: boolean
  type?: 'text' | 'email' | 'url' | 'number' | 'date' | 'datetime-local' | 'password'
  multiline?: boolean
  rows?: number
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  step?: number
  autoComplete?: string
  disabled?: boolean
}

export function TextField({
  id,
  label,
  helpText,
  error,
  success,
  suggestion,
  onAcceptSuggestion,
  required,
  type = 'text',
  multiline = false,
  rows = 4,
  value,
  onChange,
  onBlur,
  placeholder,
  minLength,
  maxLength,
  min,
  max,
  step,
  autoComplete,
  disabled,
}: TextFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const errorId = `${fieldId}-error`
  const helpId = `${fieldId}-help`
  const describedBy = [helpText ? helpId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  const sharedClasses = `${inputBase} ${error ? inputInvalid : success ? inputSuccess : inputValid}`

  return (
    <div className="mb-6">
      <label htmlFor={fieldId} className={`mb-1.5 block text-sm font-medium text-ink ${required ? requiredMark : ''}`}>
        {label}
      </label>
      {helpText && (
        <p id={helpId} className="mb-1.5 text-sm text-muted">
          {helpText}
        </p>
      )}
      {multiline ? (
        <textarea
          id={fieldId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          rows={rows}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={sharedClasses}
        />
      ) : (
        <input
          id={fieldId}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          min={min}
          max={max}
          step={step}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={sharedClasses}
        />
      )}
      {suggestion && onAcceptSuggestion && (
        <button
          type="button"
          onClick={onAcceptSuggestion}
          className="mt-1.5 text-sm text-esn-blue hover:underline"
        >
          Did you mean <span className="font-medium">{suggestion}</span>?
        </button>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  )
}
