import { useState } from 'react'
import { FaChevronDown, FaChevronUp, FaLayerGroup, FaPen, FaPlus, FaTrash, FaXmark } from 'react-icons/fa6'
import type { Field, FieldType } from '../../lib/formField'
import { SecondaryButton } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { SelectField, type SelectOption } from '../ui/SelectField'
import { FieldConfigEditor } from './FieldConfigEditor'

const FIELD_TYPE_OPTIONS: SelectOption[] = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Radio buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'textarea', label: 'Paragraph' },
  { value: 'acknowledge', label: 'Acknowledgement' },
]

function createField(type: FieldType): Field {
  return {
    id: crypto.randomUUID(),
    type,
    label: 'New field',
    required: false,
    // acknowledge needs a fixed sentinel to compare the checkbox's checked
    // state against - it's not something the builder UI exposes for editing.
    config: type === 'acknowledge' ? { value: 'acknowledged' } : {},
  }
}

type Props = {
  fields: Field[]
  onChange: (fields: Field[]) => void
  hasSubmissions: boolean
}

export function FieldListEditor({ fields, onChange, hasSubmissions }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newFieldType, setNewFieldType] = useState<FieldType>('text')

  function replaceField(updated: Field) {
    onChange(fields.map((field) => (field.id === updated.id ? updated : field)))
  }

  function moveField(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= fields.length) return
    const next = [...fields]
    const [moved] = next.splice(index, 1)
    next.splice(targetIndex, 0, moved)
    onChange(next)
  }

  function removeField(id: string) {
    onChange(fields.filter((field) => field.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  function addField() {
    const field = createField(newFieldType)
    onChange([...fields, field])
    setExpandedId(field.id)
  }

  return (
    <div className="mb-6">
      {fields.length === 0 && (
        <div className="mb-4 flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 py-8 text-center text-sm text-muted">
          <FaLayerGroup className="text-2xl text-slate-300" aria-hidden="true" />
          <span>No fields yet — add one below.</span>
        </div>
      )}

      {fields.length > 0 && (
        <div className="divide-y divide-slate-200 rounded-lg border border-slate-300">
          {fields.map((field, index) => (
            <div key={field.id}>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">{field.label || 'Untitled field'}</span>
                  <Badge>{field.type}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SecondaryButton onClick={() => moveField(index, -1)} disabled={index === 0} aria-label="Move up">
                    <FaChevronUp aria-hidden="true" />
                  </SecondaryButton>
                  <SecondaryButton
                    onClick={() => moveField(index, 1)}
                    disabled={index === fields.length - 1}
                    aria-label="Move down"
                  >
                    <FaChevronDown aria-hidden="true" />
                  </SecondaryButton>
                  <SecondaryButton onClick={() => setExpandedId(expandedId === field.id ? null : field.id)}>
                    {expandedId === field.id ? <FaXmark aria-hidden="true" /> : <FaPen aria-hidden="true" />}
                    {expandedId === field.id ? 'Close' : 'Edit'}
                  </SecondaryButton>
                  <SecondaryButton
                    onClick={() => removeField(field.id)}
                    title={hasSubmissions ? 'This form has responses; some edits are restricted' : undefined}
                  >
                    <FaTrash aria-hidden="true" />
                    Remove
                  </SecondaryButton>
                </div>
              </div>
              {expandedId === field.id && (
                <div className="border-t border-slate-200 bg-slate-50 px-4 py-4">
                  <FieldConfigEditor field={field} onChange={replaceField} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="w-48">
          <SelectField
            label="Field type"
            value={newFieldType}
            onChange={(value) => setNewFieldType(value as FieldType)}
            options={FIELD_TYPE_OPTIONS}
          />
        </div>
        <SecondaryButton onClick={addField} className="mb-5">
          <FaPlus aria-hidden="true" />
          Add field
        </SecondaryButton>
      </div>
    </div>
  )
}
