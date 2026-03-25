/**
 * Página de Exercícios — CRUD completo com campos expandidos.
 * Campos: nome, grupo muscular, equipamento, tipo, subtipo, vídeo YT, instruções.
 */
import { useState, useEffect, useCallback } from 'react'
import { api, type Exercicio, type ExercicioInput, type TipoExercicio, ApiError } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { EmptyState } from '../../components/ui/EmptyState'
import { Badge } from '../../components/ui/Badge'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/ui/Toast'
import {
  Plus,
  Search,
  Dumbbell,
  Play,
  Pencil,
  Trash2,
  Filter,
  X,
} from 'lucide-react'

// ── Constantes ──

const GRUPOS = [
  'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps',
  'Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha',
  'Abdômen', 'Cardio', 'Full Body', 'Outro',
]

const EQUIPAMENTOS = [
  'Barra', 'Halter', 'Kettlebell', 'Máquina', 'Cabo/Polia',
  'Chão (peso corporal)', 'Elástico/Banda', 'Bola', 'TRX/Suspensão',
  'Corda', 'Esteira', 'Bicicleta', 'Exercício Livre', 'Outro',
]

const TIPOS_EXERCICIO: { value: TipoExercicio; label: string }[] = [
  { value: 'forca', label: 'Força' },
  { value: 'aerobico', label: 'Aeróbico' },
  { value: 'funcional', label: 'Funcional' },
]

const SUBTIPOS: Record<TipoExercicio, string[]> = {
  forca: ['Hipertrofia', 'Potência', 'Resistência Muscular', 'Isométrico'],
  aerobico: ['Cardio', 'HIIT', 'Baixa Intensidade (LISS)', 'Intervalado'],
  funcional: ['Mobilidade', 'Flexibilidade', 'Dinâmico', 'Core/Estabilização', 'Pliometria'],
}

const grupoOptions = GRUPOS.map((g) => ({ value: g, label: g }))
const equipamentoOptions = EQUIPAMENTOS.map((e) => ({ value: e, label: e }))
const tipoOptions = TIPOS_EXERCICIO.map((t) => ({ value: t.value, label: t.label }))

function getSubtipoOptions(tipo: TipoExercicio | '') {
  if (!tipo) return []
  return (SUBTIPOS[tipo] ?? []).map((s) => ({ value: s, label: s }))
}

// ── Helpers ──

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/,
  )
  return match?.[1] ?? null
}

function getTipoLabel(tipo: string | null): string {
  if (!tipo) return 'Força'
  return TIPOS_EXERCICIO.find((t) => t.value === tipo)?.label ?? tipo
}

function getTipoBadgeVariant(tipo: string | null): 'success' | 'info' | 'warning' {
  if (tipo === 'aerobico') return 'info'
  if (tipo === 'funcional') return 'warning'
  return 'success'
}

// ── Componente Principal ──

