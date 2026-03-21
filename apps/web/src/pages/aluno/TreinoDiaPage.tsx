import { useState, useEffect, useCallback } from 'react'
import { api, type TreinoHoje, ApiError } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { getSavedUser } from '../../stores/auth'

export function TreinoDiaPage() {
  const { toast } = useToast()
  const [treino, setTreino] = useState<TreinoHoje | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const user = getSavedUser()

  const load = useCallback(async () => {
    if (!user) return
    try {
      setTreino(await api.treino.hoje(user.id))
    } catch (err) {
      if (err instanceof ApiError && err.status !== 404) {
        toast('error', 'Erro ao carregar treino')
      }
    } finally {
      setLoading(false)
    }
  }, [user, toast])

  useEffect(() => { load() }, [load])

  async function handleCheckIn() {
    if (!treino?.ficha) return
    setCheckingIn(true)
    try {
      await api.execucoes.create({ ficha_id: treino.ficha.id })
      toast('success', 'Check-in realizado! 💪')
      setCheckedIn(true)
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro no check-in')
    } finally {
      setCheckingIn(false)
    }
  }

  if (loading) return <PageLoader />

  if (!treino?.ficha) {
    return (
      <EmptyState
        icon="😴"
        title={treino?.mensagem ?? 'Dia de descanso'}
        description="Nenhum treino programado para hoje. Aproveite para descansar!"
      />
    )
  }

  const ficha = treino.ficha

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <Badge variant="success">{treino.dia_semana}</Badge>
        <h1 className="text-2xl font-bold mt-2">{ficha.nome}</h1>
        {ficha.descricao && <p className="text-gray-400 text-sm mt-1">{ficha.descricao}</p>}
      </div>

      <div className="space-y-3 mb-6">
        {ficha.exercicios.map((ex) => (
          <div key={ex.exercicio_id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-white">{ex.exercicio?.nome ?? ex.exercicio_id}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {ex.series} séries × {ex.repeticoes} reps · {ex.descanso_seg}s descanso
                </p>
                {ex.observacoes && <p className="text-xs text-gray-500 mt-1">{ex.observacoes}</p>}
              </div>
              <span className="text-xs text-gray-600 shrink-0">#{ex.ordem}</span>
            </div>
            {ex.exercicio?.video_url && (
              <a
                href={ex.exercicio.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-green-400 hover:text-green-300"
              >
                ▶ Ver vídeo
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="text-center">
        {checkedIn ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
            <span className="text-4xl">✅</span>
            <p className="text-green-400 font-semibold mt-2">Treino concluído!</p>
          </div>
        ) : (
          <Button size="lg" onClick={handleCheckIn} loading={checkingIn} className="w-full sm:w-auto">
            ✅ Concluir Treino
          </Button>
        )}
      </div>
    </div>
  )
}
