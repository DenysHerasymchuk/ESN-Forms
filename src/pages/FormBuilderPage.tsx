import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FaArrowLeft, FaBoxArchive, FaFileLines, FaFloppyDisk, FaGlobe, FaLink, FaRotateLeft } from 'react-icons/fa6'
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
import type { FormRow } from '../lib/database.types'

type Tab = 'questions' | 'settings'

const titleInputClasses =
  'w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 font-display text-3xl font-bold text-ink placeholder:text-slate-300 focus:border-esn-blue focus:outline-none focus:ring-0'
const descriptionInputClasses =
  'mt-3 w-full resize-none border-0 border-b border-slate-200 bg-transparent px-0 py-2 text-base text-ink placeholder:text-slate-400 focus:border-esn-blue focus:outline-none focus:ring-0'

export function FormBuilderPage() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<Tab>('questions')

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

  const tabClasses = (tab: Tab) =>
    `border-b-2 px-1 py-4 text-sm font-semibold transition-colors ${
      activeTab === tab ? 'border-esn-blue text-esn-blue' : 'border-transparent text-muted hover:text-ink'
    }`

  return (
    <div>
      <div className="mb-6 flex items-center gap-8 border-b border-slate-200">
        <button type="button" onClick={() => setActiveTab('questions')} className={tabClasses('questions')}>
          Questions
        </button>
        <button
          type="button"
          onClick={() => navigate(`/dashboard/forms/${formId}/submissions`)}
          className="flex items-center gap-1.5 border-b-2 border-transparent px-1 py-4 text-sm font-semibold text-muted transition-colors hover:text-ink"
        >
          <FaFileLines aria-hidden="true" />
          Responses{submissionCount > 0 ? ` (${submissionCount})` : ''}
        </button>
        <button type="button" onClick={() => setActiveTab('settings')} className={tabClasses('settings')}>
          Settings
        </button>
      </div>

      {activeTab === 'questions' && (
        <div key="questions" className="animate-fade-in space-y-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 border-t-4 border-t-esn-blue bg-white shadow-sm">
            <div className="p-5 sm:p-6">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Form name"
                className={titleInputClasses}
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Form description (supports Markdown)"
                rows={2}
                className={descriptionInputClasses}
              />
              <div className="mt-4 flex justify-end">
                <SecondaryButton onClick={() => void handleSaveMeta()} disabled={isSavingMeta}>
                  <FaFloppyDisk aria-hidden="true" />
                  {isSavingMeta ? 'Saving…' : 'Save details'}
                </SecondaryButton>
              </div>
              {metaError && (
                <div className="mt-2">
                  <StatusMessage tone="error" message={metaError} />
                </div>
              )}
            </div>
          </div>

          <FieldListEditor fields={fields} onChange={setFields} hasSubmissions={submissionCount > 0} />

          <div className="flex items-center justify-end gap-4">
            {fieldsError && <StatusMessage tone="error" message={fieldsError} />}
            <PrimaryButton onClick={() => void handleSaveFields()} isSubmitting={isSavingFields} className="w-auto px-6">
              <FaFloppyDisk aria-hidden="true" />
              Save questions
            </PrimaryButton>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div key="settings" className="animate-fade-in rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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

          <div className="mt-6 border-t border-slate-100 pt-6">
            <SecondaryButton onClick={() => navigate('/dashboard')}>
              <FaArrowLeft aria-hidden="true" />
              Back to my forms
            </SecondaryButton>
          </div>
        </div>
      )}
    </div>
  )
}
