import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaBoxArchive, FaFileLines, FaPen, FaRotateLeft } from 'react-icons/fa6'
import { PageHeader } from '../components/ui/PageHeader'
import { StatusMessage } from '../components/ui/StatusMessage'
import { SecondaryButton } from '../components/ui/Button'
import { FormsTable } from '../components/dashboard/FormsTable'
import { listOwnerForms, restoreForm } from '../lib/formsApi'
import { getErrorMessage } from '../lib/errors'
import type { FormRow } from '../lib/database.types'

export function ArchivePage() {
  const navigate = useNavigate()
  const [forms, setForms] = useState<FormRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [restoreError, setRestoreError] = useState('')

  useEffect(() => {
    void loadForms()
  }, [])

  async function loadForms() {
    setIsLoading(true)
    setLoadError('')
    try {
      const result = await listOwnerForms()
      setForms(result.filter((form) => form.status === 'archived'))
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Failed to load your archived forms.'))
    } finally {
      setIsLoading(false)
    }
  }

  // Restores to draft - the more conservative default. Restoring straight
  // back to published is still available from the builder's Status section.
  async function handleRestore(formId: string) {
    setRestoringId(formId)
    setRestoreError('')
    try {
      await restoreForm(formId, 'draft')
      setForms((prev) => prev.filter((form) => form.id !== formId))
    } catch (error) {
      setRestoreError(getErrorMessage(error, 'Failed to restore the form.'))
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6 sm:p-10">
        <PageHeader title="Archive" subtitle="Forms you've archived. They stay here until restored." />

        {restoreError && (
          <div className="mb-4">
            <StatusMessage tone="error" message={restoreError} />
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : loadError ? (
          <StatusMessage tone="error" message={loadError} />
        ) : (
          <FormsTable
            forms={forms}
            showStatus={false}
            emptyMessage={
              <>
                <FaBoxArchive className="text-2xl text-slate-300" aria-hidden="true" />
                <span>No archived forms.</span>
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
                  tone="green"
                  onClick={() => void handleRestore(form.id)}
                  disabled={restoringId === form.id}
                >
                  <FaRotateLeft aria-hidden="true" />
                  <span className="hidden lg:inline">Restore</span>
                </SecondaryButton>
              </>
            )}
          />
        )}
      </div>
    </div>
  )
}
