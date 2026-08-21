import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { PrimaryButton, SecondaryButton } from '../components/ui/Button'
import { Badge, type BadgeTone } from '../components/ui/Badge'
import { DataTable, type DataTableColumn } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { TextField } from '../components/ui/TextField'
import { StatusMessage } from '../components/ui/StatusMessage'
import { createForm, listOwnerForms } from '../lib/formsApi'
import type { FormRow, FormStatus } from '../lib/database.types'

const statusTone: Record<FormStatus, BadgeTone> = {
  draft: 'neutral',
  published: 'success',
  archived: 'muted',
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [forms, setForms] = useState<FormRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [createError, setCreateError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    void loadForms()
  }, [])

  async function loadForms() {
    setIsLoading(true)
    setLoadError('')
    try {
      const result = await listOwnerForms()
      setForms(result)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load your forms.')
    } finally {
      setIsLoading(false)
    }
  }

  function openModal() {
    setNewName('')
    setNewDescription('')
    setCreateError('')
    setIsModalOpen(true)
  }

  async function handleCreate() {
    if (!newName.trim()) {
      setCreateError('Give the form a name.')
      return
    }
    setIsCreating(true)
    setCreateError('')
    try {
      const created = await createForm(newName.trim(), newDescription.trim() || null)
      navigate(`/dashboard/forms/${created.id}/edit`)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create the form.')
      setIsCreating(false)
    }
  }

  const columns: DataTableColumn<FormRow>[] = [
    {
      header: 'Name',
      cell: (form) => (
        <Link to={`/dashboard/forms/${form.id}/edit`} className="font-medium text-esn-blue hover:underline">
          {form.name}
        </Link>
      ),
    },
    {
      header: 'Status',
      cell: (form) => <Badge tone={statusTone[form.status]}>{form.status}</Badge>,
    },
    {
      header: 'Updated',
      cell: (form) => new Date(form.updated_at).toLocaleDateString(),
    },
    {
      header: 'Actions',
      cell: (form) => (
        <div className="flex gap-2">
          <SecondaryButton onClick={() => navigate(`/dashboard/forms/${form.id}/edit`)}>Edit</SecondaryButton>
          <SecondaryButton onClick={() => navigate(`/dashboard/forms/${form.id}/submissions`)}>
            Submissions
          </SecondaryButton>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6 sm:p-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <PageHeader title="My forms" subtitle="Create and manage the forms you own." />
            <PrimaryButton onClick={openModal} className="w-auto px-4">
              New form
            </PrimaryButton>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : loadError ? (
            <StatusMessage tone="error" message={loadError} />
          ) : (
            <DataTable
              columns={columns}
              rows={forms}
              getRowKey={(form) => form.id}
              emptyMessage="You haven't created any forms yet."
            />
          )}
        </div>
      </div>

      <Modal title="New form" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <TextField label="Name" required value={newName} onChange={setNewName} />
        <TextField label="Description" multiline value={newDescription} onChange={setNewDescription} />
        <div className="mt-2 flex justify-end gap-2">
          <SecondaryButton onClick={() => setIsModalOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={() => void handleCreate()} isSubmitting={isCreating} className="w-auto px-4">
            Create
          </PrimaryButton>
        </div>
        {createError && (
          <div className="mt-3">
            <StatusMessage tone="error" message={createError} />
          </div>
        )}
      </Modal>
    </>
  )
}
