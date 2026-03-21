/**
 * GerarIAPage — Geração de treinos e dietas com IA.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { api, ApiError } from '../../lib/api'
import type { Aluno, LLMJob } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { Tabs } from '../../components/ui/Tabs'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'

const JOB_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
  pending: { label: 'Pendente', variant: 'warning' },
  processing: { label: 'Processando...', variant: 'info' },
  completed: { label: 'Completo', variant: 'success' },
  failed: { label: 'Falhou', variant: 'danger' },
}

export function GerarIAPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [jobs, setJobs] = useState<LLMJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [a, j] = await Promise.all([
        api.alunos.list(1, 100),
        api.llm.jobs(),
      ])
      setAlunos(a.data)
      setJobs(j)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Gerar com IA</h1>
        <p className="text-sm text-gray-400 mt-1">Use inteligência artificial para criar treinos e dietas personalizadas</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>
      )}

      <Tabs tabs={[
        {
          id: 'treino',
          label: '🏋️ Gerar Treino',
          content: <GerarTreinoSection alunos={alunos} onJobCreated={load} />,
        },
        {
          id: 'dieta',
          label: '🥗 Gerar Dieta',
          content: <GerarDietaSection alunos={alunos} onJobCreated={load} />,
        },
        {
          id: 'historico',
          label: '📋 Histórico',
          content: <JobsHistorico jobs={jobs} onRefresh={load} />,
        },
      ]} />
    </div>
  )
}

// ── Gerar Treino ──

function GerarTreinoSection({ alunos, onJobCreated }: { alunos: Aluno[]; onJobCreated: () => void }) {
  const [alunoId, setAlunoId] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [nivel, setNivel] = useState('')
  const [diasSemana, setDiasSemana] = useState('3')
  const [observacoes, setObservacoes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [currentJob, setCurrentJob] = useState<LLMJob | null>(null)
  const [error, setError] = useState('')
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [])

  async function handleGerar() {
    if (!alunoId || !objetivo || !nivel) return
    try {
      setGenerating(true)
      setError('')
      setCurrentJob(null)
      const res = await api.llm.gerarTreino({
        aluno_id: alunoId,
        objetivo,
        nivel,
        dias_semana: parseInt(diasSemana),
        observacoes: observacoes || undefined,
      })
      // Start polling
      pollingRef.current = setInterval(async () => {
        try {
          const job = await api.llm.job(res.job_id)
          setCurrentJob(job)
          if (job.status !== 'pending' && job.status !== 'processing') {
            if (pollingRef.current) clearInterval(pollingRef.current)
            pollingRef.current = null
            setGenerating(false)
            onJobCreated()
          }
        } catch {
          // ignore
        }
      }, 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao gerar treino')
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-white">Parâmetros do Treino</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Aluno"
              placeholder="Selecione..."
              options={alunos.map(a => ({ value: a.id, label: a.nome }))}
              value={alunoId}
              onChange={e => setAlunoId(e.target.value)}
            />
            <Select
              label="Objetivo"
              placeholder="Selecione..."
              options={[
                { value: 'hipertrofia', label: 'Hipertrofia' },
                { value: 'emagrecimento', label: 'Emagrecimento' },
                { value: 'forca', label: 'Força' },
                { value: 'resistencia', label: 'Resistência' },
                { value: 'condicionamento', label: 'Condicionamento' },
              ]}
              value={objetivo}
              onChange={e => setObjetivo(e.target.value)}
            />
            <Select
              label="Nível"
              placeholder="Selecione..."
              options={[
                { value: 'iniciante', label: 'Iniciante' },
                { value: 'intermediario', label: 'Intermediário' },
                { value: 'avancado', label: 'Avançado' },
              ]}
              value={nivel}
              onChange={e => setNivel(e.target.value)}
            />
            <Select
              label="Dias por semana"
              options={[
                { value: '2', label: '2 dias' },
                { value: '3', label: '3 dias' },
                { value: '4', label: '4 dias' },
                { value: '5', label: '5 dias' },
                { value: '6', label: '6 dias' },
              ]}
              value={diasSemana}
              onChange={e => setDiasSemana(e.target.value)}
            />
          </div>
          <Textarea
            label="Observações (opcional)"
            placeholder="Ex: foco em membros superiores, tem lesão no joelho..."
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
          />
          <Button onClick={handleGerar} loading={generating} disabled={!alunoId || !objetivo || !nivel}>
            🤖 Gerar Treino com IA
          </Button>
        </CardBody>
      </Card>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>
      )}

      {generating && !currentJob && (
        <Card>
          <CardBody className="text-center py-8">
            <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Gerando treino com IA...</p>
          </CardBody>
        </Card>
      )}

      {currentJob && <JobResult job={currentJob} />}
    </div>
  )
}

// ── Gerar Dieta ──

function GerarDietaSection({ alunos, onJobCreated }: { alunos: Aluno[]; onJobCreated: () => void }) {
  const [alunoId, setAlunoId] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [restricoes, setRestricoes] = useState('')
  const [caloriasAlvo, setCaloriasAlvo] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [currentJob, setCurrentJob] = useState<LLMJob | null>(null)
  const [error, setError] = useState('')
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [])

  async function handleGerar() {
    if (!alunoId || !objetivo) return
    try {
      setGenerating(true)
      setError('')
      setCurrentJob(null)
      const res = await api.llm.gerarDieta({
        aluno_id: alunoId,
        objetivo,
        restricoes: restricoes || undefined,
        calorias_alvo: caloriasAlvo ? parseInt(caloriasAlvo) : undefined,
        observacoes: observacoes || undefined,
      })
      pollingRef.current = setInterval(async () => {
        try {
          const job = await api.llm.job(res.job_id)
          setCurrentJob(job)
          if (job.status !== 'pending' && job.status !== 'processing') {
            if (pollingRef.current) clearInterval(pollingRef.current)
            pollingRef.current = null
            setGenerating(false)
            onJobCreated()
          }
        } catch {
          // ignore
        }
      }, 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao gerar dieta')
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-white">Parâmetros da Dieta</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Aluno"
              placeholder="Selecione..."
              options={alunos.map(a => ({ value: a.id, label: a.nome }))}
              value={alunoId}
              onChange={e => setAlunoId(e.target.value)}
            />
            <Select
              label="Objetivo"
              placeholder="Selecione..."
              options={[
                { value: 'emagrecimento', label: 'Emagrecimento' },
                { value: 'ganho_massa', label: 'Ganho de Massa' },
                { value: 'manutencao', label: 'Manutenção' },
                { value: 'performance', label: 'Performance' },
              ]}
              value={objetivo}
              onChange={e => setObjetivo(e.target.value)}
            />
            <Input
              label="Calorias Alvo (opcional)"
              type="number"
              placeholder="Ex: 2000"
              value={caloriasAlvo}
              onChange={e => setCaloriasAlvo(e.target.value)}
            />
          </div>
          <Textarea
            label="Restrições alimentares (opcional)"
            placeholder="Ex: sem lactose, vegetariano, alergia a frutos do mar..."
            value={restricoes}
            onChange={e => setRestricoes(e.target.value)}
          />
          <Textarea
            label="Observações (opcional)"
            placeholder="Ex: preferência por refeições práticas..."
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
          />
          <Button onClick={handleGerar} loading={generating} disabled={!alunoId || !objetivo}>
            🤖 Gerar Dieta com IA
          </Button>
        </CardBody>
      </Card>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>
      )}

      {generating && !currentJob && (
        <Card>
          <CardBody className="text-center py-8">
            <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Gerando dieta com IA...</p>
          </CardBody>
        </Card>
      )}

      {currentJob && <JobResult job={currentJob} />}
    </div>
  )
}

// ── Job Result ──

function JobResult({ job }: { job: LLMJob }) {
  const statusInfo = JOB_STATUS[job.status] ?? { label: job.status, variant: 'info' as const }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h3 className="font-semibold text-white">
          {job.tipo === 'treino' ? '🏋️ Treino Gerado' : '🥗 Dieta Gerada'}
        </h3>
        <div className="flex items-center gap-2">
          {job.tokens_usados && (
            <span className="text-xs text-gray-500">{job.tokens_usados} tokens</span>
          )}
          {job.custo_estimado != null && (
            <span className="text-xs text-gray-500">~${job.custo_estimado.toFixed(4)}</span>
          )}
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>
      <CardBody>
        {job.status === 'processing' && (
          <div className="text-center py-6">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Processando...</p>
          </div>
        )}
        {job.status === 'failed' && job.erro && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
            {job.erro}
          </div>
        )}
        {job.status === 'completed' && job.resultado && (
          <div className="space-y-3">
            <pre className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(job.resultado, null, 2)}
            </pre>
            <Button variant="primary" size="sm">
              💾 {job.tipo === 'treino' ? 'Salvar como Ficha' : 'Salvar como Plano'}
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

// ── Histórico de Jobs ──

function JobsHistorico({ jobs, onRefresh }: { jobs: LLMJob[]; onRefresh: () => void }) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="Nenhum job encontrado"
        description="Gere treinos ou dietas com IA para ver o histórico aqui"
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onRefresh}>🔄 Atualizar</Button>
      </div>
      <div className="space-y-3">
        {jobs.map(job => {
          const statusInfo = JOB_STATUS[job.status] ?? { label: job.status, variant: 'info' as const }
          return (
            <Card key={job.id}>
              <CardBody className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span>{job.tipo === 'treino' ? '🏋️' : job.tipo === 'dieta' ? '🥗' : '🤖'}</span>
                    <span className="font-medium text-white capitalize">{job.tipo}</span>
                    {job.aluno_nome && <span className="text-gray-400 text-sm">— {job.aluno_nome}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{new Date(job.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    {job.tokens_usados && <span>{job.tokens_usados} tokens</span>}
                    {job.custo_estimado != null && <span>~${job.custo_estimado.toFixed(4)}</span>}
                  </div>
                </div>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </CardBody>
            </Card>
          )
        })}
      </div>
    </div>
  )
}