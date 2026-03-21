import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: Props) {
  return (
    <div className={`bg-gray-900/50 border border-gray-800 rounded-xl ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: Props) {
  return (
    <div className={`px-5 py-4 border-b border-gray-800 ${className}`}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }: Props) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }: Props) {
  return (
    <div className={`px-5 py-3 border-t border-gray-800 ${className}`}>
      {children}
    </div>
  )
}
