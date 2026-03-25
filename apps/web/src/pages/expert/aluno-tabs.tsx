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
  MessageSquare,
  FileText,
  DollarSign,
  ExternalLink,
} from 'lucide-react'

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

// Tab 8: WhatsApp
export function WhatsAppTab({ aluno }: { aluno: Aluno }) {
  const cleanPhone = (phone: string | null) => {
    if (!phone) return null
    return phone.replace(/\D/g, '')
  }

  const whatsappUrl = aluno.telefone ? `https://wa.me/${cleanPhone(aluno.telefone)}` : null

  return (
    <Card className="p-6">
      {whatsappUrl ? (
        <div className="text-center space-y-4">
          <MessageSquare className="w-16 h-16 mx-auto text-green-500" />
          <h3 className="text-lg font-semibold text-white">Conversar no WhatsApp</h3>
          <p className="text-gray-400">{aluno.telefone}</p>
          <Button
            onClick={() => window.open(whatsappUrl, '_blank')}
            className="bg-green-500 hover:bg-green-600"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir WhatsApp
          </Button>
        </div>
      ) : (
        <EmptyState
          icon={<MessageSquare />}
          title="Sem telefone cadastrado"
          description="Adicione um telefone nas informações do aluno para habilitar o WhatsApp"
        />
      )}
    </Card>
  )
}

// Tab 9: Arquivos
export function ArquivosTab() {
  return (
    <Card className="p-6">
      <EmptyState
        icon={<FileText />}
        title="Arquivos"
        description="Upload e gestão de arquivos em desenvolvimento"
      />
    </Card>
  )
}

// Tab 10: Financeiro
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