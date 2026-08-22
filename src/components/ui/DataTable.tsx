import type { ReactNode } from 'react'

export type DataTableColumn<T> = {
  header: string
  cell: (row: T) => ReactNode
  // Hides this column below the lg breakpoint (i.e. also hidden at md) -
  // for secondary info (e.g. a last-updated date) that isn't essential
  // until there's real room for it.
  hideBelowLg?: boolean
  // Aligns both the header label and the cell content - set to 'right' for
  // columns whose cell content is itself right-aligned (e.g. action
  // buttons), so the header doesn't float on the opposite side.
  align?: 'left' | 'right'
}

type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  emptyMessage?: ReactNode
}

export function DataTable<T>({ columns, rows, getRowKey, emptyMessage = 'Nothing to show yet.' }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <div className="flex flex-col items-center gap-2 py-12 text-center text-base text-muted">{emptyMessage}</div>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                scope="col"
                className={`px-5 py-4 text-sm font-semibold tracking-wide text-muted uppercase ${
                  column.align === 'right' ? 'text-right' : 'text-left'
                } ${column.hideBelowLg ? 'hidden lg:table-cell' : ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="hover:bg-ink/[0.02]">
              {columns.map((column) => (
                <td
                  key={column.header}
                  className={`px-5 py-4 align-middle text-base text-ink ${
                    column.align === 'right' ? 'text-right' : 'text-left'
                  } ${column.hideBelowLg ? 'hidden lg:table-cell' : ''}`}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
