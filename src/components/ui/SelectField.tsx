import { useId } from 'react'

const requiredMark = "after:ml-0.5 after:text-error after:content-['*']"
const inputBase =
  'w-full rounded-lg border bg-white px-4 py-3 text-base text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-esn-blue/30'
const inputValid = 'border-slate-300 focus:border-esn-blue'
const inputInvalid = 'border-error focus:border-error focus:ring-error/25'

export type SelectOption = { value: string; label: string }

type SelectFieldProps = {
  id?: string
  label: string
  // Keeps the label in the accessibility tree but visually hides it, for
  // contexts (like an inline question-type picker) where the surrounding
  // UI already makes the field's purpose clear.
  hideLabel?: boolean
  helpText?: string
  error?: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
}

export function SelectField({
  id,
  label,
  hideLabel = false,
  helpText,
  error,
  required,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: SelectFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const errorId = `${fieldId}-error`

  return (
    <div className={hideLabel ? '' : 'mb-5'}>
      <label
        htmlFor={fieldId}
        className={hideLabel ? 'sr-only' : `mb-1.5 block text-sm font-medium text-ink ${required ? requiredMark : ''}`}
      >
        {label}
      </label>
      {helpText && <p className="mb-1.5 text-sm text-muted">{helpText}</p>}
      <select
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${inputBase} ${error ? inputInvalid : inputValid}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  )
}
