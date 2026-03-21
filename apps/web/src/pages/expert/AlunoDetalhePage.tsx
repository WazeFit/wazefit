import { useState, useEffect, useCallback } from 'react'
import { api, type Aluno, type EvolucaoData, ApiError } from '../../lib/api'
import { Tabs } from '../../components/ui/Tabs'
import { Badge } from '../../components/ui/Badge'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/ui/Toast'
import { CalendarioPage } from './CalendarioPage'
import { ChatInline } from './ChatInline'

interface Props {
  alunoId: string
}

export function AlunoDetalhePage({ alunoId }: Props) {
  const { toast } = useToast()
  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [evolucao, setEvolucao] = useState<EvolucaoData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [a, ev] = await Promise.all([
        api.alunos.get(alunoId),
        api.evolucao.get(alunoId, 30).catch(() => null),
      ])
      setAluno(a)
      setEvolucao(ev)
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar aluno')
    } finally {
      setLoading(false)
    }
  }, [alunoId, toast])

  useEffect(() => { load() }, [load])

  if (loading) return <PageLoader />
  if (!aluno) return <div className="text-center py-12 text-gray-500">Aluno não encontrado</div>

  const statusVariant = aluno.status === 'ativo' ? 'success' : aluno.status === 'inativo' ? 'danger' : 'warning'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold">
          {aluno.nome.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{aluno.nome}</h1>
            <Badge variant={statusVariant}>{aluno.status}</Badge>
          </div>
          <p className="text-gray-400 text-sm">{aluno.email}</p>
          {aluno.telefone && <p className="text-gray-500 text-xs">{aluno.telefone}</p>}
        </div>
      </div>

      {/* Stats */}
      {evolucao && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Treinos" value={String(evolucao.total_treinos)} icon="🏋️" />
          <StatCard label="Freq. Semanal" value={`${evolucao.frequencia_semanal}x`} icon="📊" />
          <StatCard label="Sequência Atual" value={`${evolucao.sequencia_atual} dias`} icon="🔥" />
          <StatCard label="Últimos 30 dias" value={`${evolucao.historico.filter((h) => h.treinou).length} treinos`} icon="📅" />
        </div>
      )}

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'calendario',
            label: '📅 Calendário',
            content: <CalendarioPage alunoId={alunoId} alunoNome={aluno.nome} />,
          },
          {
            id: 'evolucao',
            label: '📊 Evolução',
            content: evolucao ? <EvolucaoPanel data={evolucao} /> : <p className="text-gray-500">Sem dados de evolução</p>,
          },
          {
            id: 'chat',
            label: '💬 Chat',
            content: <ChatInline alunoId={alunoId} />,
          },
        ]}
      />
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  )
}

function EvolucaoPanel({ data }: { data: EvolucaoData }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-300 mb-3">Últimos 30 dias</h3>
      <div className="flex flex-wrap gap-1">
        {data.historico.map((h) => (
          <div
            key={h.data}
            title={`${h.data}: ${h.treinou ? 'Treinou' : 'Não treinou'}`}
            className={`w-6 h-6 rounded-sm ${h.treinou ? 'bg-green-500' : 'bg-gray-800'}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-sm" /> Treinou</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-800 rounded-sm" /> Descanso</span>
      </div>
    </div>
  )
}
