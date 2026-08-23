import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  FaBoxArchive,
  FaFileExcel,
  FaFileLines,
  FaFilePdf,
  FaFloppyDisk,
  FaGlobe,
  FaLink,
  FaRotateLeft,
  FaSignature,
  FaTrash,
} from 'react-icons/fa6'
import { PrimaryButton, SecondaryButton } from '../components/ui/Button'
import { StatusMessage } from '../components/ui/StatusMessage'
import { DataTable, type DataTableColumn } from '../components/ui/DataTable'
import { InlineHeadingField } from '../components/ui/InlineHeadingField'
import { Modal } from '../components/ui/Modal'
import { FieldListEditor } from '../components/builder/FieldListEditor'
import {
  archiveForm,
  createForm,
  deleteForm,
  getOwnerForm,
  listSubmissions,
  publishForm,
  restoreForm,
  updateFormFields,
  updateFormMeta,
} from '../lib/formsApi'
import { adminDeleteForm } from '../lib/adminApi'
import { exportSubmissionsToExcel, previewAttendanceSignPdf, previewSubmissionsPdf } from '../lib/exportSubmissions'
import { useAuth } from '../auth/useAuth'
import { getErrorMessage } from '../lib/errors'
import { formatAnswer, type Field } from '../lib/formField'
import type { FormRow, SubmissionRow } from '../lib/database.types'

type Tab = 'questions' | 'submissions' | 'settings'

