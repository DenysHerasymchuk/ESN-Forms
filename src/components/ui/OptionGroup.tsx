import { useId } from 'react'

const optionRow =
  'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 first:rounded-t-[calc(var(--radius-md)-1px)] last:rounded-b-[calc(var(--radius-md)-1px)]'
const requiredMark = "after:ml-0.5 after:text-error after:content-['*']"

export type OptionGroupOption = { value: string; label: string }

type OptionGroupProps = {
  legend: string
  helpText?: string
  error?: string
  success?: boolean
  required?: boolean
  type: 'radio' | 'checkbox'
  options: OptionGroupOption[]
  value: string | string[]
  onChange: (value: string | string[]) => void
  disabled?: boolean
}

export function OptionGroup({
  legend,
  helpText,
  error,
  success,
  required,
  type,
  options,
  value,
  onChange,
  disabled,
}: OptionGroupProps) {
  const groupId = useId()
  const errorId = `${groupId}-error`
  const selectedValues = Array.isArray(value) ? value : [value]

  function handleToggle(optionValue: string) {
    if (type === 'radio') {
      onChange(optionValue)
      return
    }
    const current = Array.isArray(value) ? value : []
    const next = current.includes(optionValue) ? current.filter((v) => v !== optionValue) : [...current, optionValue]
    onChange(next)
  }

  return (
    <fieldset className="mb-6">
      <legend className={`mb-2 block text-sm font-medium text-ink ${required ? requiredMark : ''}`}>{legend}</legend>
      {helpText && <p className="mb-2 text-sm text-muted">{helpText}</p>}
      <div
        className={`divide-y divide-slate-200 rounded-lg border transition-colors ${
          error ? 'border-error' : success ? 'border-esn-green ring-2 ring-esn-green/25' : 'border-slate-300'
        }`}
        role={type === 'radio' ? 'radiogroup' : 'group'}
        aria-describedby={error ? errorId : undefined}
      >
        {options.map((option) => {
          const optionId = `${groupId}-${option.value}`
          const isChecked = selectedValues.includes(option.value)
          return (
            <label key={option.value} htmlFor={optionId} className={`${optionRow} ${isChecked ? 'bg-esn-blue/5' : ''}`}>
              <input
                type={type}
                id={optionId}
                name={groupId}
                checked={isChecked}
                onChange={() => handleToggle(option.value)}
                disabled={disabled}
                className="h-5 w-5 cursor-pointer accent-esn-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esn-blue"
              />
              <span className="text-sm text-ink">{option.label}</span>
            </label>
          )
        })}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-error">
          {error}
        </p>
      )}
    </fieldset>
  )
}
