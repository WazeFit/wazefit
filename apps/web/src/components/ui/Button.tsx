import { type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow-glow-sm active:scale-[0.98] border border-brand-600',
  secondary: 'bg-dark-800 hover:bg-dark-700 text-white border border-dark-700 hover:border-dark-600',
  ghost: 'bg-transparent hover:bg-dark-800 text-gray-300 hover:text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm border border-red-600',
  outline: 'bg-transparent border border-dark-700 hover:border-brand-500 text-gray-300 hover:text-white hover:bg-dark-800',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading, 
  className = '', 
  children, 
  disabled, 
  ...rest 
}: Props) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-medium 
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 focus:ring-offset-dark-950
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${className}
      `}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
