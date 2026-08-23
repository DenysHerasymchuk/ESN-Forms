import { TextField } from '../ui/TextField'
import { SelectField } from '../ui/SelectField'
import { OptionGroup } from '../ui/OptionGroup'
import {
  defaultHelpText,
  defaultPlaceholder,
  isFieldAnswerValid,
  otherAnswerKey,
  suggestEmailCorrection,
  type Answers,
  type Field,
} from '../../lib/formField'

type Props = {
  field: Field
  answers: Answers
  errors: Record<string, string>
  onChange: (fieldId: string, value: string | string[]) => void
}

function asString(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : ''
}

export function DynamicFormField({ field, answers, errors, onChange }: Props) {
  const value = answers[field.id]
  const error = errors[field.id]
  const success = !error && isFieldAnswerValid(field, value)
  const { config } = field
  const helpText = field.helpText ?? defaultHelpText(field.type)
  const placeholder = config.placeholder ?? defaultPlaceholder(field.type)

  switch (field.type) {
    case 'text':
    case 'url':
    case 'number':
    case 'date':
      return (
        <TextField
          label={field.label}
          helpText={helpText}
          required={field.required}
          error={error}
          success={success}
          type={field.type}
          value={asString(value)}
          onChange={(next) => onChange(field.id, next)}
          placeholder={placeholder}
          minLength={config.minLength}
          maxLength={config.maxLength}
          min={config.min}
          max={config.max}
          step={config.step}
        />
      )

    case 'email': {
      const emailValue = asString(value)
      const suggestion = suggestEmailCorrection(emailValue)
      return (
        <TextField
          label={field.label}
          helpText={helpText}
          required={field.required}
          error={error}
          success={success}
          type="email"
          value={emailValue}
          onChange={(next) => onChange(field.id, next)}
          placeholder={placeholder}
          suggestion={suggestion ?? undefined}
          onAcceptSuggestion={suggestion ? () => onChange(field.id, suggestion) : undefined}
        />
      )
    }

    case 'textarea':
      return (
        <TextField
          label={field.label}
          helpText={helpText}
          required={field.required}
          error={error}
          success={success}
          multiline
          rows={config.rows}
          value={asString(value)}
          onChange={(next) => onChange(field.id, next)}
          placeholder={placeholder}
          minLength={config.minLength}
          maxLength={config.maxLength}
        />
      )

    case 'select': {
      const options = config.options ?? []
      const selectOptions = config.allowOther
        ? [...options, { value: config.otherOptionValue ?? '__other__', label: 'Other' }]
        : options
      const selectedValue = asString(value)
      return (
        <>
          <SelectField
            label={field.label}
            helpText={helpText}
            required={field.required}
            error={error}
            success={success}
            value={selectedValue}
            onChange={(next) => onChange(field.id, next)}
            options={selectOptions}
            placeholder="Choose an option"
          />
          {config.allowOther && selectedValue === config.otherOptionValue && (
            <TextField
              label={`${field.label}: please specify`}
              required
              error={errors[otherAnswerKey(field.id)]}
              value={asString(answers[otherAnswerKey(field.id)])}
              onChange={(next) => onChange(otherAnswerKey(field.id), next)}
            />
          )}
        </>
      )
    }

    case 'radio': {
      const options = config.options ?? []
      const radioOptions = config.allowOther
        ? [...options, { value: config.otherOptionValue ?? '__other__', label: 'Other' }]
        : options
      const selectedValue = asString(value)
      return (
        <>
          <OptionGroup
            legend={field.label}
            helpText={helpText}
            required={field.required}
            error={error}
            success={success}
            type="radio"
            options={radioOptions}
            value={selectedValue}
            onChange={(next) => onChange(field.id, next)}
          />
          {config.allowOther && selectedValue === config.otherOptionValue && (
            <TextField
              label={`${field.label}: please specify`}
              required
              error={errors[otherAnswerKey(field.id)]}
              value={asString(answers[otherAnswerKey(field.id)])}
              onChange={(next) => onChange(otherAnswerKey(field.id), next)}
            />
          )}
        </>
      )
    }

    case 'checkbox': {
      const options = config.options ?? []
      const selectedValues = Array.isArray(value) ? value : []
      return (
        <OptionGroup
          legend={field.label}
          helpText={helpText}
          required={field.required}
          error={error}
          success={success}
          type="checkbox"
          options={options}
          value={selectedValues}
          onChange={(next) => onChange(field.id, next)}
        />
      )
    }

    case 'acknowledge': {
      const isChecked = value === config.value
      return (
        <label
          className={`mb-4 flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-ink/[0.02] ${
            isChecked ? 'border-esn-green ring-2 ring-esn-green/25' : 'border-slate-300'
          }`}
        >
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(event) => onChange(field.id, event.target.checked ? (config.value ?? 'true') : '')}
            className="h-5 w-5 cursor-pointer accent-esn-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esn-blue"
          />
          <span className="text-sm text-ink">{field.label}</span>
        </label>
      )
    }

    default:
      return null
  }
}
