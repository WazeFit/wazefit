import type { ReactNode } from 'react'
import { Button } from './Button'

interface Props {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode | { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 text-gray-600 [&>svg]:w-16 [&>svg]:h-16">
          {typeof icon === 'string' ? <span className="text-5xl">{icon}</span> : icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 max-w-md mb-6">{description}</p>
      )}
      {action && (
        typeof action === 'object' && action !== null && 'label' in action
          ? <Button onClick={(action as { onClick: () => void }).onClick} variant="primary">{(action as { label: string }).label}</Button>
          : action
      )}
    </div>
  )
}
