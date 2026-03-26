import { useState, useEffect } from 'react'
import { api, type RankingEntry, ApiError } from '../../lib/api'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
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
      setLoading(true)
      try {
        const data = await api.ranking.list()
        setRanking(data)
      } catch (err) {
        toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar ranking')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [toast])

  if (loading) return <PageLoader />

  const minhaPosicao = ranking.findIndex(r => r.aluno_id === user?.id)
  const meuItem = minhaPosicao >= 0 ? ranking[minhaPosicao] : null

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">🏆 Ranking</h1>
        <p className="text-gray-400 text-sm">Veja sua posição entre todos os alunos</p>
      </div>



      {/* Minha posição (destaque) */}
      {meuItem && (
        <Card className="border-brand-500/30 bg-brand-500/5">
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-emerald-500 rounded-full flex items-center justify-center text-xl font-bold shadow-glow">
                  {meuItem.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">Você</p>
                  <p className="text-xs text-gray-400">{meuItem.treinos_semana} treinos esta semana</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-brand-400">#{minhaPosicao + 1}</p>
                <p className="text-xs text-gray-500">Posição</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Pódio (Top 3) */}
      {ranking.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* 2º lugar */}
          <PodioCard item={ranking[1]!} posicao={2} />
          {/* 1º lugar */}
          <PodioCard item={ranking[0]!} posicao={1} destaque />
          {/* 3º lugar */}
          <PodioCard item={ranking[2]!} posicao={3} />
        </div>
      )}

      {/* Lista completa */}
      <Card>
        <CardBody>
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Classificação Completa</h2>
          <div className="space-y-2">
            {ranking.slice(3).map((item, index) => {
              const posicao = index + 4
              const isMe = item.aluno_id === user?.id
              return (
                <div
                  key={item.aluno_id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isMe 
                      ? 'bg-brand-500/10 border border-brand-500/20' 
                      : 'bg-dark-800/50 hover:bg-dark-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-600 w-6 text-center">
                      {posicao}
                    </span>
                    <div className="w-10 h-10 bg-dark-700 rounded-full flex items-center justify-center text-sm font-bold">
                      {item.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`font-medium ${isMe ? 'text-brand-400' : 'text-white'}`}>
                        {item.nome}
                        {isMe && <span className="text-xs ml-2">(você)</span>}
                      </p>
                      <p className="text-xs text-gray-500">{item.treinos_semana} treinos</p>
                    </div>
                  </div>
                  <Badge variant="default" className="text-xs">
                    {item.pontos} pts
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {ranking.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">🏃</p>
          <p className="text-sm">Nenhum treino registrado ainda.</p>
          <p className="text-xs text-gray-600 mt-1">Complete seu primeiro treino para aparecer no ranking!</p>
        </div>
      )}
    </div>
  )
}

function PodioCard({ 
  item, 
  posicao, 
  destaque = false 
}: { 
  item: RankingEntry
  posicao: number
  destaque?: boolean 
}) {
  const medalhas = { 1: '🥇', 2: '🥈', 3: '🥉' }
  const cores = {
    1: 'from-yellow-500 to-amber-500',
    2: 'from-gray-400 to-gray-500',
    3: 'from-orange-600 to-orange-700',
  }

  return (
    <div className={`${destaque ? 'col-span-1 -mt-4' : ''}`}>
      <Card className={`text-center ${destaque ? 'border-brand-500/30 shadow-glow' : ''}`}>
        <CardBody className="space-y-2">
          <div className="text-3xl">{medalhas[posicao as keyof typeof medalhas]}</div>
          <div 
            className={`w-16 h-16 mx-auto bg-gradient-to-br ${cores[posicao as keyof typeof cores]} rounded-full flex items-center justify-center text-xl font-bold shadow-lg`}
          >
            {item.nome.charAt(0).toUpperCase()}
          </div>
          <p className="font-semibold text-white text-sm truncate">{item.nome}</p>
          <p className="text-xs text-gray-500">{item.treinos_semana} treinos</p>
          <Badge variant="default" className="text-xs">
            {item.pontos} pts
          </Badge>
        </CardBody>
      </Card>
    </div>
  )
}
