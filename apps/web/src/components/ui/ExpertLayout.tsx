/**
 * Layout do Expert — sidebar + content area.
 */
import { Sidebar } from './Sidebar'

interface ExpertLayoutProps {
  children: React.ReactNode
  onNavigate: (path: string) => void
}

export function ExpertLayout({ children, onNavigate }: ExpertLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Sidebar onNavigate={onNavigate} />
      <main className="ml-64 p-6 lg:p-8">{children}</main>
    </div>
  )
}
