import { useState, useEffect } from 'react'
import { api, type RankingEntry, ApiError } from '../../lib/api'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/ui/Toast'

export function RankingPage() {
  const { toast } = useToast()
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setRanking(await api.ranking.list())
      } catch (err) {
        toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar ranking')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [toast])

  if (loading) return <PageLoader />

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Ranking</h1>
        <p className="text-gray-400 text-sm">Classificação dos alunos por pontos</p>
      </div>

      {ranking.length === 0 ? (
        <EmptyState icon="🏆" title="Sem ranking" description="O ranking será gerado quando alunos fizerem check-in nos treinos." />
      ) : (
        <div className="space-y-2">
          {ranking.map((entry, idx) => (
            <div
              key={entry.aluno_id}
              className={`flex items-center gap-4 rounded-xl p-4 border transition-colors ${
                idx < 3
                  ? 'bg-yellow-500/5 border-yellow-500/20'
                  : 'bg-gray-900/50 border-gray-800'
              }`}
            >
              <div className="w-10 h-10 flex items-center justify-center text-xl font-bold shrink-0">
                {idx < 3 ? medals[idx] : <span className="text-gray-500 text-sm">#{entry.posicao}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{entry.nome}</p>
                <p className="text-xs text-gray-500">{entry.treinos_semana} treinos/semana</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-green-400">{entry.pontos}</p>
                <p className="text-xs text-gray-500">pontos</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
