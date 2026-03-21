/**
 * Layout do Expert — sidebar + content.
 */
import { Sidebar } from './Sidebar'
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
    <div className="min-h-screen bg-gray-950 text-white">
      <Sidebar user={user} tenant={tenant} currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="ml-64 p-6 lg:p-8">{children}</main>
    </div>
  )
}
