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
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())
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

  function toggleExercise(exercicioId: string) {
    setCompletedExercises(prev => {
      const next = new Set(prev)
      if (next.has(exercicioId)) {
        next.delete(exercicioId)
      } else {
        next.add(exercicioId)
      }
      return next
    })
  }

  async function handleCheckIn() {
    if (!treino?.ficha) return
    
    // Verificar se todos os exercícios foram marcados
    const totalExercicios = treino.ficha.exercicios.length
    const completados = completedExercises.size
    
    if (completados < totalExercicios) {
      const confirmar = window.confirm(
        `Você completou ${completados} de ${totalExercicios} exercícios. Deseja concluir mesmo assim?`
      )
      if (!confirmar) return
    }

    setCheckingIn(true)
    try {
      await api.execucoes.create({ ficha_id: treino.ficha.id })
      toast('success', '🎉 Treino concluído! Parabéns!')
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
        description="Nenhum treino programado para hoje. Aproveite para descansar e se recuperar!"
      />
    )
  }

  const ficha = treino.ficha
  const totalExercicios = ficha.exercicios.length
  const completados = completedExercises.size
  const progresso = Math.round((completados / totalExercicios) * 100)

  return (
    <div className="max-w-2xl mx-auto pb-6">
      {/* Header */}
      <div className="text-center mb-6">
        <Badge variant="success" className="mb-2">{treino.dia_semana}</Badge>
        <h1 className="text-2xl font-bold">{ficha.nome}</h1>
        {ficha.descricao && <p className="text-gray-400 text-sm mt-1">{ficha.descricao}</p>}
      </div>

      {/* Barra de progresso */}
      {!checkedIn && (
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Progresso</span>
            <span className="text-sm font-semibold text-brand-400">{completados}/{totalExercicios}</span>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      )}

      {/* Lista de exercícios */}
      <div className="space-y-3 mb-6">
        {ficha.exercicios.map((ex) => {
          const isCompleted = completedExercises.has(ex.exercicio_id)
          return (
            <div 
              key={ex.exercicio_id} 
              className={`bg-dark-800/50 border rounded-xl p-4 transition-all ${
                isCompleted 
                  ? 'border-brand-500/30 bg-brand-500/5' 
                  : 'border-dark-700 hover:border-dark-600'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleExercise(ex.exercicio_id)}
                  className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-brand-500 border-brand-500'
                      : 'border-dark-600 hover:border-brand-500/50'
                  }`}
                  disabled={checkedIn}
                >
                  {isCompleted && <span className="text-white text-sm">✓</span>}
                </button>

                {/* Conteúdo */}
                <div className="flex-1">
                  <h3 className={`font-medium transition-colors ${
                    isCompleted ? 'text-gray-500 line-through' : 'text-white'
                  }`}>
                    {ex.exercicio?.nome ?? ex.exercicio_id}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    <span className="font-semibold text-brand-400">{ex.series}×{ex.repeticoes}</span>
                    {' · '}
                    {ex.descanso_seg}s descanso
                  </p>
                  {ex.observacoes && (
                    <p className="text-xs text-gray-500 mt-1.5 italic">💡 {ex.observacoes}</p>
                  )}
                  {ex.exercicio?.video_url && (
                    <a
                      href={ex.exercicio.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      ▶ Ver técnica
                    </a>
                  )}
                </div>

                {/* Número da ordem */}
                <span className="text-xs text-gray-600 shrink-0 font-mono">#{ex.ordem}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Botão de conclusão */}
      <div className="text-center">
        {checkedIn ? (
          <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-6">
            <span className="text-5xl">🎉</span>
            <p className="text-brand-400 font-semibold mt-3 text-lg">Treino concluído!</p>
            <p className="text-gray-400 text-sm mt-1">Ótimo trabalho! Continue assim 💪</p>
          </div>
        ) : (
          <Button 
            size="lg" 
            onClick={handleCheckIn} 
            loading={checkingIn} 
            className="w-full sm:w-auto"
            disabled={completados === 0}
          >
            {completados === totalExercicios ? '✅ Concluir Treino' : `✅ Concluir (${completados}/${totalExercicios})`}
          </Button>
        )}
      </div>
    </div>
  )
}
