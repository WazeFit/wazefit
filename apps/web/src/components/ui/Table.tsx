import type { ReactNode } from 'react'

interface TableProps {
  children: ReactNode
  className?: string
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-dark-800">
      <table className={`w-full ${className}`}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children, className = '' }: TableProps) {
  return (
    <thead className={`bg-dark-900/50 border-b border-dark-800 ${className}`}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className = '' }: TableProps) {
  return (
    <tbody className={`divide-y divide-dark-800 ${className}`}>
      {children}
    </tbody>
  )
}

export function TableRow({ children, className = '', onClick }: TableProps & { onClick?: () => void }) {
  return (
    <tr 
      className={`
        ${onClick ? 'cursor-pointer hover:bg-dark-800/50 transition-colors' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function TableHead({ children, className = '' }: TableProps) {
  return (
    <th className={`px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  )
}

export function TableCell({ children, className = '' }: TableProps) {
  return (
    <td className={`px-6 py-4 text-sm text-gray-300 ${className}`}>
      {children}
    </td>
  )
}
