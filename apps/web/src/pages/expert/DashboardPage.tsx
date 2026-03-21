/**
 * Dashboard do Expert.
 */
import type { User, Tenant } from '../../stores/auth'

interface Props {
  user: User
  tenant: Tenant
}

export function DashboardPage({ user, tenant }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Olá, {user.nome.split(' ')[0]} 👋</h1>
      <p className="text-gray-400 mb-8">Bem-vindo ao painel do {tenant.nome || 'WazeFit'}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '👥', label: 'Alunos Ativos', value: '—' },
          { icon: '🏋️', label: 'Treinos Hoje', value: '—' },
          { icon: '💬', label: 'Mensagens', value: '—' },
          { icon: '💰', label: 'Receita Mensal', value: '—' },
        ].map((card) => (
          <div key={card.label} className="bg-gray-800/30 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Em breve</span>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
