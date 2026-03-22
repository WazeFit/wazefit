/**
 * Layout do Expert — sidebar + content area.
 */
import { Sidebar } from './Sidebar'
import { ErrorBoundary } from './ErrorBoundary'
import type { User, Tenant } from '../../stores/auth'

interface Props {
  children: React.ReactNode
  user: User
  tenant: Tenant
  currentPath: string
  onNavigate: (path: string) => void
  onLogout: () => void
}

export function ExpertLayout({ children, user, tenant, currentPath, onNavigate, onLogout }: Props) {
  return (
    <div className="min-h-screen bg-dark-950">
      <Sidebar 
        user={user} 
        tenant={tenant} 
        currentPath={currentPath} 
        onNavigate={onNavigate} 
        onLogout={onLogout} 
      />
      <main className="ml-64 min-h-screen">
        <div className="p-6 lg:p-8 max-w-[1600px]">
          <ErrorBoundary key={currentPath}>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
