/**
 * Sidebar — navegação lateral do Expert.
 */
import { useAuth } from '../../stores/auth'

interface SidebarProps {
  onNavigate: (path: string) => void
}

interface NavItem {
  label: string
  icon: string
  href: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: '📊', href: '/dashboard' },
  { label: 'Alunos', icon: '👥', href: '/alunos' },
  { label: 'Exercícios', icon: '🏋️', href: '/exercicios' },
  { label: 'Fichas', icon: '📋', href: '/fichas' },
  { label: 'Chat', icon: '💬', href: '/chat' },
  { label: 'Financeiro', icon: '💰', href: '/financeiro' },
]

export function Sidebar({ onNavigate }: SidebarProps) {
  const { user, tenant, logout } = useAuth()
  const currentPath = window.location.pathname

  const handleLogout = async () => {
    await logout()
    onNavigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <button onClick={() => onNavigate('/dashboard')} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center font-bold text-sm">
            W
          </div>
          <div className="text-left">
            <span className="text-lg font-bold">
              Waze<span className="text-brand-400">Fit</span>
            </span>
            <p className="text-xs text-gray-500 -mt-0.5 truncate max-w-[160px]">
              {tenant?.nome || 'Painel Expert'}
            </p>
          </div>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/')
          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-brand-500/10 text-brand-400 font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm">
            {user?.nome?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.nome}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <span>🚪</span>
          Sair
        </button>
      </div>
    </aside>
  )
}
