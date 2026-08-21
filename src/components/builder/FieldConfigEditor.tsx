import type { Field, FieldOption, FieldType } from '../../lib/formField'
import { TextField } from '../ui/TextField'
import { SecondaryButton } from '../ui/Button'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const OPTION_TYPES: FieldType[] = ['select', 'radio', 'checkbox']
const optionInputClasses =
  'w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-ink transition-colors focus:border-esn-blue focus:outline-none focus:ring-2 focus:ring-esn-blue/30'

type Props = {
  field: Field
  onChange: (field: Field) => void
}

export function FieldConfigEditor({ field, onChange }: Props) {
  const { config, type } = field
  const options = config.options ?? []

  function updateConfig(updates: Partial<Field['config']>) {
    onChange({ ...field, config: { ...config, ...updates } })
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

  function updateOptionValue(index: number, value: string) {
    const next = [...options]
    next[index] = { ...next[index], value }
    updateOptions(next)
  }

  function moveOption(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= options.length) return
    const next = [...options]
    const [moved] = next.splice(index, 1)
    next.splice(targetIndex, 0, moved)
    updateOptions(next)
  }

  function removeOption(index: number) {
    updateOptions(options.filter((_, i) => i !== index))
  }

  return (
    <div>
      <TextField label="Label" required value={field.label} onChange={(value) => onChange({ ...field, label: value })} />
      <TextField
        label="Help text"
        value={field.helpText ?? ''}
        onChange={(value) => onChange({ ...field, helpText: value || null })}
      />
      <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={field.required}
          onChange={(event) => onChange({ ...field, required: event.target.checked })}
          className="h-4 w-4 cursor-pointer accent-esn-blue"
        />
        Required
      </label>

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

      {OPTION_TYPES.includes(type) && (
        <div className="mb-4">
          <p className="mb-1.5 text-sm font-medium text-ink">Options</p>
          {options.length === 0 && <p className="mb-2 text-sm text-muted">No options yet — add one below.</p>}
          {options.length > 0 && (
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-300">
              {options.map((option, index) => (
                <div key={index} className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <input
                    value={option.label}
                    onChange={(event) => updateOptionLabel(index, event.target.value)}
                    placeholder="Label"
                    className={`${optionInputClasses} min-w-40 flex-1`}
                  />
                  <input
                    value={option.value}
                    onChange={(event) => updateOptionValue(index, event.target.value)}
                    placeholder="Value"
                    className={`${optionInputClasses} min-w-32 flex-1`}
                  />
                  <SecondaryButton onClick={() => moveOption(index, -1)} disabled={index === 0}>
                    Up
                  </SecondaryButton>
                  <SecondaryButton onClick={() => moveOption(index, 1)} disabled={index === options.length - 1}>
                    Down
                  </SecondaryButton>
                  <SecondaryButton onClick={() => removeOption(index)}>Remove</SecondaryButton>
                </div>
              ))}
            </div>
          )}
          <SecondaryButton onClick={addOption} className="mt-2">
            Add option
          </SecondaryButton>

          {(type === 'select' || type === 'radio') && (
            <div className="mt-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={config.allowOther ?? false}
                  onChange={(event) =>
                    updateConfig({
                      allowOther: event.target.checked,
                      otherOptionValue: event.target.checked ? (config.otherOptionValue ?? '__other__') : undefined,
                    })
                  }
                  className="h-4 w-4 cursor-pointer accent-esn-blue"
                />
                Allow "Other" (respondent can type a custom answer)
              </label>
            </div>
          )}
        </div>
      )}

      {type === 'acknowledge' && (
        <p className="mb-4 text-sm text-muted">
          Respondents check a single box to acknowledge this. No further configuration needed.
        </p>
      )}
    </div>
  )
}
