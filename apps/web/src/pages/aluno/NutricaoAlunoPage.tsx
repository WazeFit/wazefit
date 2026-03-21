import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { EmptyState } from '../../components/ui/EmptyState'

interface Alimento {
  id: string
  nome: string
  quantidade: number
  unidade: string
  calorias: number
  proteina_g: number
  carboidrato_g: number
  gordura_g: number
}

interface Refeicao {
  id: string
  nome: string
  horario: string | null
  ordem: number
  alimentos: Alimento[]
}

interface PlanoNutricional {
  id: string
  nome: string
  objetivo: string | null
  calorias_diarias: number | null
  proteina_g: number | null
  carboidrato_g: number | null
  gordura_g: number | null
  observacoes: string | null
  ativo: boolean
  refeicoes?: Refeicao[]
}

export function NutricaoAlunoPage() {
  const [plano, setPlano] = useState<PlanoNutricional | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPlano()
  }, [])

  async function loadPlano() {
    try {
      setLoading(true)
      const res = await api.get<{ data: PlanoNutricional[] }>('/api/v1/nutricao/planos?ativo=true')
      const planos = res.data || []
      if (planos.length > 0) {
        const detail = await api.get<PlanoNutricional>(`/api/v1/nutricao/planos/${planos[0]!.id}`)
        setPlano(detail)
      }
    } catch (err) {
      setError('Erro ao carregar plano nutricional.')
    } finally {
      setLoading(false)
    }
  }

  function calcRefeicaoTotals(alimentos: Alimento[]) {
    return alimentos.reduce(
      (acc, a) => ({
        calorias: acc.calorias + (a.calorias || 0),
        proteina: acc.proteina + (a.proteina_g || 0),
        carb: acc.carb + (a.carboidrato_g || 0),
        gordura: acc.gordura + (a.gordura_g || 0),
      }),
      { calorias: 0, proteina: 0, carb: 0, gordura: 0 },
    )
  }

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>

  if (!plano) {
    return (
      <EmptyState
        icon="🥗"
        title="Nenhum plano nutricional"
        description="Seu profissional ainda não criou um plano nutricional para você."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{plano.nome}</h1>
        {plano.objetivo && <p className="text-gray-500 mt-1">{plano.objetivo}</p>}
      </div>

      {/* Macros do dia */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{plano.calorias_diarias || 0}</p>
          <p className="text-xs text-gray-500">kcal/dia</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{plano.proteina_g || 0}g</p>
          <p className="text-xs text-gray-500">Proteína</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{plano.carboidrato_g || 0}g</p>
          <p className="text-xs text-gray-500">Carboidrato</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{plano.gordura_g || 0}g</p>
          <p className="text-xs text-gray-500">Gordura</p>
        </div>
      </div>

      {/* Refeições */}
      {(plano.refeicoes || []).sort((a, b) => a.ordem - b.ordem).map((ref) => {
        const totals = calcRefeicaoTotals(ref.alimentos || [])
        return (
          <Card key={ref.id}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{ref.nome}</h3>
                  {ref.horario && <span className="text-sm text-gray-500">{ref.horario}</span>}
                </div>
                <Badge variant="info">{totals.calorias} kcal</Badge>
              </div>

              {(ref.alimentos || []).length === 0 ? (
                <p className="text-sm text-gray-400">Sem alimentos cadastrados</p>
              ) : (
                <div className="space-y-2">
                  {ref.alimentos.map((al) => (
                    <div key={al.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                      <div>
                        <span className="text-gray-900">{al.nome}</span>
                        <span className="text-gray-400 ml-2">
                          {al.quantidade} {al.unidade}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-x-2">
                        <span>{al.calorias}kcal</span>
                        <span className="text-blue-500">P:{al.proteina_g}g</span>
                        <span className="text-yellow-500">C:{al.carboidrato_g}g</span>
                        <span className="text-red-500">G:{al.gordura_g}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end text-xs text-gray-500 space-x-3">
                <span>P: {totals.proteina}g</span>
                <span>C: {totals.carb}g</span>
                <span>G: {totals.gordura}g</span>
              </div>
            </div>
          </Card>
        )
      })}

      {plano.observacoes && (
        <Card>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Observações</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{plano.observacoes}</p>
          </div>
        </Card>
      )}
    </div>
  )
}
