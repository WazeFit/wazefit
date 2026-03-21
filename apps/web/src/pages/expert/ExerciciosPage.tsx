import { useState, useEffect, useCallback } from 'react'
import { api, type Exercicio, type ExercicioInput, ApiError } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'

const GRUPOS = [
  'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps',
  'Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha', 'Abdômen', 'Cardio', 'Outro',
]

const grupoOptions = GRUPOS.map((g) => ({ value: g, label: g }))

export function ExerciciosPage() {
  const { toast } = useToast()
  const [exercicios, setExercicios] = useState<Exercicio[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Exercicio | null>(null)
  const [saving, setSaving] = useState(false)

  // Form
  const [nome, setNome] = useState('')
  const [grupo, setGrupo] = useState('')
  const [equipamento, setEquipamento] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [instrucoes, setInstrucoes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    try {
      const data = await api.exercicios.list(filtro || undefined)
      setExercicios(data)
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar exercícios')
    } finally {
      setLoading(false)
    }
  }, [filtro, toast])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditing(null)
    setNome('')
    setGrupo('')
    setEquipamento('')
    setVideoUrl('')
    setInstrucoes('')
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(ex: Exercicio) {
    setEditing(ex)
    setNome(ex.nome)
    setGrupo(ex.grupo_muscular)
    setEquipamento(ex.equipamento || '')
    setVideoUrl(ex.video_url || '')
    setInstrucoes(ex.instrucoes || '')
    setErrors({})
    setModalOpen(true)
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!nome.trim()) e['nome'] = 'Nome obrigatório'
    if (!grupo) e['grupo'] = 'Selecione um grupo muscular'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      const data: ExercicioInput = {
        nome: nome.trim(),
        grupo_muscular: grupo,
        equipamento: equipamento.trim() || undefined,
        video_url: videoUrl.trim() || undefined,
        instrucoes: instrucoes.trim() || undefined,
      }
      if (editing) {
        await api.exercicios.update(editing.id, data)
        toast('success', 'Exercício atualizado')
      } else {
        await api.exercicios.create(data)
        toast('success', 'Exercício criado')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este exercício?')) return
    try {
      await api.exercicios.delete(id)
      toast('success', 'Exercício excluído')
      load()
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao excluir')
    }
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Exercícios</h1>
          <p className="text-gray-400 text-sm">{exercicios.length} exercício(s) cadastrado(s)</p>
        </div>
        <div className="flex gap-2">
          <Select
            options={grupoOptions}
            placeholder="Todos os grupos"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-44"
          />
          <Button onClick={openNew}>+ Novo</Button>
        </div>
      </div>

      {exercicios.length === 0 ? (
        <EmptyState
          icon="🏋️"
          title="Nenhum exercício"
          description="Crie seu primeiro exercício para montar fichas de treino."
          action={<Button onClick={openNew}>Criar exercício</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercicios.map((ex) => (
            <div key={ex.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-white">{ex.nome}</h3>
                <Badge variant="info">{ex.grupo_muscular}</Badge>
              </div>
              {ex.equipamento && <p className="text-xs text-gray-500 mb-2">🔧 {ex.equipamento}</p>}
              {ex.instrucoes && <p className="text-sm text-gray-400 line-clamp-2 mb-3">{ex.instrucoes}</p>}
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(ex)}>Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(ex.id)}>🗑</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Exercício' : 'Novo Exercício'}>
        <div className="space-y-4">
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} error={errors['nome']} placeholder="Ex: Supino reto" />
          <Select label="Grupo Muscular" options={grupoOptions} value={grupo} onChange={(e) => setGrupo(e.target.value)} error={errors['grupo']} placeholder="Selecione..." />
          <Input label="Equipamento" value={equipamento} onChange={(e) => setEquipamento(e.target.value)} placeholder="Ex: Barra, Halter" />
          <Input label="URL do Vídeo" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." />
          <Textarea label="Instruções" value={instrucoes} onChange={(e) => setInstrucoes(e.target.value)} placeholder="Dicas de execução..." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Salvar' : 'Criar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
