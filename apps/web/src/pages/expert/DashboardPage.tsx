/**
 * Dashboard do Expert — com dados reais da API.
 */
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import type { User, Tenant } from '../../stores/auth'

interface Props {
  user: User
  tenant: Tenant
}

interface DashboardData {
  totalAlunos: number
  treinosHoje: number
  mensagensNaoLidas: number
  receitaMes: number
}

export function DashboardPage({ user, tenant }: Props) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [alunos, conversas, financeiro] = await Promise.allSettled([
          api.alunos.list(1, 1),
          api.chat.conversas(),
          api.financeiro.resumo(),
        ])

        setData({
          totalAlunos: alunos.status === 'fulfilled' ? (alunos.value?.total ?? alunos.value?.data?.length ?? 0) : 0,
          treinosHoje: 0, // Será implementado com execuções
          mensagensNaoLidas: conversas.status === 'fulfilled' ? (conversas.value?.reduce((acc: number, c: { nao_lidas?: number }) => acc + (c.nao_lidas ?? 0), 0) ?? 0) : 0,
          receitaMes: financeiro.status === 'fulfilled' ? ((financeiro.value as { receita_mes?: number })?.receita_mes ?? 0) : 0,
        })
      } catch {
        setData({ totalAlunos: 0, treinosHoje: 0, mensagensNaoLidas: 0, receitaMes: 0 })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cards = [
    { icon: '👥', label: 'Alunos Ativos', value: loading ? '...' : String(data?.totalAlunos ?? 0), color: 'text-brand-400' },
    { icon: '🏋️', label: 'Treinos Hoje', value: loading ? '...' : String(data?.treinosHoje ?? 0), color: 'text-blue-400' },
    { icon: '💬', label: 'Mensagens', value: loading ? '...' : String(data?.mensagensNaoLidas ?? 0), color: 'text-purple-400' },
    { icon: '💰', label: 'Receita Mensal', value: loading ? '...' : `R$ ${(data?.receitaMes ?? 0).toFixed(2)}`, color: 'text-green-400' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Olá, {user.nome.split(' ')[0]} 👋</h1>
      <p className="text-gray-400 mb-8">Bem-vindo ao painel do {tenant.nome || 'WazeFit'}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-gray-800/30 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-sm text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {!loading && data?.totalAlunos === 0 && (
        <div className="mt-8 bg-gray-800/20 border border-gray-800 rounded-xl p-8 text-center">
          <span className="text-4xl mb-4 block">🚀</span>
          <h2 className="text-lg font-semibold mb-2">Comece agora!</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Cadastre seu primeiro aluno, crie exercícios e monte fichas de treino personalizadas.
          </p>
        </div>
      )}
    </div>
  )
}
