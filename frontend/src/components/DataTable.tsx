/**
 * DataTable.tsx
 *
 * Generic data table. Matches v1 table.piClinicList.
 *
 * Columns are defined as an array of column descriptors. Rows are an array
 * of objects keyed by column key. Cell content is ReactNode so callers can
 * pass links, pipe-separated action groups, or plain strings.
 *
 * Usage:
 *   const columns = [
 *     { key: 'name',    heading: 'Patient name', nowrap: true },
 *     { key: 'arrived', heading: 'Admitted to clinic' },
 *     { key: 'actions', heading: 'Actions', align: 'right' },
 *   ]
 *   const rows = [
 *     { name: <Link to="...">Alpha Benchmark</Link>, arrived: '12:55 PM', actions: <ActionLinks /> },
 *   ]
 *   <DataTable columns={columns} rows={rows} />
 */

import './DataTable.css'

interface DataTableColumn {
  key: string
  heading: string
  nowrap?: boolean
  align?: 'left' | 'right' | 'center'
  inactive?: boolean
}

interface DataTableProps {
  columns: DataTableColumn[]
  rows: Record<string, React.ReactNode>[]
}

export default function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.align === 'right' ? 'dt-right' : undefined}
              >
                {col.heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col) => {
                const value = row[col.key]
                const isEmpty = value === null || value === undefined || value === ''
                const classes = [
                  col.nowrap              ? 'dt-nowrap'   : '',
                  col.align === 'right'  ? 'dt-right'    : '',
                  isEmpty                ? 'dt-inactive' : '',
                ].filter(Boolean).join(' ')
                return (
                  <td key={col.key} className={classes || undefined}>
                    {isEmpty ? '\u2014' : value}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
