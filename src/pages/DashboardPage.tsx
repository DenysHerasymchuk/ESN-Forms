import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaBoxArchive, FaFileLines, FaPen, FaPlus, FaTableList } from 'react-icons/fa6'
import { PageHeader } from '../components/ui/PageHeader'
import { PrimaryButton, SecondaryButton } from '../components/ui/Button'
import { StatusMessage } from '../components/ui/StatusMessage'
import { FormsTable } from '../components/dashboard/FormsTable'
import { archiveForm, listOwnerForms } from '../lib/formsApi'
import { getErrorMessage } from '../lib/errors'
import type { FormRow } from '../lib/database.types'

export function DashboardPage() {
  const navigate = useNavigate()
  const [forms, setForms] = useState<FormRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
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
    <div className="surface-card animate-rise relative overflow-hidden">
      <div className="p-6 sm:p-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <PageHeader title="My forms" subtitle="Create and manage the forms you own." />
          <PrimaryButton onClick={() => navigate('/dashboard/forms/new')} className="w-auto px-4">
            <FaPlus aria-hidden="true" />
            New form
          </PrimaryButton>
        </div>

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
                <SecondaryButton
                  tone="orange"
                  onClick={() => navigate(`/dashboard/forms/${form.id}/edit?tab=submissions`)}
                >
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
