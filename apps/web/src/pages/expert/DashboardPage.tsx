/**
 * Dashboard do Expert — com design system moderno.
 */
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import type { User, Tenant } from '../../stores/auth'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Users, Dumbbell, MessageSquare, DollarSign, TrendingUp, Calendar } from 'lucide-react'

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
    { 
      icon: Users, 
      label: 'Alunos Ativos', 
      value: loading ? '...' : String(data?.totalAlunos ?? 0), 
      bgColor: 'bg-brand-500/10',
      iconColor: 'text-brand-400',
    },
    { 
      icon: Dumbbell, 
      label: 'Treinos Hoje', 
      value: loading ? '...' : String(data?.treinosHoje ?? 0), 
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
    },
    { 
      icon: MessageSquare, 
      label: 'Mensagens', 
      value: loading ? '...' : String(data?.mensagensNaoLidas ?? 0), 
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
    },
    { 
      icon: DollarSign, 
      label: 'Receita Mensal', 
      value: loading ? '...' : `R$ ${(data?.receitaMes ?? 0).toFixed(2)}`, 
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-400',
    },
  ]

  return (
    <div>
      <PageHeader
        title={`Olá, ${user.nome.split(' ')[0]} 👋`}
        description={`Bem-vindo ao painel do ${tenant.nome || 'WazeFit'}`}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="p-6 hover:border-dark-700 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${card.iconColor} mb-1`}>{card.value}</p>
              <p className="text-sm text-gray-400">{card.label}</p>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {!loading && data?.totalAlunos === 0 && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-brand-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Comece agora!</h2>
            <p className="text-gray-400 mb-6">
              Cadastre seu primeiro aluno, crie exercícios e monte fichas de treino personalizadas.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="primary">Adicionar Aluno</Button>
              <Button variant="outline">Ver Tutorial</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      {!loading && data && data.totalAlunos > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-400" />
              Atividades Recentes
            </h3>
            <p className="text-sm text-gray-400">
              Nenhuma atividade recente para exibir.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-400" />
              Metas do Mês
            </h3>
            <p className="text-sm text-gray-400">
              Configure suas metas mensais.
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}
