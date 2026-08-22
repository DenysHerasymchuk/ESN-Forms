import { useState } from 'react'
import { FaChevronDown, FaChevronUp, FaCopy, FaPlus, FaTrash } from 'react-icons/fa6'
import type { Field, FieldType } from '../../lib/formField'
import { Switch } from '../ui/Switch'
import { FieldConfigEditor } from './FieldConfigEditor'

// Matches the exit transition duration below - the actual removal from
// state is delayed by this long so the fade/shrink is visible before the
// card leaves the DOM.
const REMOVE_ANIMATION_MS = 180

// Cycled by index so a multi-question form reads as visibly ESN-branded
// rather than one repeated blue bar down every card.
const ACCENT_COLORS = ['border-l-esn-blue', 'border-l-esn-orange', 'border-l-esn-pink', 'border-l-esn-green']

function createField(type: FieldType = 'text'): Field {
  return {
    id: crypto.randomUUID(),
    type,
    label: '',
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
  const [removingId, setRemovingId] = useState<string | null>(null)

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
    setRemovingId(id)
    setTimeout(() => {
      onChange(fields.filter((field) => field.id !== id))
      setRemovingId((current) => (current === id ? null : current))
    }, REMOVE_ANIMATION_MS)
  }

  function duplicateField(index: number) {
    const original = fields[index]
    const copy: Field = { ...original, id: crypto.randomUUID() }
    const next = [...fields]
    next.splice(index + 1, 0, copy)
    onChange(next)
  }

  function addField() {
    onChange([...fields, createField()])
  }

  return (
    <div className="mb-6 space-y-4">
      {fields.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-muted">
          <span>No questions yet — add one below.</span>
        </div>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className={`overflow-hidden rounded-xl border border-slate-200 border-l-4 bg-white shadow-sm transition-all duration-200 hover:shadow-md ${
            ACCENT_COLORS[index % ACCENT_COLORS.length]
          } ${removingId === field.id ? 'scale-95 opacity-0' : 'animate-fade-in opacity-100'}`}
        >
          <div className="p-5 sm:p-6">
            <div className="mb-2 flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => moveField(index, -1)}
                disabled={index === 0}
                aria-label="Move question up"
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              >
                <FaChevronUp aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => moveField(index, 1)}
                disabled={index === fields.length - 1}
                aria-label="Move question down"
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              >
                <FaChevronDown aria-hidden="true" />
              </button>
            </div>

            <FieldConfigEditor field={field} onChange={replaceField} />

            <div className="mt-4 flex flex-wrap items-center justify-end gap-4 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => duplicateField(index)}
                aria-label="Duplicate question"
                title="Duplicate question"
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-esn-orange/10 hover:text-esn-orange"
              >
                <FaCopy aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => removeField(field.id)}
                aria-label="Delete question"
                title={hasSubmissions ? 'This form has responses; some edits are restricted' : 'Delete question'}
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-error/10 hover:text-error"
              >
                <FaTrash aria-hidden="true" />
              </button>
              <div className="h-5 w-px bg-slate-200" aria-hidden="true" />
              <Switch
                checked={field.required}
                onChange={(checked) => replaceField({ ...field, required: checked })}
                label="Required"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addField}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-4 text-sm font-medium text-esn-blue transition duration-150 hover:border-esn-blue/40 hover:bg-esn-blue/5 active:scale-[0.99]"
      >
        <FaPlus aria-hidden="true" />
        Add question
      </button>
    </div>
  )
}
