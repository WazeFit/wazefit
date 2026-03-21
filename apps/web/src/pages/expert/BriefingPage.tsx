/**
 * BriefingPage — Briefing conversacional com IA.
 * Lista briefings, cria novos, visualiza perguntas/respostas.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { api, ApiError } from '../../lib/api'
import type { Briefing, BriefingDetail, Aluno } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'

interface Props {
  briefingId?: string
  onNavigate?: (path: string) => void
}

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
  pendente: { label: 'Pendente', variant: 'warning' },
  gerando: { label: 'Gerando...', variant: 'info' },
  aguardando_respostas: { label: 'Aguardando Respostas', variant: 'warning' },
  completo: { label: 'Completo', variant: 'success' },
  erro: { label: 'Erro', variant: 'danger' },
}

export function BriefingPage({ briefingId, onNavigate }: Props) {
  if (briefingId) {
    return <BriefingDetailView id={briefingId} onBack={() => onNavigate?.('/expert/briefings')} />
  }
  return <BriefingList onNavigate={onNavigate} />
}

// ── Lista de Briefings ──

function BriefingList({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const [briefings, setBriefings] = useState<Briefing[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAluno, setSelectedAluno] = useState('')
  const [creating, setCreating] = useState(false)
  const [filterAluno, setFilterAluno] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [b, a] = await Promise.all([
        api.briefings.list(filterAluno || undefined),
        api.alunos.list(1, 100),
      ])
      setBriefings(b)
      setAlunos(a.data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar briefings')
    } finally {
      setLoading(false)
    }
  }, [filterAluno])

  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!selectedAluno) return
    try {
      setCreating(true)
      const detail = await api.briefings.create(selectedAluno)
      onNavigate?.(`/expert/briefings/${detail.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar briefing')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Briefing IA</h1>
          <p className="text-sm text-gray-400 mt-1">Crie briefings conversacionais para entender seus alunos</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>
      )}

      {/* Criar novo briefing */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <Select
                label="Novo Briefing para Aluno"
                placeholder="Selecione um aluno..."
                options={alunos.map(a => ({ value: a.id, label: a.nome }))}
                value={selectedAluno}
                onChange={e => setSelectedAluno(e.target.value)}
              />
            </div>
            <Button onClick={handleCreate} loading={creating} disabled={!selectedAluno}>
              🤖 Criar Briefing
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Filtro */}
      <div className="flex gap-3">
        <Select
          placeholder="Filtrar por aluno..."
          options={[{ value: '', label: 'Todos os alunos' }, ...alunos.map(a => ({ value: a.id, label: a.nome }))]}
          value={filterAluno}
          onChange={e => setFilterAluno(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Lista */}
      {briefings.length === 0 ? (
        <EmptyState
          icon="🤖"
          title="Nenhum briefing encontrado"
          description="Crie um briefing para começar a entender melhor seus alunos com IA"
        />
      ) : (
        <div className="grid gap-3">
          {briefings.map(b => (
            <Card key={b.id} className="hover:border-green-500/30 transition-colors cursor-pointer"
              onClick={() => onNavigate?.(`/expert/briefings/${b.id}`)}>
              <CardBody className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{b.aluno_nome}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(b.created_at).toLocaleDateString('pt-BR')} · {b.respostas_count}/{b.total_perguntas} respostas
                  </p>
                </div>
                <Badge variant={STATUS_MAP[b.status]?.variant ?? 'info'}>
                  {STATUS_MAP[b.status]?.label ?? b.status}
                </Badge>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Detalhe do Briefing ──

function BriefingDetailView({ id, onBack }: { id: string; onBack?: () => void }) {
  const [briefing, setBriefing] = useState<BriefingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    try {
      const detail = await api.briefings.get(id)
      setBriefing(detail)
      if (detail.status === 'gerando') {
        startPolling()
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar briefing')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function startPolling() {
    if (pollingRef.current) return
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.briefings.status(id)
        if (res.status !== 'gerando') {
          if (pollingRef.current) clearInterval(pollingRef.current)
          pollingRef.current = null
          const detail = await api.briefings.get(id)
          setBriefing(detail)
          setGenerating(false)
        }
      } catch {
        // ignore polling errors
      }
    }, 2000)
  }

  useEffect(() => {
    load()
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [load])

  async function handleGerar() {
    try {
      setGenerating(true)
      await api.briefings.gerar(id)
      startPolling()
      setBriefing(prev => prev ? { ...prev, status: 'gerando' } : prev)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao gerar perguntas')
      setGenerating(false)
    }
  }

  async function handleResponder(perguntaId: string) {
    const resposta = answers[perguntaId]
    if (!resposta?.trim()) return
    try {
      setSubmitting(perguntaId)
      await api.briefings.responder(id, perguntaId, resposta.trim())
      setBriefing(prev => {
        if (!prev) return prev
        return {
          ...prev,
          perguntas: prev.perguntas.map(p =>
            p.id === perguntaId ? { ...p, resposta: resposta.trim() } : p
          ),
        }
      })
      setAnswers(prev => {
        const next = { ...prev }
        delete next[perguntaId]
        return next
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao enviar resposta')
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) return <PageLoader />
  if (!briefing) return <EmptyState icon="❌" title="Briefing não encontrado" />

  const isGenerating = briefing.status === 'gerando' || generating

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
          ← Voltar
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Briefing — {briefing.aluno_nome}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Criado em {new Date(briefing.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <Badge variant={STATUS_MAP[briefing.status]?.variant ?? 'info'}>
          {STATUS_MAP[briefing.status]?.label ?? briefing.status}
        </Badge>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>
      )}

      {/* Ação: Gerar perguntas */}
      {briefing.status === 'pendente' && (
        <Card>
          <CardBody className="text-center py-8">
            <p className="text-gray-400 mb-4">Clique para gerar perguntas personalizadas com IA</p>
            <Button onClick={handleGerar} loading={isGenerating} size="lg">
              🤖 Gerar Perguntas com IA
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Gerando... */}
      {isGenerating && (
        <Card>
          <CardBody className="text-center py-8">
            <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">A IA está gerando perguntas personalizadas...</p>
            <p className="text-xs text-gray-600 mt-1">Isso pode levar alguns segundos</p>
          </CardBody>
        </Card>
      )}

      {/* Perguntas e respostas (chat-like) */}
      {briefing.perguntas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Perguntas</h2>
          {briefing.perguntas.map(p => (
            <Card key={p.id}>
              <CardBody className="space-y-3">
                {/* Pergunta da IA */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                    🤖
                  </div>
                  <div className="bg-gray-800 rounded-lg rounded-tl-none px-4 py-2.5 flex-1">
                    <p className="text-sm text-white">{p.texto}</p>
                  </div>
                </div>

                {/* Resposta do aluno */}
                {p.resposta ? (
                  <div className="flex gap-3 justify-end">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg rounded-tr-none px-4 py-2.5 max-w-[80%]">
                      <p className="text-sm text-green-300">{p.resposta}</p>
                    </div>
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                      👤
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Textarea
                        placeholder="Digite a resposta do aluno..."
                        value={answers[p.id] ?? ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [p.id]: e.target.value }))}
                        rows={2}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleResponder(p.id)}
                      loading={submitting === p.id}
                      disabled={!answers[p.id]?.trim()}
                    >
                      Enviar
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Análise da IA */}
      {briefing.analise && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">📊 Análise da IA</h2>
          </CardHeader>
          <CardBody>
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-gray-300 whitespace-pre-wrap">{briefing.analise}</p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}