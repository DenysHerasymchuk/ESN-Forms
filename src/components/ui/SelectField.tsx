import { useId } from 'react'
import { FaChevronDown } from 'react-icons/fa6'

const requiredMark = "after:ml-0.5 after:text-error after:content-['*']"
// appearance-none hands the whole border to us - without it, the browser's
// own native <select> chrome rendered its own default border alongside
// (not replaced by) these classes, showing up as a dark border underneath
// the intended one. The native dropdown arrow goes away with it, so a
// custom chevron replaces it below.
const inputBase =
  'w-full appearance-none rounded-lg border bg-white px-4 py-3 pr-10 text-base text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-esn-blue/30'
const inputValid = 'border-slate-300 focus:border-esn-blue'
const inputInvalid = 'border-error focus:border-error focus:ring-error/25'
// --color-success is dark/muted, made for text - too close to black at
// border width. esn-green is the brighter brand green, stays clearly green.
const inputSuccess = 'border-esn-green ring-2 ring-esn-green/25 focus:border-esn-green focus:ring-esn-green/30'

export type SelectOption = { value: string; label: string }

type SelectFieldProps = {
  id?: string
  label: string
  helpText?: string
  error?: string
  success?: boolean
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
  helpText,
  error,
  success,
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
    <div className="mb-6">
      <label htmlFor={fieldId} className={`mb-1.5 block text-sm font-medium text-ink ${required ? requiredMark : ''}`}>
        {label}
      </label>
      {helpText && <p className="mb-1.5 text-sm text-muted">{helpText}</p>}
      <div className="relative">
        <select
          id={fieldId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${inputBase} ${error ? inputInvalid : success ? inputSuccess : inputValid}`}
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
        <FaChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-slate-400"
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  )
}
