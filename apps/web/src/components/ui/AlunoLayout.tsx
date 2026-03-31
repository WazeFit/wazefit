/**
 * Layout do Aluno — header + bottom nav.
 * Suporta white label via TenantContext.
 */
import type { User, Tenant } from '../../stores/auth'
import { useTenant } from '../../contexts/TenantContext'
import { useTenantColors } from './TenantBrand'

interface Props {
  children: React.ReactNode
  user: User
  tenant: Tenant
  currentPath: string
  onNavigate: (path: string) => void
  onLogout: () => void
}

const NAV = [
  { label: 'Treino', icon: '🏋️', href: '/aluno/treino' },
  { label: 'Nutrição', icon: '🥗', href: '/aluno/nutricao' },
  { label: 'Ranking', icon: '🏆', href: '/aluno/ranking' },
  { label: 'Chat', icon: '💬', href: '/aluno/chat' },
  { label: 'Perfil', icon: '👤', href: '/aluno/perfil' },
]

export function AlunoLayout({ children, user, tenant, currentPath, onNavigate, onLogout }: Props) {
  const { branding, isTenantHost } = useTenant()
  const { primary } = useTenantColors()

  const displayName = (isTenantHost && branding?.nome) ? branding.nome : tenant.nome
  const logoUrl = (isTenantHost && branding?.logo_url) ? branding.logo_url : null

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt={displayName || ''} className="h-7 object-contain rounded-lg" />
            ) : (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                style={{ backgroundColor: primary }}
              >
                {displayName ? displayName.charAt(0).toUpperCase() : 'W'}
              </div>
            )}
            <span className="font-bold text-white">
              {isTenantHost && branding?.nome ? (
                branding.nome
              ) : (
                <>Waze<span className="text-green-400">Fit</span></>
              )}
            </span>
            {displayName && !isTenantHost && (
              <span className="text-xs text-gray-500 hidden sm:inline">· {displayName}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{user.nome.split(' ')[0]}</span>
            <button onClick={onLogout} className="text-xs text-gray-500 hover:text-red-400 transition-colors">Sair</button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800">
        <div className="max-w-2xl mx-auto flex">
          {NAV.map((item) => {
            const active = currentPath === item.href || currentPath.startsWith(item.href + '/')
            return (
              <button
                key={item.href}
                onClick={() => onNavigate(item.href)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs transition-colors ${
                  active ? '' : 'text-gray-500'
                }`}
                style={active ? { color: primary } : undefined}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
