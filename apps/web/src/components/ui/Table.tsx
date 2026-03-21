import type { ReactNode } from 'react'

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => ReactNode
  className?: string
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  emptyMessage?: string
  onRowClick?: (row: T) => void
}

export function Table<T>({ columns, data, keyExtractor, emptyMessage = 'Nenhum item encontrado', onRowClick }: Props<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            {columns.map((col) => (
              <th key={col.key} className={`text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${col.className ?? ''}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-gray-800/50 ${onRowClick ? 'cursor-pointer hover:bg-gray-800/30' : ''}`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-gray-300 ${col.className ?? ''}`}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
