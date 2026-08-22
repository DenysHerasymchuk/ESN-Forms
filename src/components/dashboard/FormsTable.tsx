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

// Shared by "My forms", Archive, and the admin "All forms" view. Status
// collapses to icon-only below `sm`; "Owner"/"Updated" and the
// action-button labels collapse below `md` - actions get more room to
// breathe first since there are more of them.
export function FormsTable({ forms, emptyMessage, renderActions, showStatus = true, ownerLabel }: Props) {
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
    ...(showStatus
      ? [
          {
            header: 'Status',
            cell: (form: FormRow) => (
              <Badge tone={statusTone[form.status]} icon={statusIcon[form.status]}>
                <span className="hidden sm:inline">{form.status}</span>
              </Badge>
            ),
          },
        ]
      : []),
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

  return <DataTable columns={columns} rows={forms} getRowKey={(form) => form.id} emptyMessage={emptyMessage} />
}
