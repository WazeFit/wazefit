interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
}

export function LoadingSpinner({ size = 'md', className = '' }: Props) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-green-500 border-t-transparent rounded-full animate-spin`} />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <LoadingSpinner size="lg" />
    </div>
  )
}
