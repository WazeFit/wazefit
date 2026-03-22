/**
 * NutricaoPage — Gestão de planos nutricionais.
 * Lista planos, cria/edita, gerencia refeições e alimentos.
 */
import { useState, useEffect, useCallback } from 'react'
import { api, ApiError } from '../../lib/api'
import type { PlanoNutricional, Aluno, AlimentoInput } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'

interface Props {
  planoId?: string
  onNavigate?: (path: string) => void
}

export function NutricaoPage({ planoId, onNavigate }: Props) {
  if (planoId) {
    return <PlanoDetail id={planoId} onBack={() => onNavigate?.('/expert/nutricao')} />
  }
  return <PlanosList onNavigate={onNavigate} />
}

// ── Lista de Planos ──

function PlanosList({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const [planos, setPlanos] = useState<PlanoNutricional[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterAluno, setFilterAluno] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [p, a] = await Promise.all([
        api.nutricao.planos.list(filterAluno || undefined),
        api.alunos.list(1, 100),
      ])
      setPlanos(p)
      setAlunos(a.data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }, [filterAluno])

  useEffect(() => { load() }, [load])

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Nutrição</h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie planos nutricionais dos seus alunos</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ Novo Plano</Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>
      )}

      <Select
        placeholder="Filtrar por aluno..."
        options={[{ value: '', label: 'Todos os alunos' }, ...alunos.map(a => ({ value: a.id, label: a.nome }))]}
        value={filterAluno}
        onChange={e => setFilterAluno(e.target.value)}
        className="max-w-xs"
      />

      {planos.length === 0 ? (
        <EmptyState icon="🥗" title="Nenhum plano nutricional" description="Crie um plano para começar" />
      ) : (
        <div className="grid gap-3">
          {planos.map(p => (
            <Card key={p.id} className="hover:border-green-500/30 transition-colors cursor-pointer"
              onClick={() => onNavigate?.(`/expert/nutricao/${p.id}`)}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{p.nome}</p>
                      {p.ativo && <Badge variant="success">Ativo</Badge>}
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">{p.aluno_nome} · {p.objetivo}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-green-400 font-medium">{p.calorias_diarias} kcal</p>
                    <p className="text-xs text-gray-500">
                      P:{p.proteina_g}g · C:{p.carboidrato_g}g · G:{p.gordura_g}g
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <CriarPlanoModal
          alunos={alunos}
          onClose={() => setShowCreate(false)}
          onCreated={(id) => { setShowCreate(false); onNavigate?.(`/expert/nutricao/${id}`) }}
        />
      )}
    </div>
  )
}

// ── Modal Criar Plano ──

function CriarPlanoModal({ alunos, onClose, onCreated }: {
  alunos: Aluno[]
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const [form, setForm] = useState({
    aluno_id: '', nome: '', objetivo: '',
    calorias_diarias: '2000', proteina_g: '150',
    carboidrato_g: '250', gordura_g: '70',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!form.aluno_id || !form.nome || !form.objetivo) return
    try {
      setSaving(true)
      const plano = await api.nutricao.planos.create({
        aluno_id: form.aluno_id,
        nome: form.nome,
        objetivo: form.objetivo,
        calorias_diarias: parseInt(form.calorias_diarias),
        proteina_g: parseInt(form.proteina_g),
        carboidrato_g: parseInt(form.carboidrato_g),
        gordura_g: parseInt(form.gordura_g),
      })
      onCreated(plano.id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar plano')
    } finally {
      setSaving(false)
    }
  }

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Modal isOpen onClose={onClose} title="Novo Plano Nutricional" size="lg">
      <div className="space-y-4">
        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}
        <Select label="Aluno" placeholder="Selecione..." options={alunos.map(a => ({ value: a.id, label: a.nome }))}
          value={form.aluno_id} onChange={e => update('aluno_id', e.target.value)} />
        <Input label="Nome do Plano" placeholder="Ex: Plano Cutting" value={form.nome} onChange={e => update('nome', e.target.value)} />
        <Select label="Objetivo" placeholder="Selecione..." options={[
          { value: 'emagrecimento', label: 'Emagrecimento' },
          { value: 'ganho_massa', label: 'Ganho de Massa' },
          { value: 'manutencao', label: 'Manutenção' },
        ]} value={form.objetivo} onChange={e => update('objetivo', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Calorias" type="number" value={form.calorias_diarias} onChange={e => update('calorias_diarias', e.target.value)} />
          <Input label="Proteína (g)" type="number" value={form.proteina_g} onChange={e => update('proteina_g', e.target.value)} />
          <Input label="Carboidrato (g)" type="number" value={form.carboidrato_g} onChange={e => update('carboidrato_g', e.target.value)} />
          <Input label="Gordura (g)" type="number" value={form.gordura_g} onChange={e => update('gordura_g', e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving} disabled={!form.aluno_id || !form.nome || !form.objetivo}>Criar Plano</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Detalhe do Plano ──

function PlanoDetail({ id, onBack }: { id: string; onBack?: () => void }) {
  const [plano, setPlano] = useState<PlanoNutricional | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addRefeicao, setAddRefeicao] = useState(false)
  const [addAlimento, setAddAlimento] = useState<string | null>(null)
  const [expandedRef, setExpandedRef] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const p = await api.nutricao.planos.get(id)
      setPlano(p)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar plano')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <PageLoader />
  if (!plano) return <EmptyState icon="❌" title="Plano não encontrado" />

  // Calcular totais
  const totais = (plano.refeicoes ?? [])?.reduce((acc, ref) => {
    const refTotais = ref.alimentos.reduce((ra, al) => ({
      cal: ra.cal + al.calorias,
      prot: ra.prot + al.proteina_g,
      carb: ra.carb + al.carboidrato_g,
      gord: ra.gord + al.gordura_g,
    }), { cal: 0, prot: 0, carb: 0, gord: 0 })
    return {
      cal: acc.cal + refTotais.cal,
      prot: acc.prot + refTotais.prot,
      carb: acc.carb + refTotais.carb,
      gord: acc.gord + refTotais.gord,
    }
  }, { cal: 0, prot: 0, carb: 0, gord: 0 })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">← Voltar</button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{plano.nome}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{plano.aluno_nome} · {plano.objetivo}</p>
        </div>
        {plano.ativo && <Badge variant="success">Ativo</Badge>}
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}

      {/* Macros resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MacroCard label="Calorias" atual={totais.cal} alvo={plano.calorias_diarias ?? 0} unit="kcal" />
        <MacroCard label="Proteína" atual={totais.prot} alvo={plano.proteina_g ?? 0} unit="g" />
        <MacroCard label="Carboidrato" atual={totais.carb} alvo={plano.carboidrato_g ?? 0} unit="g" />
        <MacroCard label="Gordura" atual={totais.gord} alvo={plano.gordura_g ?? 0} unit="g" />
      </div>

      {/* Refeições */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Refeições</h2>
          <Button size="sm" onClick={() => setAddRefeicao(true)}>+ Refeição</Button>
        </div>

        {(plano.refeicoes ?? [])?.length === 0 ? (
          <EmptyState icon="🍽️" title="Nenhuma refeição" description="Adicione refeições ao plano" />
        ) : (
          (plano.refeicoes ?? [])?.sort((a, b) => a.ordem - b.ordem).map(ref => {
            const refCal = ref.alimentos.reduce((s, a) => s + a.calorias, 0)
            const isExpanded = expandedRef === ref.id
            return (
              <Card key={ref.id}>
                <CardHeader className="cursor-pointer" onClick={() => setExpandedRef(isExpanded ? null : ref.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
                      <span className="font-medium text-white">{ref.nome}</span>
                      {ref.horario && <span className="text-xs text-gray-500">{ref.horario}</span>}
                    </div>
                    <span className="text-sm text-green-400">{refCal} kcal</span>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardBody className="space-y-2">
                    {ref.alimentos.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum alimento adicionado</p>
                    ) : (
                      <div className="space-y-1">
                        {ref.alimentos.map(al => (
                          <div key={al.id} className="flex items-center justify-between py-1.5 px-2 bg-gray-800/50 rounded text-sm">
                            <div>
                              <span className="text-white">{al.nome}</span>
                              <span className="text-gray-500 ml-2">{al.quantidade}{al.unidade}</span>
                            </div>
                            <div className="flex gap-3 text-xs text-gray-400">
                              <span>{al.calorias}kcal</span>
                              <span>P:{al.proteina_g}g</span>
                              <span>C:{al.carboidrato_g}g</span>
                              <span>G:{al.gordura_g}g</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setAddAlimento(ref.id)}>
                      + Alimento
                    </Button>
                  </CardBody>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Modal Adicionar Refeição */}
      {addRefeicao && (
        <AddRefeicaoModal
          planoId={id}
          onClose={() => setAddRefeicao(false)}
          onAdded={load}
        />
      )}

      {/* Modal Adicionar Alimento */}
      {addAlimento && (
        <AddAlimentoModal
          planoId={id}
          refeicaoId={addAlimento}
          onClose={() => setAddAlimento(null)}
          onAdded={load}
        />
      )}
    </div>
  )
}

// ── Macro Card ──

function MacroCard({ label, atual, alvo, unit }: { label: string; atual: number; alvo: number; unit: string }) {
  const pct = alvo > 0 ? Math.min((atual / alvo) * 100, 100) : 0
  const over = atual > alvo
  return (
    <Card>
      <CardBody className="text-center py-3">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className={`text-lg font-bold ${over ? 'text-red-400' : 'text-white'}`}>
          {Math.round(atual)}<span className="text-xs text-gray-500 ml-0.5">{unit}</span>
        </p>
        <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
          <div
            className={`h-1.5 rounded-full transition-all ${over ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-1">Meta: {alvo}{unit}</p>
      </CardBody>
    </Card>
  )
}

// ── Modal Adicionar Refeição ──

function AddRefeicaoModal({ planoId, onClose, onAdded }: { planoId: string; onClose: () => void; onAdded: () => void }) {
  const [nome, setNome] = useState('')
  const [horario, setHorario] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!nome) return
    try {
      setSaving(true)
      await api.nutricao.refeicoes.create(planoId, { nome, horario: horario || undefined })
      onAdded()
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao adicionar refeição')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Adicionar Refeição">
      <div className="space-y-4">
        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}
        <Input label="Nome" placeholder="Ex: Café da manhã" value={nome} onChange={e => setNome(e.target.value)} />
        <Input label="Horário (opcional)" placeholder="Ex: 07:00" value={horario} onChange={e => setHorario(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving} disabled={!nome}>Adicionar</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Modal Adicionar Alimento ──

function AddAlimentoModal({ planoId, refeicaoId, onClose, onAdded }: {
  planoId: string; refeicaoId: string; onClose: () => void; onAdded: () => void
}) {
  const [form, setForm] = useState<AlimentoInput>({
    nome: '', quantidade: 100, unidade: 'g', calorias: 0, proteina_g: 0, carboidrato_g: 0, gordura_g: 0,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update<K extends keyof AlimentoInput>(key: K, value: AlimentoInput[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.nome) return
    try {
      setSaving(true)
      await api.nutricao.alimentos.create(planoId, refeicaoId, form)
      onAdded()
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao adicionar alimento')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Adicionar Alimento" size="lg">
      <div className="space-y-4">
        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}
        <Input label="Nome" placeholder="Ex: Frango grelhado" value={form.nome} onChange={e => update('nome', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Quantidade" type="number" value={String(form.quantidade)} onChange={e => update('quantidade', Number(e.target.value))} />
          <Select label="Unidade" options={[
            { value: 'g', label: 'gramas' },
            { value: 'ml', label: 'ml' },
            { value: 'un', label: 'unidade' },
            { value: 'colher', label: 'colher' },
            { value: 'xicara', label: 'xícara' },
          ]} value={form.unidade} onChange={e => update('unidade', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Calorias" type="number" value={String(form.calorias)} onChange={e => update('calorias', Number(e.target.value))} />
          <Input label="Proteína (g)" type="number" value={String(form.proteina_g)} onChange={e => update('proteina_g', Number(e.target.value))} />
          <Input label="Carboidrato (g)" type="number" value={String(form.carboidrato_g)} onChange={e => update('carboidrato_g', Number(e.target.value))} />
          <Input label="Gordura (g)" type="number" value={String(form.gordura_g)} onChange={e => update('gordura_g', Number(e.target.value))} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving} disabled={!form.nome}>Adicionar</Button>
        </div>
      </div>
    </Modal>
  )
}