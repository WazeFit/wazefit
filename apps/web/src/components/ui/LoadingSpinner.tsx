import { Loader2 } from 'lucide-react'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

export function LoadingSpinner({ size = 'md', className = '', text }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-brand-500 animate-spin`} />
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  )
}

// Alias para compatibilidade
export function PageLoader({ text }: { text?: string }) {
  return <LoadingSpinner size="lg" text={text} className="py-12" />
}
