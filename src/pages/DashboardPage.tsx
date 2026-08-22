import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaBoxArchive, FaFileLines, FaPen, FaPlus, FaTableList } from 'react-icons/fa6'
import { PageHeader } from '../components/ui/PageHeader'
import { PrimaryButton, SecondaryButton } from '../components/ui/Button'
import { StatusMessage } from '../components/ui/StatusMessage'
import { FormsTable } from '../components/dashboard/FormsTable'
import { archiveForm, createForm, listOwnerForms } from '../lib/formsApi'
import { getErrorMessage } from '../lib/errors'
import type { FormRow } from '../lib/database.types'

export function DashboardPage() {
  const navigate = useNavigate()
  const [forms, setForms] = useState<FormRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [createError, setCreateError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [archiveError, setArchiveError] = useState('')

  useEffect(() => {
    void loadForms()
  }, [])

  async function loadForms() {
    setIsLoading(true)
    setLoadError('')
    try {
      const result = await listOwnerForms()
      setForms(result.filter((form) => form.status !== 'archived'))
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Failed to load your forms.'))
    } finally {
      setIsLoading(false)
    }
  }

  // Creates a placeholder form immediately and jumps straight to its
  // builder, where the "Details" section already lets you rename it -
  // no separate name/description prompt up front.
  async function handleCreate() {
    setIsCreating(true)
    setCreateError('')
    try {
      const created = await createForm('Untitled form', null)
      navigate(`/dashboard/forms/${created.id}/edit`)
    } catch (error) {
      setCreateError(getErrorMessage(error, 'Failed to create the form.'))
      setIsCreating(false)
    }
  }

  async function handleArchive(formId: string) {
    setArchivingId(formId)
    setArchiveError('')
    try {
      await archiveForm(formId)
      // Archived forms don't belong on "My forms" anymore - drop it locally
      // instead of a full refetch.
      setForms((prev) => prev.filter((form) => form.id !== formId))
    } catch (error) {
      setArchiveError(getErrorMessage(error, 'Failed to archive the form.'))
    } finally {
      setArchivingId(null)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6 sm:p-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <PageHeader title="My forms" subtitle="Create and manage the forms you own." />
          <PrimaryButton onClick={() => void handleCreate()} isSubmitting={isCreating} className="w-auto px-4">
            <FaPlus aria-hidden="true" />
            New form
          </PrimaryButton>
        </div>

        {createError && (
          <div className="mb-4">
            <StatusMessage tone="error" message={createError} />
          </div>
        )}
        {archiveError && (
          <div className="mb-4">
            <StatusMessage tone="error" message={archiveError} />
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : loadError ? (
          <StatusMessage tone="error" message={loadError} />
        ) : (
          <FormsTable
            forms={forms}
            emptyMessage={
              <>
                <FaTableList className="text-2xl text-slate-300" aria-hidden="true" />
                <span>You haven't created any forms yet.</span>
              </>
            }
            renderActions={(form) => (
              <>
                <SecondaryButton tone="blue" onClick={() => navigate(`/dashboard/forms/${form.id}/edit`)}>
                  <FaPen aria-hidden="true" />
                  <span className="hidden lg:inline">Edit</span>
                </SecondaryButton>
                <SecondaryButton tone="orange" onClick={() => navigate(`/dashboard/forms/${form.id}/submissions`)}>
                  <FaFileLines aria-hidden="true" />
                  <span className="hidden lg:inline">Submissions</span>
                </SecondaryButton>
                <SecondaryButton
                  tone="pink"
                  onClick={() => void handleArchive(form.id)}
                  disabled={archivingId === form.id}
                >
                  <FaBoxArchive aria-hidden="true" />
                  <span className="hidden lg:inline">Archive</span>
                </SecondaryButton>
              </>
            )}
          />
        )}
      </div>
    </div>
  )
}
