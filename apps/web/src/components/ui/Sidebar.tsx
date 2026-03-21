/**
 * Sidebar — navegação lateral do Expert.
 */
import type { User, Tenant } from '../../stores/auth'

interface Props {
  user: User
  tenant: Tenant
  currentPath: string
  onNavigate: (path: string) => void
  onLogout: () => void
}

const NAV = [
  { label: 'Dashboard', icon: '📊', href: '/dashboard' },
  { label: 'Alunos', icon: '👥', href: '/alunos' },
  { label: 'Exercícios', icon: '🏋️', href: '/expert/exercicios' },
  { label: 'Fichas', icon: '📋', href: '/expert/fichas' },
  { label: 'Biblioteca', icon: '📚', href: '/expert/biblioteca' },
  { label: 'Nutrição', icon: '🥗', href: '/expert/nutricao' },
  { label: 'Avaliações', icon: '📋', href: '/expert/avaliacoes' },
  { label: 'Chat', icon: '💬', href: '/expert/chat' },
  { label: 'Ranking', icon: '🏆', href: '/expert/ranking' },
  { label: 'Financeiro', icon: '💰', href: '/expert/financeiro' },
  { label: 'Analytics', icon: '📈', href: '/expert/analytics' },
  { label: 'Briefing IA', icon: '🤖', href: '/expert/briefings' },
  { label: 'Gerar com IA', icon: '✨', href: '/expert/gerar-ia' },
  { label: 'Configurações', icon: '⚙️', href: '/expert/config' },
]

const ADMIN_NAV = [
  { label: 'Admin Dashboard', icon: '🔐', href: '/admin/dashboard' },
]

export function Sidebar({ user, tenant, currentPath, onNavigate, onLogout }: Props) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
      <div className="p-5 border-b border-gray-800">
        <button onClick={() => onNavigate('/dashboard')} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center font-bold text-sm">W</div>
          <div className="text-left">
            <span className="text-lg font-bold text-white">Waze<span className="text-green-400">Fit</span></span>
            <p className="text-xs text-gray-500 -mt-0.5 truncate max-w-[160px]">{tenant.nome || 'Painel Expert'}</p>
          </div>
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = currentPath === item.href || currentPath.startsWith(item.href + '/')
          return (
            <button key={item.href} onClick={() => onNavigate(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active ? 'bg-green-500/10 text-green-400 font-medium' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}>
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          )
        })}

        {user.role === 'admin' && (
          <>
            <div className="my-3 border-t border-gray-800" />
            {ADMIN_NAV.map((item) => {
              const active = currentPath === item.href || currentPath.startsWith(item.href + '/')
              return (
                <button key={item.href} onClick={() => onNavigate(item.href)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active ? 'bg-green-500/10 text-green-400 font-medium' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}>
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm">
            {user.nome.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white">{user.nome}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <button onClick={onLogout}
          className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
          <span>🚪</span> Sair
        </button>
      </div>
    </aside>
  )
}