export function FormBuilderPage() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [activeTab, setActiveTab] = useState<Tab>(searchParams.get('tab') === 'submissions' ? 'submissions' : 'questions')

  const [form, setForm] = useState<FormRow | null>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [lifecycleError, setLifecycleError] = useState('')
  const [isChangingStatus, setIsChangingStatus] = useState(false)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const [exportKind, setExportKind] = useState<'excel' | 'pdf' | 'attendance' | null>(null)
  const [exportError, setExportError] = useState('')

  useEffect(() => {
    if (!formId) {
      // No id in the URL means a not-yet-created form - nothing to load,
      // start editing straight away with an empty draft.
      setIsLoading(false)
      return
    }
    void loadForm(formId)
  }, [formId])

  async function loadForm(id: string) {
    setIsLoading(true)
    setLoadError('')
    try {
      const [loadedForm, loadedSubmissions] = await Promise.all([getOwnerForm(id), listSubmissions(id)])
      setForm(loadedForm)
      setFields(loadedForm.fields)
      setName(loadedForm.name)
      setDescription(loadedForm.description ?? '')
      setSubmissions(loadedSubmissions)
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Failed to load this form.'))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      setSaveError('Give the form a name.')
      return
    }
    setIsSaving(true)
    setSaveError('')
    try {
      if (!formId) {
        // Nothing was created in the database until this first Save - an
        // abandoned "New form" click never leaves a row behind.
        const created = await createForm(name.trim(), description.trim() || null, fields)
        navigate(`/dashboard/forms/${created.id}/edit`, { replace: true })
        return
      }
      await updateFormMeta(formId, { name: name.trim(), description: description.trim() || null })
      const updated = await updateFormFields(formId, fields)
      setForm(updated)
      setFields(updated.fields)
    } catch (error) {
      setSaveError(getErrorMessage(error, 'Failed to save.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!formId) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      // Admins can force-delete a form even with responses (adminDeleteForm
      // clears them first, server-side); a regular owner's delete stays
      // blocked by the database whenever the form has any.
      if (isAdmin) {
        await adminDeleteForm(formId)
      } else {
        await deleteForm(formId)
      }
      navigate('/dashboard')
    } catch (error) {
      setDeleteError(getErrorMessage(error, 'Failed to delete the form.'))
      setIsDeleting(false)
    }
  }

  async function handleExportExcel() {
    if (!form) return
    setExportError('')
    setExportKind('excel')
    try {
      await exportSubmissionsToExcel(form, submissions)
    } catch (error) {
      setExportError(getErrorMessage(error, 'Failed to export submissions.'))
    } finally {
      setExportKind(null)
    }
  }

  // PDF isn't downloaded directly - it opens in a new tab so it can be
  // reviewed first, and the browser's own PDF viewer handles saving it from
  // there. The tab is opened synchronously, in the same tick as the click,
  // so browsers don't treat the later redirect (once the PDF build below
  // finishes) as an unrequested popup.
  async function handleOpenPdf(kind: 'pdf' | 'attendance') {
    if (!form) return
    setExportError('')
    const previewWindow = window.open('', '_blank')
    setExportKind(kind)
    try {
      const url =
        kind === 'attendance'
          ? await previewAttendanceSignPdf(form, submissions)
          : await previewSubmissionsPdf(form, submissions)
      if (previewWindow) {
        previewWindow.location.href = url
      } else {
        setExportError('This was blocked by your browser. Please allow pop-ups for this site and try again.')
      }
    } catch (error) {
      previewWindow?.close()
      setExportError(getErrorMessage(error, 'Failed to generate the PDF.'))
    } finally {
      setExportKind(null)
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

  if (formId && (loadError || !form)) {
    return <StatusMessage tone="error" message={loadError || 'Form not found.'} />
  }

  const tabClasses = (tab: Tab) =>
    `border-b-2 px-1 py-4 text-sm font-semibold transition-colors ${
      activeTab === tab ? 'border-esn-blue text-esn-blue' : 'border-transparent text-muted hover:text-ink'
    }`

  return (
    <div className="animate-rise">
      <div className="mb-6 flex items-center gap-8 border-b border-slate-200">
        <button type="button" onClick={() => setActiveTab('questions')} className={tabClasses('questions')}>
          Questions
        </button>
        {form && (
          <>
            <button type="button" onClick={() => setActiveTab('submissions')} className={tabClasses('submissions')}>
              Submissions{submissions.length > 0 ? ` (${submissions.length})` : ''}
            </button>
            <button type="button" onClick={() => setActiveTab('settings')} className={tabClasses('settings')}>
              Settings
            </button>
          </>
        )}
      </div>

      {activeTab === 'questions' && (
        <div key="questions" className="animate-fade-in space-y-4">
          <div className="surface-card overflow-hidden border-t-4 border-t-esn-blue">
            <div className="p-5 sm:p-6">
              <InlineHeadingField value={name} onChange={setName} placeholder="Form name" />
              <InlineHeadingField
                value={description}
                onChange={setDescription}
                placeholder="Form description (supports Markdown)"
                multiline
              />
            </div>
          </div>

          <FieldListEditor fields={fields} onChange={setFields} hasSubmissions={submissions.length > 0} />

          <div className="flex items-center justify-end gap-4">
            {saveError && <StatusMessage tone="error" message={saveError} />}
            <PrimaryButton onClick={() => void handleSave()} isSubmitting={isSaving} className="w-auto px-6">
              <FaFloppyDisk aria-hidden="true" />
              Save
            </PrimaryButton>
          </div>
        </div>
      )}

      {activeTab === 'submissions' && form && (
        <div key="submissions" className="animate-fade-in space-y-4">
          <p className="text-sm text-muted">
            {submissions.length} response{submissions.length === 1 ? '' : 's'}
          </p>
          <DataTable
            columns={form.fields
              .filter((field) => !field.deprecated)
              .map<DataTableColumn<SubmissionRow>>((field) => ({
                header: field.label || 'Untitled question',
                cell: (submission) => formatAnswer(field, submission.answers),
              }))
              .concat({
                header: 'Submitted',
                cell: (submission) => new Date(submission.submitted_at).toLocaleString(),
              })}
            rows={submissions}
            getRowKey={(submission) => submission.id}
            emptyMessage={
              <>
                <FaFileLines className="text-2xl text-slate-300" aria-hidden="true" />
                <span>No responses yet.</span>
              </>
            }
          />
        </div>
      )}

      {activeTab === 'settings' && form && (
        <div key="settings" className="surface-card animate-fade-in p-5 sm:p-6">
          <p className="mb-3 text-xs font-semibold tracking-wide text-esn-blue uppercase">Status</p>
          <div className="flex flex-wrap gap-2">
            {form.status === 'draft' && (
              <SecondaryButton
                onClick={() => void handleStatusChange(() => publishForm(form.id))}
                disabled={isChangingStatus}
              >
                <FaGlobe aria-hidden="true" />
                Publish
              </SecondaryButton>
            )}
            {(form.status === 'draft' || form.status === 'published') && (
              <SecondaryButton
                onClick={() => void handleStatusChange(() => archiveForm(form.id))}
                disabled={isChangingStatus}
              >
                <FaBoxArchive aria-hidden="true" />
                Archive
              </SecondaryButton>
            )}
            {form.status === 'archived' && (
              <>
                <SecondaryButton
                  onClick={() => void handleStatusChange(() => restoreForm(form.id, 'draft'))}
                  disabled={isChangingStatus}
                >
                  <FaRotateLeft aria-hidden="true" />
                  Restore to draft
                </SecondaryButton>
                <SecondaryButton
                  onClick={() => void handleStatusChange(() => restoreForm(form.id, 'published'))}
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
            <p className="mb-3 text-xs font-semibold tracking-wide text-esn-blue uppercase">Export</p>
            <div className="flex flex-wrap gap-2">
              <SecondaryButton
                onClick={() => void handleExportExcel()}
                disabled={submissions.length === 0 || exportKind !== null}
              >
                <FaFileExcel aria-hidden="true" />
                {exportKind === 'excel' ? 'Exporting…' : 'Export Excel'}
              </SecondaryButton>
              <SecondaryButton
                onClick={() => void handleOpenPdf('pdf')}
                disabled={submissions.length === 0 || exportKind !== null}
              >
                <FaFilePdf aria-hidden="true" />
                {exportKind === 'pdf' ? 'Loading…' : 'Export PDF'}
              </SecondaryButton>
              <SecondaryButton
                onClick={() => void handleOpenPdf('attendance')}
                disabled={submissions.length === 0 || exportKind !== null}
              >
                <FaSignature aria-hidden="true" />
                {exportKind === 'attendance' ? 'Loading…' : 'PDF ASign'}
              </SecondaryButton>
            </div>
            {submissions.length === 0 && <p className="mt-3 text-sm text-muted">No responses yet — nothing to export.</p>}
            {exportError && (
              <div className="mt-3">
                <StatusMessage tone="error" message={exportError} />
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <p className="mb-3 text-xs font-semibold tracking-wide text-error uppercase">Danger zone</p>
            {submissions.length > 0 && !isAdmin ? (
              <p className="text-sm text-muted">
                This form has {submissions.length} response{submissions.length === 1 ? '' : 's'} and can't be
                deleted. Archive it instead.
              </p>
            ) : (
              <SecondaryButton tone="error" onClick={() => setIsDeleteModalOpen(true)}>
                <FaTrash aria-hidden="true" />
                Delete form
              </SecondaryButton>
            )}
            {deleteError && (
              <div className="mt-3">
                <StatusMessage tone="error" message={deleteError} />
              </div>
            )}
          </div>
        </div>
      )}

      {form && (
        <Modal title="Delete this form?" isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
          <p className="mb-6 text-sm text-muted">
            This permanently deletes "{form.name}"
            {submissions.length > 0
              ? ` and all ${submissions.length} of its response${submissions.length === 1 ? '' : 's'}`
              : ''}
            . This can't be undone.
          </p>
          <div className="flex justify-end gap-3">
            <SecondaryButton onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
              Cancel
            </SecondaryButton>
            <SecondaryButton tone="error" onClick={() => void handleDelete()} disabled={isDeleting}>
              <FaTrash aria-hidden="true" />
              {isDeleting ? 'Deleting…' : 'Delete form'}
            </SecondaryButton>
          </div>
        </Modal>
      )}
    </div>
  )
}
