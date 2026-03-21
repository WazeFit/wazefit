import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: Props) {
  return (
    <div className={`bg-gray-900/50 border border-gray-800 rounded-xl ${className}`} onClick={onClick} role={onClick ? 'button' : undefined}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', onClick }: Props) {
  return (
    <div className={`px-5 py-4 border-b border-gray-800 ${className}`} onClick={onClick} role={onClick ? 'button' : undefined}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '', onClick }: Props) {
  return <div className={`px-5 py-4 ${className}`} onClick={onClick}>{children}</div>
}

export function CardFooter({ children, className = '', onClick }: Props) {
  return (
    <div className={`px-5 py-3 border-t border-gray-800 ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}
