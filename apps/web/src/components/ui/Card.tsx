import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export function Card({ children, className = '', onClick, hover }: Props) {
  return (
    <div 
      className={`
        bg-dark-900/50 backdrop-blur-sm border border-dark-800 rounded-xl 
        ${hover ? 'hover:border-dark-700 hover:shadow-lg transition-all duration-200 cursor-pointer' : ''}
        ${className}
      `} 
      onClick={onClick} 
      role={onClick ? 'button' : undefined}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', onClick }: Props) {
  return (
    <div 
      className={`px-6 py-4 border-b border-dark-800 ${className}`} 
      onClick={onClick} 
      role={onClick ? 'button' : undefined}
    >
      {children}
    </div>
  )
}

export function CardBody({ children, className = '', onClick }: Props) {
  return (
    <div className={`px-6 py-5 ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '', onClick }: Props) {
  return (
    <div className={`px-6 py-4 border-t border-dark-800 bg-dark-900/30 rounded-b-xl ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}
