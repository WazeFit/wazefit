type Variant = 'success' | 'warning' | 'danger' | 'info'

interface Props {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<Variant, string> = {
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

export function Badge({ variant = 'info', children, className = '' }: Props) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}
