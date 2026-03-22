import type { ReactNode } from 'react'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface Props {
  children: ReactNode
  variant?: Variant
  className?: string
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-dark-800 text-gray-300 border-dark-700',
  success: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

export function Badge({ children, variant = 'default', className = '' }: Props) {
  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 
      rounded-md text-xs font-medium border
      ${variantClasses[variant]} 
      ${className}
    `}>
      {children}
    </span>
  )
}
