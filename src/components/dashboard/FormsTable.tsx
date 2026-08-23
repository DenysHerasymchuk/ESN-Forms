import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FaBoxArchive, FaGlobe, FaPen } from 'react-icons/fa6'
import { DataTable, type DataTableColumn } from '../ui/DataTable'
import { Badge, type BadgeTone } from '../ui/Badge'
import type { FormRow, FormStatus } from '../../lib/database.types'

const statusTone: Record<FormStatus, BadgeTone> = {
  draft: 'neutral',
  published: 'success',
  archived: 'muted',
}

const statusIcon: Record<FormStatus, ReactNode> = {
  draft: <FaPen aria-hidden="true" />,
  published: <FaGlobe aria-hidden="true" />,
  archived: <FaBoxArchive aria-hidden="true" />,
}

type Props = {
  forms: FormRow[]
  emptyMessage: ReactNode
  renderActions: (form: FormRow) => ReactNode
  showStatus?: boolean
  // Adds an "Owner" column - only the admin "All forms" view needs this,
  // since every other use of this table is already scoped to one owner.
  ownerLabel?: (form: FormRow) => string
}

// Only a published form actually has a live public page to link to -
// draft/archived badges stay plain status labels. Shared by both the
// table (sm and up) and the card layout (below sm) so the two agree.
function StatusBadge({ form, size }: { form: FormRow; size?: 'sm' | 'md' }) {
  const badge = (
    <Badge tone={statusTone[form.status]} icon={statusIcon[form.status]} size={size}>
      {form.status}
    </Badge>
  )
  return form.status === 'published' ? (
    <a
      href={`/forms/${form.slug}`}
      target="_blank"
      rel="noreferrer"
      title="Open the public form"
      className="inline-block transition-opacity hover:opacity-80"
    >
      {badge}
    </a>
  ) : (
    badge
  )
}

// Shared by "My forms", Archive, and the admin "All forms" view. A plain
// <table> (even with column-hiding) can't fit Name + Status + action
// buttons in a phone-width viewport, which forced a horizontal swipe just
// to reach the actions - below `sm` this renders each form as a card
// instead, with actions in their own full-width row, so nothing is ever
// off-screen. `sm` and up keeps the real table.
export function FormsTable({ forms, emptyMessage, renderActions, showStatus = true, ownerLabel }: Props) {
  if (forms.length === 0) {
    return <div className="flex flex-col items-center gap-2 py-12 text-center text-base text-muted">{emptyMessage}</div>
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
    ...(ownerLabel
      ? [
          {
            header: 'Owner',
            hideBelowLg: true,
            cell: (form: FormRow) => ownerLabel(form),
          },
        ]
      : []),
    ...(showStatus ? [{ header: 'Status', cell: (form: FormRow) => <StatusBadge form={form} /> }] : []),
    {
      header: 'Updated',
      hideBelowLg: true,
      cell: (form) => new Date(form.updated_at).toLocaleDateString(),
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (form) => <div className="flex justify-end gap-2">{renderActions(form)}</div>,
    },
  ]

  return (
    <>
      <div className="hidden sm:block">
        <DataTable columns={columns} rows={forms} getRowKey={(form) => form.id} />
      </div>

      <div className="space-y-3 sm:hidden">
        {forms.map((form) => (
          <div key={form.id} className="surface-card p-4">
            <div className="flex items-start justify-between gap-3">
              <Link to={`/dashboard/forms/${form.id}/edit`} className="font-medium text-esn-blue hover:underline">
                {form.name}
              </Link>
              {showStatus && <StatusBadge form={form} size="sm" />}
            </div>
            {ownerLabel && <p className="mt-1 text-sm text-muted">{ownerLabel(form)}</p>}
            <p className="mt-1 text-sm text-muted">Updated {new Date(form.updated_at).toLocaleDateString()}</p>
            <div className="mt-3 flex justify-center gap-2 border-t border-slate-100 pt-3 [&>*]:flex-1">
              {renderActions(form)}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
