import { useState, useEffect, useCallback } from 'react'
import { api, type CalendarioData, type Ficha, ApiError } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/ui/Toast'

const DIAS = [
  { key: 'segunda', label: 'Segunda' },
  { key: 'terca', label: 'Terça' },
  { key: 'quarta', label: 'Quarta' },
  { key: 'quinta', label: 'Quinta' },
  { key: 'sexta', label: 'Sexta' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
]

interface Props {
  alunoId: string
  alunoNome?: string
}

export function CalendarioPage({ alunoId, alunoNome }: Props) {
  const { toast } = useToast()
  const [calendario, setCalendario] = useState<CalendarioData>({})
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [cal, fichasList] = await Promise.all([
        api.calendario.get(alunoId),
        api.fichas.list(),
      ])
      setCalendario(cal)
      setFichas(fichasList)
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar calendário')
    } finally {
      setLoading(false)
    }
  }, [alunoId, toast])

  useEffect(() => { load() }, [load])

  function setDia(dia: string, fichaId: string) {
    setCalendario((prev) => ({
      ...prev,
      [dia]: fichaId ? { ficha_id: fichaId } : null,
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.calendario.save(alunoId, calendario)
      toast('success', 'Calendário salvo')
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  const fichaOptions = fichas.map((f) => ({ value: f.id, label: f.nome }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Calendário de Treino</h1>
          {alunoNome && <p className="text-gray-400 text-sm">{alunoNome}</p>}
        </div>
        <Button onClick={handleSave} loading={saving}>Salvar</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {DIAS.map((dia) => {
          const entry = calendario[dia.key]
          return (
            <div key={dia.key} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">{dia.label}</h3>
              <Select
                options={fichaOptions}
                placeholder="Descanso"
                value={entry?.ficha_id ?? ''}
                onChange={(e) => setDia(dia.key, e.target.value)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
