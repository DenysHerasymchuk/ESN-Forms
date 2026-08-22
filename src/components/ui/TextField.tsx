import { useId } from 'react'

const requiredMark = "after:ml-0.5 after:text-error after:content-['*']"
const inputBase =
  'w-full rounded-lg border bg-white px-4 py-3 text-base text-ink placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-esn-blue/30'
const inputValid = 'border-slate-300 focus:border-esn-blue'
const inputInvalid = 'border-error focus:border-error focus:ring-error/25'

type TextFieldProps = {
  id?: string
  label: string
  helpText?: string
  error?: string
  required?: boolean
  type?: 'text' | 'email' | 'url' | 'number' | 'date' | 'password'
  multiline?: boolean
  rows?: number
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  pattern?: string
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
  required,
  type = 'text',
  multiline = false,
  rows = 4,
  value,
  onChange,
  onBlur,
  placeholder,
  pattern,
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

  const sharedClasses = `${inputBase} ${error ? inputInvalid : inputValid}`

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
          pattern={pattern}
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
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  )
}
