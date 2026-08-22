import { useState } from 'react'
import { FaChevronDown, FaRegCircle, FaSquare, FaXmark } from 'react-icons/fa6'
import type { Field, FieldOption, FieldType } from '../../lib/formField'
import { TextField } from '../ui/TextField'
import { CustomSelect, type SelectOption } from '../ui/CustomSelect'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const FIELD_TYPE_OPTIONS: SelectOption[] = [
  { value: 'text', label: 'Short answer' },
  { value: 'textarea', label: 'Paragraph' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Multiple choice' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'acknowledge', label: 'Acknowledgement' },
]

const OPTION_TYPES: FieldType[] = ['select', 'radio', 'checkbox']
const inlineInputClasses =
  'w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-lg text-ink placeholder:text-slate-400 transition-colors focus:border-esn-blue focus:outline-none focus:ring-0'

type Props = {
  field: Field
  onChange: (field: Field) => void
}

// Mirrors the always-visible, directly-editable question layout of the
// reference design: label + type picker up top, options (if any) inline,
// and everything else (help text, length/min-max limits) tucked behind a
// "More settings" disclosure rather than shown unconditionally.
export function FieldConfigEditor({ field, onChange }: Props) {
  const [showMore, setShowMore] = useState(false)
  const { config, type } = field
  const options = config.options ?? []

  function updateConfig(updates: Partial<Field['config']>) {
    onChange({ ...field, config: { ...config, ...updates } })
  }

  function handleTypeChange(nextType: string) {
    // Config shapes differ per type - start clean rather than carrying
    // over settings (e.g. options) that wouldn't make sense anymore.
    onChange({ ...field, type: nextType as FieldType, config: {} })
  }

  function updateOptions(nextOptions: FieldOption[]) {
    updateConfig({ options: nextOptions })
  }

  function addOption() {
    updateOptions([...options, { value: '', label: '' }])
  }

  // The value auto-follows the label as it's typed, until the respondent
  // directly edits the value field themselves - then it stops following.
  function updateOptionLabel(index: number, label: string) {
    const current = options[index]
    const wasAutoValue = current.value === '' || current.value === slugify(current.label)
    const next = [...options]
    next[index] = { ...current, label, value: wasAutoValue ? slugify(label) : current.value }
    updateOptions(next)
  }

  function removeOption(index: number) {
    updateOptions(options.filter((_, i) => i !== index))
  }

  const OptionIcon = type === 'checkbox' ? FaSquare : FaRegCircle

  return (
    <div>
      <div className="flex flex-wrap items-start gap-4">
        <input
          value={field.label}
          onChange={(event) => onChange({ ...field, label: event.target.value })}
          placeholder="Question"
          className={`${inlineInputClasses} min-w-0 flex-1`}
        />
        <div className="w-48 shrink-0">
          <CustomSelect ariaLabel="Question type" value={type} onChange={handleTypeChange} options={FIELD_TYPE_OPTIONS} />
        </div>
      </div>

      {OPTION_TYPES.includes(type) && (
        <div className="mt-4 space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-3">
              <OptionIcon className="shrink-0 text-slate-400" aria-hidden="true" />
              <input
                value={option.label}
                onChange={(event) => updateOptionLabel(index, event.target.value)}
                placeholder={`Option ${index + 1}`}
                className={`${inlineInputClasses} min-w-0 flex-1 text-base`}
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                aria-label="Remove option"
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-error/10 hover:text-error"
              >
                <FaXmark aria-hidden="true" />
              </button>
            </div>
          ))}

          {(type === 'select' || type === 'radio') && config.allowOther && (
            <div className="flex items-center gap-3">
              <OptionIcon className="shrink-0 text-slate-400" aria-hidden="true" />
              <span className="flex-1 border-b border-dashed border-slate-300 py-2 text-base text-muted italic">
                Other…
              </span>
              <button
                type="button"
                onClick={() => updateConfig({ allowOther: false, otherOptionValue: undefined })}
                aria-label='Remove "Other"'
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-ink"
              >
                <FaXmark aria-hidden="true" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1 pl-7 text-sm">
            <button type="button" onClick={addOption} className="font-medium text-esn-blue hover:underline">
              Add option
            </button>
            {(type === 'select' || type === 'radio') && !config.allowOther && (
              <>
                <span className="text-muted">or</span>
                <button
                  type="button"
                  onClick={() =>
                    updateConfig({ allowOther: true, otherOptionValue: config.otherOptionValue ?? '__other__' })
                  }
                  className="font-medium text-esn-blue hover:underline"
                >
                  Add &quot;Other&quot;
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {type === 'acknowledge' && (
        <p className="mt-3 text-sm text-muted">Respondents check a single box to acknowledge this.</p>
      )}

      <div className="mt-4 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => setShowMore((value) => !value)}
          aria-expanded={showMore}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <FaChevronDown
            aria-hidden="true"
            className={`transition-transform duration-200 ${showMore ? 'rotate-180' : ''}`}
          />
          More settings
        </button>

        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${showMore ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
          <div className="overflow-hidden">
            <div className="mt-3">
            <TextField
              label="Help text"
              value={field.helpText ?? ''}
              onChange={(value) => onChange({ ...field, helpText: value || null })}
            />

            {(type === 'text' || type === 'textarea') && (
              <>
                <TextField
                  label="Placeholder"
                  value={config.placeholder ?? ''}
                  onChange={(value) => updateConfig({ placeholder: value || undefined })}
                />
                <TextField
                  label="Minimum length"
                  type="number"
                  value={config.minLength?.toString() ?? ''}
                  onChange={(value) => updateConfig({ minLength: value ? Number(value) : undefined })}
                />
                <TextField
                  label="Maximum length"
                  type="number"
                  value={config.maxLength?.toString() ?? ''}
                  onChange={(value) => updateConfig({ maxLength: value ? Number(value) : undefined })}
                />
                {type === 'textarea' && (
                  <TextField
                    label="Rows"
                    type="number"
                    value={config.rows?.toString() ?? ''}
                    onChange={(value) => updateConfig({ rows: value ? Number(value) : undefined })}
                  />
                )}
              </>
            )}

            {(type === 'email' || type === 'url' || type === 'date') && (
              <TextField
                label="Placeholder"
                value={config.placeholder ?? ''}
                onChange={(value) => updateConfig({ placeholder: value || undefined })}
              />
            )}

            {type === 'number' && (
              <>
                <TextField
                  label="Placeholder"
                  value={config.placeholder ?? ''}
                  onChange={(value) => updateConfig({ placeholder: value || undefined })}
                />
                <TextField
                  label="Minimum"
                  type="number"
                  value={config.min?.toString() ?? ''}
                  onChange={(value) => updateConfig({ min: value ? Number(value) : undefined })}
                />
                <TextField
                  label="Maximum"
                  type="number"
                  value={config.max?.toString() ?? ''}
                  onChange={(value) => updateConfig({ max: value ? Number(value) : undefined })}
                />
                <TextField
                  label="Step"
                  type="number"
                  value={config.step?.toString() ?? ''}
                  onChange={(value) => updateConfig({ step: value ? Number(value) : undefined })}
                />
              </>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
