import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  action?: ReactNode
  breadcrumbs?: Array<{ label: string; href?: string }>
}

export function PageHeader({ title, description, action, breadcrumbs }: Props) {
  return (
    <div className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm mb-3">
          {breadcrumbs.map((crumb, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-gray-600">/</span>}
              {crumb.href ? (
                <a 
                  href={crumb.href} 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-gray-500">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}
      
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-gray-400 text-sm md:text-base max-w-2xl">
              {description}
            </p>
          )}
        </div>
        
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
