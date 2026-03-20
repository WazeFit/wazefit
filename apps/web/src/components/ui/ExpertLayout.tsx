/**
 * Layout do Expert — sidebar + content area.
 */
import { Sidebar } from './Sidebar'

interface ExpertLayoutProps {
  children: React.ReactNode
}

export function ExpertLayout({ children }: ExpertLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="ml-64 p-6 lg:p-8">{children}</main>
    </div>
  )
}
