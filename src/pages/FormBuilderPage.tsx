import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FaArrowLeft, FaBoxArchive, FaFloppyDisk, FaGlobe, FaLink, FaRotateLeft } from 'react-icons/fa6'
import { PageHeader } from '../components/ui/PageHeader'
import { Badge, type BadgeTone } from '../components/ui/Badge'
import { TextField } from '../components/ui/TextField'
import { PrimaryButton, SecondaryButton } from '../components/ui/Button'
import { StatusMessage } from '../components/ui/StatusMessage'
import { FieldListEditor } from '../components/builder/FieldListEditor'
import {
  archiveForm,
  getOwnerForm,
  listSubmissions,
  publishForm,
  restoreForm,
  updateFormFields,
  updateFormMeta,
} from '../lib/formsApi'
import { getErrorMessage } from '../lib/errors'
import type { Field } from '../lib/formField'
import type { FormRow, FormStatus } from '../lib/database.types'

const statusTone: Record<FormStatus, BadgeTone> = {
  draft: 'neutral',
  published: 'success',
  archived: 'muted',
}

export function FormBuilderPage() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormRow | null>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [submissionCount, setSubmissionCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [metaError, setMetaError] = useState('')
  const [isSavingMeta, setIsSavingMeta] = useState(false)

  const [fieldsError, setFieldsError] = useState('')
  const [isSavingFields, setIsSavingFields] = useState(false)

  const [lifecycleError, setLifecycleError] = useState('')
  const [isChangingStatus, setIsChangingStatus] = useState(false)

  useEffect(() => {
    if (!formId) return
    void loadForm(formId)
  }, [formId])

  async function loadForm(id: string) {
    setIsLoading(true)
    setLoadError('')
    try {
      const [loadedForm, submissions] = await Promise.all([getOwnerForm(id), listSubmissions(id)])
      setForm(loadedForm)
      setFields(loadedForm.fields)
      setName(loadedForm.name)
      setDescription(loadedForm.description ?? '')
      setSubmissionCount(submissions.length)
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Failed to load this form.'))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveMeta() {
    if (!formId) return
    if (!name.trim()) {
      setMetaError('Give the form a name.')
      return
    }
    setIsSavingMeta(true)
    setMetaError('')
    try {
      const updated = await updateFormMeta(formId, { name: name.trim(), description: description.trim() || null })
      setForm(updated)
    } catch (error) {
      setMetaError(getErrorMessage(error, 'Failed to save.'))
    } finally {
      setIsSavingMeta(false)
    }
  }

  async function handleSaveFields() {
    if (!formId) return
    setIsSavingFields(true)
    setFieldsError('')
    try {
      const updated = await updateFormFields(formId, fields)
      setForm(updated)
      setFields(updated.fields)
    } catch (error) {
      setFieldsError(getErrorMessage(error, 'Failed to save fields.'))
    } finally {
      setIsSavingFields(false)
    }
  }

  async function handleStatusChange(action: () => Promise<FormRow>) {
    setIsChangingStatus(true)
    setLifecycleError('')
    try {
      const updated = await action()
      setForm(updated)
    } catch (error) {
      setLifecycleError(getErrorMessage(error, 'Failed to update the form status.'))
    } finally {
      setIsChangingStatus(false)
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Loading…</p>
  }

  if (loadError || !form || !formId) {
    return <StatusMessage tone="error" message={loadError || 'Form not found.'} />
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6 sm:p-10">
        <PageHeader title={form.name} badge={<Badge tone={statusTone[form.status]}>{form.status}</Badge>} />

        <div className="border-t border-slate-200 pt-6">
          <p className="mb-3 text-xs font-semibold tracking-wide text-esn-blue uppercase">Details</p>
          <TextField label="Name" required value={name} onChange={setName} />
          <TextField
            label="Description"
            multiline
            helpText="Supports Markdown - **bold**, *italic*, [links](https://example.com), and lists."
            value={description}
            onChange={setDescription}
          />
          <SecondaryButton onClick={() => void handleSaveMeta()} disabled={isSavingMeta}>
            <FaFloppyDisk aria-hidden="true" />
            {isSavingMeta ? 'Saving…' : 'Save details'}
          </SecondaryButton>
          {metaError && (
            <div className="mt-2">
              <StatusMessage tone="error" message={metaError} />
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <p className="mb-3 text-xs font-semibold tracking-wide text-esn-blue uppercase">Fields</p>
          <FieldListEditor fields={fields} onChange={setFields} hasSubmissions={submissionCount > 0} />
          <PrimaryButton onClick={() => void handleSaveFields()} isSubmitting={isSavingFields} className="w-auto px-4">
            <FaFloppyDisk aria-hidden="true" />
            Save fields
          </PrimaryButton>
          {fieldsError && (
            <div className="mt-3">
              <StatusMessage tone="error" message={fieldsError} />
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <p className="mb-3 text-xs font-semibold tracking-wide text-esn-blue uppercase">Status</p>
          <div className="flex flex-wrap gap-2">
            {form.status === 'draft' && (
              <SecondaryButton
                onClick={() => void handleStatusChange(() => publishForm(formId))}
                disabled={isChangingStatus}
              >
                <FaGlobe aria-hidden="true" />
                Publish
              </SecondaryButton>
            )}
            {(form.status === 'draft' || form.status === 'published') && (
              <SecondaryButton
                onClick={() => void handleStatusChange(() => archiveForm(formId))}
                disabled={isChangingStatus}
              >
                <FaBoxArchive aria-hidden="true" />
                Archive
              </SecondaryButton>
            )}
            {form.status === 'archived' && (
              <>
                <SecondaryButton
                  onClick={() => void handleStatusChange(() => restoreForm(formId, 'draft'))}
                  disabled={isChangingStatus}
                >
                  <FaRotateLeft aria-hidden="true" />
                  Restore to draft
                </SecondaryButton>
                <SecondaryButton
                  onClick={() => void handleStatusChange(() => restoreForm(formId, 'published'))}
                  disabled={isChangingStatus}
                >
                  <FaGlobe aria-hidden="true" />
                  Restore to published
                </SecondaryButton>
              </>
            )}
          </div>
          {form.status === 'published' && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
              <FaLink aria-hidden="true" />
              Public link:{' '}
              <a href={`/forms/${form.slug}`} className="text-esn-blue hover:underline" target="_blank" rel="noreferrer">
                /forms/{form.slug}
              </a>
            </p>
          )}
          {lifecycleError && (
            <div className="mt-3">
              <StatusMessage tone="error" message={lifecycleError} />
            </div>
          )}
        </div>

        <div className="mt-6">
          <SecondaryButton onClick={() => navigate('/dashboard')}>
            <FaArrowLeft aria-hidden="true" />
            Back to my forms
          </SecondaryButton>
        </div>
      </div>
    </div>
  )
}
