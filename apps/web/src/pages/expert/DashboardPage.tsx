/**
 * Dashboard do Expert — página principal após login.
 */
import { useAuth } from '../../stores/auth'

export function DashboardPage() {
  const { user, tenant } = useAuth()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Olá, {user?.nome?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-400 mt-1">
          Bem-vindo ao painel do {tenant?.nome || 'WazeFit'}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Alunos Ativos', value: '—', icon: '👥', cor: 'brand' },
          { label: 'Treinos Hoje', value: '—', icon: '🏋️', cor: 'blue' },
          { label: 'Mensagens', value: '—', icon: '💬', cor: 'purple' },
          { label: 'Faturamento', value: '—', icon: '💰', cor: 'green' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded-full">
                Em breve
              </span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Novo Aluno', icon: '➕', href: '/alunos/novo' },
            { label: 'Nova Ficha', icon: '📋', href: '/fichas/nova' },
            { label: 'Exercícios', icon: '🏋️', href: '/exercicios' },
            { label: 'Financeiro', icon: '💰', href: '/financeiro' },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-colors"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm text-gray-300">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
