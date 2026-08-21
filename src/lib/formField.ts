// Generic field schema shared between the frontend renderer and the
// submit-form Edge Function, so "what counts as a valid answer" is defined
// once and reused, not restated in two places.

export type FieldType =
  | 'text'
  | 'email'
  | 'url'
  | 'number'
  | 'date'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'acknowledge'

export type FieldOption = {
  value: string
  label: string
}

export type FieldConfig = {
  placeholder?: string
  pattern?: string
  minLength?: number
  maxLength?: number
  autoComplete?: string
  min?: number
  max?: number
  step?: number
  options?: FieldOption[]
  allowOther?: boolean
  otherOptionValue?: string
  rows?: number
  value?: string
}

export type Field = {
  id: string
  type: FieldType
  label: string
  helpText?: string | null
  required: boolean
  // A deprecated field is kept so historical submissions stay interpretable,
  // but is no longer collected from new respondents.
  deprecated?: boolean
  config: FieldConfig
}

export type Answers = Record<string, string | string[] | undefined>

export type ValidationError = {
  fieldId: string
  message: string
}

// select/radio store either a known option value or the literal
// otherOptionValue marker - the respondent's actual free text for "Other"
// lives under this separate synthetic key, not as the field's own answer.
// Exported so the renderer and the validator agree on the same key.
export function otherAnswerKey(fieldId: string): string {
  return `${fieldId}__other`
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isEmpty(value: string | string[] | undefined): boolean {
  if (value === undefined) return true
  if (Array.isArray(value)) return value.length === 0
  return value.trim().length === 0
}

function validateOptionValue(field: Field, value: string): string | null {
  const options = field.config.options ?? []
  const isKnownOption = options.some((option) => option.value === value)
  const isOtherValue = field.config.allowOther && value === field.config.otherOptionValue
  if (!isKnownOption && !isOtherValue) {
    return `${field.label} must be one of the allowed options`
  }
  return null
}

function validateFieldValue(field: Field, value: string): string | null {
  const { type, config, label } = field

  if (type === 'email' && !EMAIL_PATTERN.test(value)) {
    return `${label} must be a valid email address`
  }

  if (type === 'url') {
    try {
      new URL(value)
    } catch {
      return `${label} must be a valid URL`
    }
  }

  if (type === 'number') {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return `${label} must be a number`
    if (config.min !== undefined && numeric < config.min) return `${label} must be at least ${config.min}`
    if (config.max !== undefined && numeric > config.max) return `${label} must be at most ${config.max}`
  }

  if (type === 'date' && Number.isNaN(Date.parse(value))) {
    return `${label} must be a valid date`
  }

  if ((type === 'text' || type === 'textarea' || type === 'email' || type === 'url') && config.pattern) {
    if (!new RegExp(config.pattern).test(value)) return `${label} is not in the expected format`
  }

  if (type === 'text' || type === 'textarea') {
    if (config.minLength !== undefined && value.length < config.minLength) {
      return `${label} must be at least ${config.minLength} characters`
    }
    if (config.maxLength !== undefined && value.length > config.maxLength) {
      return `${label} must be at most ${config.maxLength} characters`
    }
  }

  if (type === 'select' || type === 'radio') {
    return validateOptionValue(field, value)
  }

  if (type === 'acknowledge' && config.value !== undefined && value !== config.value) {
    return `${label} must be acknowledged`
  }

  return null
}

export function validate(fields: Field[], answers: Answers): ValidationError[] {
  const errors: ValidationError[] = []

  for (const field of fields) {
    if (field.deprecated) continue

    const value = answers[field.id]

    if (field.required && isEmpty(value)) {
      errors.push({ fieldId: field.id, message: `${field.label} is required` })
      continue
    }

    if (isEmpty(value)) continue
    if (value === undefined) continue // narrows the type below; isEmpty already ruled this out at runtime

    if (field.type === 'checkbox') {
      const values = Array.isArray(value) ? value : [value]
      for (const single of values) {
        const error = validateOptionValue(field, single)
        if (error) {
          errors.push({ fieldId: field.id, message: error })
          break
        }
      }
      continue
    }

    if (Array.isArray(value)) {
      errors.push({ fieldId: field.id, message: `${field.label} does not accept multiple values` })
      continue
    }

    const error = validateFieldValue(field, value)
    if (error) {
      errors.push({ fieldId: field.id, message: error })
      continue
    }

    if (
      (field.type === 'select' || field.type === 'radio') &&
      field.config.allowOther &&
      value === field.config.otherOptionValue &&
      isEmpty(answers[otherAnswerKey(field.id)])
    ) {
      errors.push({ fieldId: otherAnswerKey(field.id), message: `Please specify "${field.label}"` })
    }
  }

  return errors
}
