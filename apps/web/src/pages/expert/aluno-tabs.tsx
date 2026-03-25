// Tabs components para AlunoDetalhePage
import { useState, useEffect } from 'react'
import { api, type Aluno, type Cobranca, ApiError } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/ui/Toast'
import {
  Edit2,
  Check,
  X,
  Dumbbell,
  Apple,
  DollarSign,
  ClipboardList,
  Camera,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'

// Tab 1: Detalhes
export function DetalhesTab({ aluno, onUpdate }: { aluno: Aluno; onUpdate: () => void }) {
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    nome: aluno.nome,
    email: aluno.email,
    telefone: aluno.telefone || '',
    status: aluno.status,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.alunos.update(aluno.id, {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone || undefined,
        status: formData.status,
      })
      toast('success', 'Aluno atualizado com sucesso!')
      setEditing(false)
      onUpdate()
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao atualizar aluno')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      nome: aluno.nome,
      email: aluno.email,
      telefone: aluno.telefone || '',
      status: aluno.status,
    })
    setEditing(false)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Informações do Aluno</h2>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Edit2 className="w-4 h-4" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
              <X className="w-4 h-4" />
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
              <Check className="w-4 h-4" />
              Salvar
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Input
          label="Nome completo"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          disabled={!editing}
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={!editing}
        />

        <Input
          label="Telefone"
          value={formData.telefone}
          onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
          disabled={!editing}
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <div className="grid grid-cols-3 gap-2">
            {(['ativo', 'trial', 'inativo'] as const).map((status) => (
              <button
                key={status}
                type="button"
                disabled={!editing}
                onClick={() => setFormData({ ...formData, status })}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${formData.status === status
                    ? 'bg-brand-500 text-white'
                    : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                  }
                  ${!editing && 'opacity-50 cursor-not-allowed'}
                `}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Cadastrado em</label>
          <p className="text-gray-400">{new Date(aluno.created_at).toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </Card>
  )
}

// Tab 2: Treinos
export function TreinosTab({ alunoId }: { alunoId: string }) {
  const { toast } = useToast()
  const [calendario, setCalendario] = useState<Record<string, { ficha_id: string; ficha_nome?: string } | null>>({})
  const [execucoes, setExecucoes] = useState<Array<{ id: string; ficha_id: string; data: string; duracao_min: number | null }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [cal, exec] = await Promise.all([
          api.calendario.get(alunoId),
          api.execucoes.list(alunoId).then(r => r.data),
        ])
        setCalendario(cal)
        setExecucoes(exec)
      } catch (err) {
        toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar treinos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [alunoId, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Carregando treinos..." />
      </div>
    )
  }

  const diasSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']
  const fichasAtribuidas = diasSemana.filter(dia => calendario[dia]).length

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Calendário Semanal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {diasSemana.map((dia) => {
            const ficha = calendario[dia]
            return (
              <div key={dia} className="bg-dark-800 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-400 mb-1 capitalize">{dia}</div>
                {ficha ? (
                  <div className="text-white font-medium">{ficha.ficha_nome || `Ficha ${ficha.ficha_id}`}</div>
                ) : (
                  <div className="text-gray-500 text-sm">Descanso</div>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-4 text-sm text-gray-400">
          {fichasAtribuidas} dias de treino por semana
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Histórico de Execuções</h3>
        {execucoes.length === 0 ? (
          <EmptyState
            icon={<Dumbbell />}
            title="Nenhum treino executado"
            description="Este aluno ainda não registrou nenhuma execução de treino"
          />
        ) : (
          <div className="space-y-2">
            {execucoes.slice(0, 10).map((exec) => (
              <div key={exec.id} className="bg-dark-800 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Ficha {exec.ficha_id}</div>
                  <div className="text-sm text-gray-400">{new Date(exec.data).toLocaleDateString('pt-BR')}</div>
                </div>
                {exec.duracao_min && (
                  <div className="text-sm text-gray-400">{exec.duracao_min} min</div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// Tab 5: Nutrição
export function NutricaoTab({ alunoId }: { alunoId: string }) {
  const { toast } = useToast()
  const [planos, setPlanos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const p = await api.nutricao.planos.list(alunoId)
        setPlanos(p)
      } catch (err) {
        toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar planos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [alunoId, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Carregando planos..." />
      </div>
    )
  }

  if (planos.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={<Apple />}
          title="Nenhum plano nutricional"
          description="Este aluno ainda não possui planos nutricionais cadastrados"
        />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {planos.map((plano) => (
        <Card key={plano.id} className="p-6">
          <h3 className="text-lg font-semibold text-white mb-2">{plano.nome || 'Plano Nutricional'}</h3>
          {plano.refeicoes && plano.refeicoes.length > 0 && (
            <div className="space-y-2 mt-4">
              {plano.refeicoes.map((ref: any, idx: number) => (
                <div key={idx} className="bg-dark-800 rounded-lg p-3">
                  <div className="text-white font-medium">{ref.nome}</div>
                  {ref.alimentos && (
                    <div className="text-sm text-gray-400 mt-1">{ref.alimentos}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

// Tab 7: Evolução
export function EvolucaoTab({ alunoId }: { alunoId: string }) {
  const { toast } = useToast()
  const [evolucao, setEvolucao] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [evol, anal] = await Promise.all([
          api.evolucao.get(alunoId, 30),
          api.analytics.alunoAnalytics(alunoId),
        ])
        setEvolucao(evol)
        setAnalytics(anal)
      } catch (err) {
        toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar evolução')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [alunoId, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Carregando evolução..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Últimos 30 dias</h3>
        {evolucao && evolucao.heatmap && (
          <div className="grid grid-cols-7 gap-2">
            {evolucao.heatmap.map((day: any, idx: number) => (
              <div
                key={idx}
                className={`h-12 rounded ${day.treinos > 0 ? 'bg-brand-500' : 'bg-dark-800'}`}
                title={`${day.data}: ${day.treinos} treinos`}
              />
            ))}
          </div>
        )}
      </Card>

      {analytics && analytics.peso && analytics.peso.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Evolução de Peso</h3>
          <div className="space-y-2">
            {analytics.peso.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-gray-400">{p.data}</span>
                <span className="text-white font-semibold">{p.valor} kg</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// Tab 5: Formulários (check-in mensal do aluno)
interface FormularioEntry {
  id: string
  mesAno: string
  status: 'preenchido' | 'pendente'
  dataPreenchimento: string | null
  peso: number | null
  gorduraCorporal: number | null
  observacoes: string | null
  fotos: { url: string; tipo: 'frente' | 'lado' | 'costas' }[]
}

export function FormulariosTab({ alunoId: _alunoId }: { alunoId: string }) {
  const [formularios] = useState<FormularioEntry[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // TODO: load from API when backend is ready
  // useEffect(() => { api.formularios.list(_alunoId).then(setFormularios) }, [_alunoId])

  if (formularios.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={<ClipboardList className="w-12 h-12" />}
          title="Nenhum formulário preenchido"
          description="Os formulários mensais do aluno aparecerão aqui conforme forem preenchidos. Cada formulário inclui peso, medidas, fotos e observações."
          action={{
            label: 'Criar Formulário',
            onClick: () => {
              // TODO: open modal to create form
            },
          }}
        />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Formulários Mensais</h3>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            // TODO: open modal to create form
          }}
        >
          <Plus className="w-4 h-4" />
          Novo Formulário
        </Button>
      </div>

      {formularios.map((form) => {
        const isExpanded = expandedId === form.id
        return (
          <Card key={form.id} className="overflow-hidden">
            {/* Header - clickable */}
            <button
              type="button"
              className="w-full p-4 flex items-center justify-between hover:bg-dark-800/50 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : form.id)}
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="w-5 h-5 text-brand-400" />
                <div className="text-left">
                  <div className="text-white font-medium">{form.mesAno}</div>
                  {form.dataPreenchimento && (
                    <div className="text-xs text-gray-500">
                      Preenchido em {new Date(form.dataPreenchimento).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={form.status === 'preenchido' ? 'success' : 'warning'}>
                  {form.status === 'preenchido' ? 'Preenchido' : 'Pendente'}
                </Badge>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-dark-700 pt-4 space-y-4">
                {/* Measurements */}
                <div className="grid grid-cols-2 gap-4">
                  {form.peso != null && (
                    <div className="bg-dark-800 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Peso</div>
                      <div className="text-white font-semibold">{form.peso} kg</div>
                    </div>
                  )}
                  {form.gorduraCorporal != null && (
                    <div className="bg-dark-800 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">% Gordura</div>
                      <div className="text-white font-semibold">{form.gorduraCorporal}%</div>
                    </div>
                  )}
                </div>

                {/* Photos */}
                {form.fotos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Camera className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">Fotos</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {form.fotos.map((foto, idx) => (
                        <div
                          key={idx}
                          className="aspect-square bg-dark-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-brand-500 transition-all"
                        >
                          <img
                            src={foto.url}
                            alt={`Foto ${foto.tipo}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="text-xs text-center text-gray-500 mt-1 capitalize">
                            {foto.tipo}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observations */}
                {form.observacoes && (
                  <div className="bg-dark-800 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Observações</div>
                    <p className="text-gray-300 text-sm">{form.observacoes}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

// Tab 8: Financeiro
export function FinanceiroTab({ alunoId }: { alunoId: string }) {
  const { toast } = useToast()
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const all = await api.cobrancas.list()
        // Filter by aluno_id client-side (API doesn't support filter yet)
        const filtered = all.filter((c: any) => c.aluno_id === alunoId)
        setCobrancas(filtered)
      } catch (err) {
        toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar cobranças')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [alunoId, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Carregando cobranças..." />
      </div>
    )
  }

  if (cobrancas.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={<DollarSign />}
          title="Nenhuma cobrança"
          description="Este aluno ainda não possui cobranças cadastradas"
        />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {cobrancas.map((cobranca) => (
        <Card key={cobranca.id} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-semibold">R$ {cobranca.valor}</div>
              <div className="text-sm text-gray-400">
                Vencimento: {new Date(cobranca.vencimento).toLocaleDateString('pt-BR')}
              </div>
            </div>
            <div className={`px-3 py-1 rounded text-sm font-medium ${
              cobranca.status === 'pago' ? 'bg-green-500/20 text-green-400' :
              cobranca.status === 'pendente' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {cobranca.status}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}