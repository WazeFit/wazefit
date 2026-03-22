import { useState, useEffect, useCallback } from 'react'
import { api, type Cobranca, type CobrancaInput, type ResumoFinanceiro, type Aluno, ApiError } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { Badge } from '../../components/ui/Badge'
import { Card, CardBody } from '../../components/ui/Card'
import { useToast } from '../../components/ui/Toast'

const statusBadge: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  pago: 'success',
  pendente: 'warning',
  atrasado: 'danger',
  cancelado: 'info',
}

export function FinanceiroPage() {
  const { toast } = useToast()
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null)
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('')

  // Form
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [alunoId, setAlunoId] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState('')
  const [descricao, setDescricao] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([
        api.financeiro.resumo(),
        api.cobrancas.list(filtroStatus || undefined),
      ])
      setResumo(r)
      setCobrancas(c)
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar financeiro')
    } finally {
      setLoading(false)
    }
  }, [filtroStatus, toast])

  useEffect(() => { load() }, [load])

  async function openNew() {
    setAlunoId('')
    setValor('')
    setVencimento('')
    setDescricao('')
    setErrors({})
    try { setAlunos((await api.alunos.list(1, 100)).data) } catch { /* ignore */ }
    setModalOpen(true)
  }

  async function handleSave() {
    const e: Record<string, string> = {}
    if (!alunoId) e['aluno'] = 'Selecione um aluno'
    if (!valor || parseFloat(valor) <= 0) e['valor'] = 'Valor inválido'
    if (!vencimento) e['vencimento'] = 'Data obrigatória'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setSaving(true)
    try {
      const data: CobrancaInput = {
        aluno_id: alunoId,
        valor: parseFloat(valor),
        vencimento,
        descricao: descricao.trim() || undefined,
      }
      await api.cobrancas.create(data)
      toast('success', 'Cobrança criada')
      setModalOpen(false)
      load()
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao criar cobrança')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-gray-400 text-sm">Cobranças e receitas</p>
        </div>
        <Button onClick={openNew}>+ Nova Cobrança</Button>
      </div>

      {/* Resumo */}
      {resumo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardBody>
              <p className="text-xs text-gray-500 mb-1">Receita do Mês</p>
              <p className="text-2xl font-bold text-green-400">R$ {(resumo.receita_mes ?? 0).toFixed(2)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-gray-500 mb-1">Mês Anterior</p>
              <p className="text-2xl font-bold text-white">R$ {(resumo.receita_mes_anterior ?? 0).toFixed(2)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-gray-500 mb-1">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-400">{resumo.cobrancas_pendentes}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-gray-500 mb-1">Atrasadas</p>
              <p className="text-2xl font-bold text-red-400">{resumo.cobrancas_atrasadas}</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Filtro + Lista */}
      <div className="flex items-center gap-2 mb-4">
        <Select
          options={[
            { value: 'pendente', label: 'Pendente' },
            { value: 'pago', label: 'Pago' },
            { value: 'atrasado', label: 'Atrasado' },
            { value: 'cancelado', label: 'Cancelado' },
          ]}
          placeholder="Todos os status"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="w-40"
        />
      </div>

      {cobrancas.length === 0 ? (
        <EmptyState icon="💰" title="Nenhuma cobrança" description="Crie sua primeira cobrança." action={<Button onClick={openNew}>Criar cobrança</Button>} />
      ) : (
        <div className="space-y-2">
          {cobrancas.map((cob) => (
            <div key={cob.id} className="flex items-center justify-between bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <div>
                <p className="font-medium text-white">{cob.aluno_nome ?? 'Aluno'}</p>
                {cob.descricao && <p className="text-sm text-gray-400">{cob.descricao}</p>}
                <p className="text-xs text-gray-500">Vence: {new Date(cob.vencimento).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">R$ {cob.valor.toFixed(2)}</p>
                <Badge variant={statusBadge[cob.status] ?? 'info'}>{cob.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nova Cobrança">
        <div className="space-y-4">
          <Select label="Aluno" options={alunos.map((a) => ({ value: a.id, label: a.nome }))} value={alunoId} onChange={(e) => setAlunoId(e.target.value)} placeholder="Selecione..." error={errors['aluno']} />
          <Input label="Valor (R$)" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} error={errors['valor']} placeholder="150.00" />
          <Input label="Vencimento" type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} error={errors['vencimento']} />
          <Textarea label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Mensalidade março..." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>Criar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