export function ExerciciosPage() {
  const { toast } = useToast()
  const [exercicios, setExercicios] = useState<Exercicio[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Exercicio | null>(null)
  const [saving, setSaving] = useState(false)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)

  // Form state
  const [nome, setNome] = useState('')
  const [grupo, setGrupo] = useState('')
  const [equipamento, setEquipamento] = useState('')
  const [tipoExercicio, setTipoExercicio] = useState<TipoExercicio | ''>('')
  const [subtipo, setSubtipo] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [instrucoes, setInstrucoes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ── Load ──

  const load = useCallback(async () => {
    try {
      const data = await api.exercicios.list(busca || undefined, filtroGrupo || undefined)
      setExercicios(data)
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar exercícios')
    } finally {
      setLoading(false)
    }
  }, [busca, filtroGrupo, toast])

  useEffect(() => { load() }, [load])

  function resetForm() {
    setNome(''); setGrupo(''); setEquipamento('')
    setTipoExercicio(''); setSubtipo(''); setVideoUrl('')
    setInstrucoes(''); setErrors({})
  }

  function openNew() { setEditing(null); resetForm(); setModalOpen(true) }

  function openEdit(ex: Exercicio) {
    setEditing(ex); setNome(ex.nome); setGrupo(ex.grupo_muscular)
    setEquipamento(ex.equipamento || '')
    setTipoExercicio((ex.tipo_exercicio as TipoExercicio) || '')
    setSubtipo(ex.subtipo || ''); setVideoUrl(ex.video_url || '')
    setInstrucoes(ex.instrucoes || ''); setErrors({}); setModalOpen(true)
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!nome.trim()) e['nome'] = 'Nome obrigatório'
    if (!grupo) e['grupo'] = 'Selecione um grupo muscular'
    if (videoUrl.trim() && !videoUrl.match(/^https?:\/\//))
      e['video'] = 'URL inválida (deve começar com http ou https)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      const data: ExercicioInput = {
        nome: nome.trim(), grupo_muscular: grupo,
        equipamento: equipamento.trim() || undefined,
        video_url: videoUrl.trim() || undefined,
        instrucoes: instrucoes.trim() || undefined,
        tipo_exercicio: tipoExercicio || undefined,
        subtipo: subtipo.trim() || undefined,
      }
      if (editing) {
        await api.exercicios.update(editing.id, data)
        toast('success', 'Exercício atualizado')
      } else {
        await api.exercicios.create(data)
        toast('success', 'Exercício criado')
      }
      setModalOpen(false); load()
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este exercício?')) return
    try {
      await api.exercicios.delete(id)
      toast('success', 'Exercício excluído'); load()
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao excluir')
    }
  }

  const subtipoOptions = getSubtipoOptions(tipoExercicio)
  function handleTipoChange(v: string) { setTipoExercicio(v as TipoExercicio | ''); setSubtipo('') }

  const previewYtId = videoPreview ? extractYouTubeId(videoPreview) : null
  const formVideoYtId = videoUrl ? extractYouTubeId(videoUrl) : null

  if (loading) return <PageLoader />

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Exercícios</h1>
          <p className="text-gray-400 text-sm">{exercicios.length} exercício(s) cadastrado(s)</p>
        </div>
        <Button onClick={openNew} size="lg">
          <Plus className="w-5 h-5" />
          Novo Exercício
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar exercício..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 items-center">
            <Filter className="w-4 h-4 text-gray-500 hidden sm:block" />
            <Select
              options={grupoOptions}
              placeholder="Todos os grupos"
              value={filtroGrupo}
              onChange={(e) => setFiltroGrupo(e.target.value)}
              className="w-48"
            />
            {filtroGrupo && (
              <button
                onClick={() => setFiltroGrupo('')}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                title="Limpar filtro"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista */}
      {exercicios.length === 0 ? (
        <EmptyState
          icon={<Dumbbell className="w-12 h-12" />}
          title={busca || filtroGrupo ? 'Nenhum exercício encontrado' : 'Nenhum exercício'}
          description={
            busca || filtroGrupo
              ? 'Tente ajustar os filtros ou termos de busca'
              : 'Crie seu primeiro exercício para montar fichas de treino.'
          }
          action={
            !busca && !filtroGrupo
              ? { label: 'Criar Exercício', onClick: openNew }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercicios.map((ex) => {
            const ytId = ex.video_url ? extractYouTubeId(ex.video_url) : null
            return (
              <div
                key={ex.id}
                className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors group"
              >
                {ytId ? (
                  <button
                    onClick={() => setVideoPreview(ex.video_url)}
                    className="relative w-full aspect-video bg-gray-800 overflow-hidden"
                  >
                    <img
                      src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                      alt={ex.nome}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center">
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="w-full h-2 bg-gradient-to-r from-green-500/20 to-green-600/10" />
                )}

                <div className="p-4">
                  <h3 className="font-semibold text-white leading-tight mb-2">{ex.nome}</h3>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <Badge variant="info">{ex.grupo_muscular}</Badge>
                    <Badge variant={getTipoBadgeVariant(ex.tipo_exercicio)}>
                      {getTipoLabel(ex.tipo_exercicio)}
                    </Badge>
                    {ex.subtipo && <Badge variant="default">{ex.subtipo}</Badge>}
                  </div>

                  {ex.equipamento && (
                    <p className="text-xs text-gray-500 mb-1">
                      <span className="text-gray-600">Equipamento:</span> {ex.equipamento}
                    </p>
                  )}
                  {ex.instrucoes && (
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">{ex.instrucoes}</p>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-gray-800">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(ex)} className="flex-1">
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </Button>
                    {ex.video_url && (
                      <Button size="sm" variant="ghost" onClick={() => setVideoPreview(ex.video_url)}>
                        <Play className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="danger" onClick={() => handleDelete(ex.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Criar/Editar */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Exercício' : 'Novo Exercício'}
      >
        <div className="space-y-4">
          <Input
            label="Nome *"
            placeholder="Ex: Supino Reto com Barra"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            error={errors['nome']}
          />

          <Select
            label="Grupo Muscular *"
            options={grupoOptions}
            placeholder="Selecione..."
            value={grupo}
            onChange={(e) => setGrupo(e.target.value)}
            error={errors['grupo']}
          />

          <Select
            label="Equipamento"
            options={equipamentoOptions}
            placeholder="Selecione..."
            value={equipamento}
            onChange={(e) => setEquipamento(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tipo de Exercício"
              options={tipoOptions}
              placeholder="Selecione..."
              value={tipoExercicio}
              onChange={(e) => handleTipoChange(e.target.value)}
            />
            <Select
              label="Subtipo"
              options={subtipoOptions}
              placeholder={tipoExercicio ? 'Selecione...' : 'Escolha o tipo primeiro'}
              value={subtipo}
              onChange={(e) => setSubtipo(e.target.value)}
              disabled={!tipoExercicio}
            />
          </div>

          <div>
            <Input
              label="URL do Vídeo"
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              error={errors['video']}
            />
            {formVideoYtId && (
              <div className="mt-2 rounded-lg overflow-hidden border border-gray-800">
                <img
                  src={`https://img.youtube.com/vi/${formVideoYtId}/mqdefault.jpg`}
                  alt="Preview"
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>

          <Textarea
            label="Instruções"
            placeholder="Orientação de como executar o exercício..."
            value={instrucoes}
            onChange={(e) => setInstrucoes(e.target.value)}
            rows={3}
          />

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              className="flex-1"
            >
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Video Preview */}
      <Modal
        isOpen={!!videoPreview}
        onClose={() => setVideoPreview(null)}
        title="Vídeo do Exercício"
      >
        {previewYtId ? (
          <div className="aspect-video w-full rounded-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${previewYtId}?autoplay=1`}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">
            Não foi possível carregar o vídeo.
          </p>
        )}
      </Modal>
    </div>
  )
}
