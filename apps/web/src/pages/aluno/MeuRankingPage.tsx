import { useState, useEffect } from 'react'
import { api, type RankingEntry, ApiError } from '../../lib/api'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/ui/Toast'
import { getSavedUser } from '../../stores/auth'

export function MeuRankingPage() {
  const { toast } = useToast()
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const user = getSavedUser()

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

  const myEntry = ranking.find((e) => e.aluno_id === user?.id)
  const top10 = ranking.slice(0, 10)
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">🏆 Ranking</h1>

      {/* Minha posição */}
      {myEntry && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 mb-6 text-center">
          <p className="text-sm text-gray-400 mb-1">Sua posição</p>
          <p className="text-4xl font-bold text-green-400">#{myEntry.posicao}</p>
          <p className="text-lg font-semibold text-white mt-1">{myEntry.pontos} pontos</p>
          <p className="text-sm text-gray-500">{myEntry.treinos_semana} treinos/semana</p>
        </div>
      )}

      {/* Top 10 */}
      {top10.length === 0 ? (
        <EmptyState icon="🏆" title="Sem ranking" description="Complete treinos para aparecer no ranking!" />
      ) : (
        <div className="space-y-2">
          {top10.map((entry, idx) => {
            const isMe = entry.aluno_id === user?.id
            return (
              <div
                key={entry.aluno_id}
                className={`flex items-center gap-4 rounded-xl p-4 border ${
                  isMe
                    ? 'bg-green-500/10 border-green-500/30'
                    : idx < 3
                    ? 'bg-yellow-500/5 border-yellow-500/20'
                    : 'bg-gray-900/50 border-gray-800'
                }`}
              >
                <div className="w-8 text-center text-lg font-bold">
                  {idx < 3 ? medals[idx] : <span className="text-gray-500 text-sm">#{entry.posicao}</span>}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${isMe ? 'text-green-400' : 'text-white'}`}>
                    {entry.nome} {isMe && '(você)'}
                  </p>
                </div>
                <p className="font-bold text-white">{entry.pontos} pts</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
