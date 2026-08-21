import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { PrimaryButton, SecondaryButton } from '../components/ui/Button'
import { Badge, type BadgeTone } from '../components/ui/Badge'
import { DataTable, type DataTableColumn } from '../components/ui/DataTable'
import { StatusMessage } from '../components/ui/StatusMessage'
import { createForm, listOwnerForms } from '../lib/formsApi'
import { getErrorMessage } from '../lib/errors'
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
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6 sm:p-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <PageHeader title="My forms" subtitle="Create and manage the forms you own." />
          <PrimaryButton onClick={() => void handleCreate()} isSubmitting={isCreating} className="w-auto px-4">
            New form
          </PrimaryButton>
        </div>

        {createError && (
          <div className="mb-4">
            <StatusMessage tone="error" message={createError} />
          </div>
        )}

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
  )
}
