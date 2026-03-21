import { useState, useEffect, useCallback } from 'react'
import { api, type Ficha, type FichaInput, type Exercicio, type FichaExercicio, type Aluno, ApiError } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'

export function FichasPage() {
  const { toast } = useToast()
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [atribuirModal, setAtribuirModal] = useState<string | null>(null)
  const [editing, setEditing] = useState<Ficha | null>(null)
  const [saving, setSaving] = useState(false)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState('treino')
  const [exerciciosFicha, setExerciciosFicha] = useState<FichaExercicio[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [exerciciosDisp, setExerciciosDisp] = useState<Exercicio[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [alunoSel, setAlunoSel] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await api.fichas.list()
      setFichas(data)
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar fichas')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  async function openNew() {
    setEditing(null)
    setNome('')
    setDescricao('')
    setTipo('treino')
    setExerciciosFicha([])
    setErrors({})
    try { setExerciciosDisp(await api.exercicios.list()) } catch { /* ignore */ }
    setModalOpen(true)
  }

  async function openEdit(ficha: Ficha) {
    setEditing(ficha)
    setNome(ficha.nome)
    setDescricao(ficha.descricao || '')
    setTipo(ficha.tipo)
    setExerciciosFicha(ficha.exercicios)
    setErrors({})
    try { setExerciciosDisp(await api.exercicios.list()) } catch { /* ignore */ }
    setModalOpen(true)
  }

  function addExercicio(exercicioId: string) {
    if (exerciciosFicha.some((e) => e.exercicio_id === exercicioId)) return
    const ex = exerciciosDisp.find((e) => e.id === exercicioId)
    setExerciciosFicha((prev) => [...prev, {
      exercicio_id: exercicioId, series: 3, repeticoes: '12', descanso_seg: 60, ordem: prev.length + 1, exercicio: ex,
    }])
  }

  function removeExercicio(exercicioId: string) {
    setExerciciosFicha((prev) => prev.filter((e) => e.exercicio_id !== exercicioId).map((e, i) => ({ ...e, ordem: i + 1 })))
  }

  function updateExField(exercicioId: string, field: keyof FichaExercicio, value: string | number) {
    setExerciciosFicha((prev) => prev.map((e) => (e.exercicio_id === exercicioId ? { ...e, [field]: value } : e)))
  }

  function moveExercicio(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= exerciciosFicha.length) return
    setExerciciosFicha((prev) => {
      const arr = [...prev]
      const temp = arr[idx]!
      arr[idx] = arr[newIdx]!
      arr[newIdx] = temp
      return arr.map((e, i) => ({ ...e, ordem: i + 1 }))
    })
  }

  async function handleSave() {
    const e: Record<string, string> = {}
    if (!nome.trim()) e['nome'] = 'Nome obrigatório'
    if (exerciciosFicha.length === 0) e['exercicios'] = 'Adicione pelo menos um exercício'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setSaving(true)
    try {
      const data: FichaInput = {
        nome: nome.trim(), descricao: descricao.trim() || undefined, tipo,
        exercicios: exerciciosFicha.map(({ exercicio_id, series, repeticoes, descanso_seg, ordem, observacoes }) => ({
          exercicio_id, series, repeticoes, descanso_seg, ordem, observacoes,
        })),
      }
      if (editing) {
        await api.fichas.update(editing.id, data)
        toast('success', 'Ficha atualizada')
      } else {
        await api.fichas.create(data)
        toast('success', 'Ficha criada')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta ficha?')) return
    try {
      await api.fichas.delete(id)
      toast('success', 'Ficha excluída')
      load()
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao excluir')
    }
  }

  async function openAtribuir(fichaId: string) {
    setAtribuirModal(fichaId)
    setAlunoSel('')
    try { setAlunos((await api.alunos.list(1, 100)).data) } catch { /* ignore */ }
  }

  async function handleAtribuir() {
    if (!atribuirModal || !alunoSel) return
    setSaving(true)
    try {
      await api.fichas.atribuir(atribuirModal, alunoSel)
      toast('success', 'Ficha atribuída ao aluno')
      setAtribuirModal(null)
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao atribuir')
    } finally { setSaving(false) }
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Fichas de Treino</h1>
          <p className="text-gray-400 text-sm">{fichas.length} ficha(s)</p>
        </div>
        <Button onClick={openNew}>+ Nova Ficha</Button>
      </div>

      {fichas.length === 0 ? (
        <EmptyState icon="📋" title="Nenhuma ficha" description="Crie sua primeira ficha de treino." action={<Button onClick={openNew}>Criar ficha</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fichas.map((ficha) => (
            <div key={ficha.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-white text-lg">{ficha.nome}</h3>
                <Badge variant="info">{ficha.tipo}</Badge>
              </div>
              {ficha.descricao && <p className="text-sm text-gray-400 mb-3">{ficha.descricao}</p>}
              <p className="text-xs text-gray-500 mb-4">{ficha.exercicios.length} exercício(s)</p>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="ghost" onClick={() => openEdit(ficha)}>Editar</Button>
                <Button size="sm" variant="secondary" onClick={() => openAtribuir(ficha.id)}>Atribuir</Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(ficha.id)}>🗑</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Ficha' : 'Nova Ficha'} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} error={errors['nome']} placeholder="Ex: Treino A - Peito" />
            <Select label="Tipo" options={[{ value: 'treino', label: 'Treino' }, { value: 'aquecimento', label: 'Aquecimento' }, { value: 'alongamento', label: 'Alongamento' }]} value={tipo} onChange={(e) => setTipo(e.target.value)} />
          </div>
          <Textarea label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição da ficha..." />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Adicionar Exercício</label>
            <Select
              options={exerciciosDisp.filter((e) => !exerciciosFicha.some((f) => f.exercicio_id === e.id)).map((e) => ({ value: e.id, label: `${e.nome} (${e.grupo_muscular})` }))}
              placeholder="Selecione um exercício..."
              value=""
              onChange={(e) => { if (e.target.value) addExercicio(e.target.value) }}
            />
            {errors['exercicios'] && <p className="mt-1 text-xs text-red-400">{errors['exercicios']}</p>}
          </div>
          {exerciciosFicha.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-300">Exercícios na ficha</p>
              {exerciciosFicha.map((ex, idx) => (
                <div key={ex.exercicio_id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{ex.ordem}. {ex.exercicio?.nome ?? ex.exercicio_id}</span>
                    <div className="flex gap-1">
                      <button onClick={() => moveExercicio(idx, -1)} className="text-xs text-gray-500 hover:text-white px-1" disabled={idx === 0}>↑</button>
                      <button onClick={() => moveExercicio(idx, 1)} className="text-xs text-gray-500 hover:text-white px-1" disabled={idx === exerciciosFicha.length - 1}>↓</button>
                      <button onClick={() => removeExercicio(ex.exercicio_id)} className="text-xs text-red-400 hover:text-red-300 px-1">✕</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input label="Séries" type="number" value={String(ex.series)} onChange={(e) => updateExField(ex.exercicio_id, 'series', parseInt(e.target.value) || 0)} />
                    <Input label="Repetições" value={ex.repeticoes} onChange={(e) => updateExField(ex.exercicio_id, 'repeticoes', e.target.value)} />
                    <Input label="Descanso (s)" type="number" value={String(ex.descanso_seg)} onChange={(e) => updateExField(ex.exercicio_id, 'descanso_seg', parseInt(e.target.value) || 0)} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Salvar' : 'Criar'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!atribuirModal} onClose={() => setAtribuirModal(null)} title="Atribuir Ficha ao Aluno">
        <div className="space-y-4">
          <Select label="Aluno" options={alunos.map((a) => ({ value: a.id, label: a.nome }))} value={alunoSel} onChange={(e) => setAlunoSel(e.target.value)} placeholder="Selecione um aluno..." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAtribuirModal(null)}>Cancelar</Button>
            <Button onClick={handleAtribuir} loading={saving} disabled={!alunoSel}>Atribuir</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
