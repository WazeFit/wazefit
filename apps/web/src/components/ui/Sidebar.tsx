/**
 * Sidebar — navegação lateral moderna do Expert com Lucide icons.
 */
import type { User, Tenant } from '../../stores/auth'
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  FileText,
  Library,
  Apple,
  ClipboardList,
  MessageSquare,
  Trophy,
  DollarSign,
  BarChart3,
  Sparkles,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  Globe,
  Palette,
} from 'lucide-react'
import { useState } from 'react'

interface Props {
  user: User
  tenant: Tenant
  currentPath: string
  onNavigate: (path: string) => void
  onLogout: () => void
}

interface NavItem {
  label: string
  icon: any
  href: string
  section?: string
}

const NAV_ITEMS: NavItem[] = [
  // Principal
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', section: 'Principal' },
  { label: 'Alunos', icon: Users, href: '/alunos', section: 'Principal' },
  
  // Gestão
  { label: 'Exercícios', icon: Dumbbell, href: '/expert/exercicios', section: 'Gestão' },
  { label: 'Fichas', icon: FileText, href: '/expert/fichas', section: 'Gestão' },
  { label: 'Biblioteca', icon: Library, href: '/expert/biblioteca', section: 'Gestão' },
  { label: 'Nutrição', icon: Apple, href: '/expert/nutricao', section: 'Gestão' },
  { label: 'Avaliações', icon: ClipboardList, href: '/expert/avaliacoes', section: 'Gestão' },
  
  // Comunicação
  { label: 'Chat', icon: MessageSquare, href: '/expert/chat', section: 'Comunicação' },
  { label: 'Ranking', icon: Trophy, href: '/expert/ranking', section: 'Comunicação' },
  
  // Negócio
  { label: 'Financeiro', icon: DollarSign, href: '/expert/financeiro', section: 'Negócio' },
  { label: 'Analytics', icon: BarChart3, href: '/expert/analytics', section: 'Negócio' },
  
  // IA
  { label: 'Briefing IA', icon: Sparkles, href: '/expert/briefings', section: 'IA' },
  { label: 'Gerar com IA', icon: Sparkles, href: '/expert/gerar-ia', section: 'IA' },
  
  // Config
  { label: 'Domínios', icon: Globe, href: '/expert/dominios', section: 'Config' },
  { label: 'Identidade Visual', icon: Palette, href: '/expert/identidade', section: 'Config' },
  { label: 'Configurações', icon: Settings, href: '/expert/config', section: 'Config' },
]

const ADMIN_NAV: NavItem[] = [
  { label: 'Admin Dashboard', icon: Shield, href: '/admin/dashboard' },
]

export function Sidebar({ user, tenant, currentPath, onNavigate, onLogout }: Props) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Agrupar itens por seção
  const sections = NAV_ITEMS.reduce((acc, item) => {
    const section = item.section || 'Outros'
    if (!acc[section]) acc[section] = []
    acc[section].push(item)
    return acc
  }, {} as Record<string, NavItem[]>)

  const sectionOrder = ['Principal', 'Gestão', 'Comunicação', 'Negócio', 'IA', 'Config']

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-900 border-r border-dark-800 flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-dark-800">
        <button 
          onClick={() => onNavigate('/dashboard')} 
          className="flex items-center gap-3 w-full group"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center font-bold text-white shadow-glow-sm">
            W
          </div>
          <div className="text-left">
            <div className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors">
              Waze<span className="text-brand-400">Fit</span>
            </div>
            <p className="text-xs text-gray-500 truncate max-w-[140px]">
              {tenant.nome || 'Painel Expert'}
            </p>
          </div>
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        {sectionOrder.map((sectionName) => {
          const items = sections[sectionName]
          if (!items || items.length === 0) return null

          return (
            <div key={sectionName}>
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {sectionName}
              </h3>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon
                  const active = currentPath === item.href || currentPath.startsWith(item.href + '/')
                  
                  return (
                    <button
                      key={item.href}
                      onClick={() => onNavigate(item.href)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm 
                        transition-all duration-200 group
                        ${active 
                          ? 'bg-brand-500/10 text-brand-400 font-medium shadow-glow-sm' 
                          : 'text-gray-400 hover:text-white hover:bg-dark-800'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-brand-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                      <span className="truncate">{item.label}</span>
                      {active && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Admin */}
        {user.role === 'admin' && (
          <div>
            <div className="my-3 border-t border-dark-800" />
            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Admin
            </h3>
            <div className="space-y-1">
              {ADMIN_NAV.map((item) => {
                const Icon = item.icon
                const active = currentPath === item.href || currentPath.startsWith(item.href + '/')
                
                return (
                  <button
                    key={item.href}
                    onClick={() => onNavigate(item.href)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm 
                      transition-all duration-200 group
                      ${active 
                        ? 'bg-red-500/10 text-red-400 font-medium' 
                        : 'text-gray-400 hover:text-white hover:bg-dark-800'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-red-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User Menu */}
      <div className="p-3 border-t border-dark-800">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-dark-800 transition-colors group"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-sm font-semibold text-white shadow-glow-sm">
              {user.nome.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-white truncate">{user.nome}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-dark-800 border border-dark-700 rounded-lg shadow-xl overflow-hidden">
              <button
                onClick={() => {
                  setUserMenuOpen(false)
                  onLogout()
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
