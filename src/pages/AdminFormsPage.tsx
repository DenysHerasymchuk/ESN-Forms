import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaClipboardList, FaFileLines, FaPen, FaShieldHalved, FaTrash } from 'react-icons/fa6'
import { PageHeader } from '../components/ui/PageHeader'
import { StatusMessage } from '../components/ui/StatusMessage'
import { SecondaryButton } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { FormsTable } from '../components/dashboard/FormsTable'
import { adminDeleteForm, listAllFormsAsAdmin, listUsers } from '../lib/adminApi'
import { getErrorMessage } from '../lib/errors'
import type { FormRow } from '../lib/database.types'

export function AdminFormsPage() {
  const navigate = useNavigate()
  const [forms, setForms] = useState<FormRow[]>([])
  const [ownerEmailById, setOwnerEmailById] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [deletingForm, setDeletingForm] = useState<FormRow | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    setLoadError('')
    try {
      const [allForms, allUsers] = await Promise.all([listAllFormsAsAdmin(), listUsers()])
      setForms(allForms)
      setOwnerEmailById(Object.fromEntries(allUsers.map((user) => [user.id, user.email])))
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Failed to load forms.'))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deletingForm) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      await adminDeleteForm(deletingForm.id)
      setForms((prev) => prev.filter((form) => form.id !== deletingForm.id))
      setDeletingForm(null)
    } catch (error) {
      setDeleteError(getErrorMessage(error, 'Failed to delete the form.'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="surface-card animate-rise relative overflow-hidden">
      <div className="p-6 sm:p-10">
        <PageHeader
          title="All forms"
          subtitle="Every form across ESN Forms, regardless of owner."
          badge={
            <Badge tone="admin" icon={<FaShieldHalved aria-hidden="true" />}>
              Admin
            </Badge>
          }
        />

        {isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : loadError ? (
          <StatusMessage tone="error" message={loadError} />
        ) : (
          <FormsTable
            forms={forms}
            ownerLabel={(form) => ownerEmailById[form.owner_id] ?? '—'}
            emptyMessage={
              <>
                <FaClipboardList className="text-2xl text-slate-300" aria-hidden="true" />
                <span>No forms yet.</span>
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
                <SecondaryButton tone="error" onClick={() => setDeletingForm(form)}>
                  <FaTrash aria-hidden="true" />
                  <span className="hidden lg:inline">Delete</span>
                </SecondaryButton>
              </>
            )}
          />
        )}
      </div>

      <Modal title="Delete this form?" isOpen={deletingForm !== null} onClose={() => setDeletingForm(null)}>
        <p className="mb-6 text-sm text-muted">
          This permanently deletes "{deletingForm?.name}"{' '}
          {deletingForm ? `(owned by ${ownerEmailById[deletingForm.owner_id] ?? 'unknown owner'})` : ''} and all of
          its responses. This can't be undone.
        </p>
        {deleteError && (
          <div className="mb-4">
            <StatusMessage tone="error" message={deleteError} />
          </div>
        )}
        <div className="flex justify-end gap-3">
          <SecondaryButton onClick={() => setDeletingForm(null)} disabled={isDeleting}>
            Cancel
          </SecondaryButton>
          <SecondaryButton tone="error" onClick={() => void handleConfirmDelete()} disabled={isDeleting}>
            <FaTrash aria-hidden="true" />
            {isDeleting ? 'Deleting…' : 'Delete form'}
          </SecondaryButton>
        </div>
      </Modal>
    </div>
  )
}
