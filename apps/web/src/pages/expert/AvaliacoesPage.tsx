/**
 * AvaliacoesPage - Gestao de avaliacoes (anamnese, fisica, bioimpedancia).
 */
import { useState, useEffect, useCallback } from 'react'
import { api, ApiError } from '../../lib/api'
import type {
  Avaliacao, AvaliacaoTipo,
  AvaliacaoAnamnese, AvaliacaoFisica, AvaliacaoBioimpedancia,
  Aluno,
} from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card, CardBody } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/ui/Toast'

const TIPO_MAP: Record<AvaliacaoTipo, { label: string; icon: string; variant: 'success' | 'warning' | 'info' }> = {
  anamnese: { label: 'Anamnese', icon: '📝', variant: 'info' },
  fisica: { label: 'Aval. Física', icon: '📏', variant: 'warning' },
  bioimpedancia: { label: 'Bioimpedância', icon: '⚡', variant: 'success' },
}

export function AvaliacoesPage() {
  const { toast } = useToast()
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAluno, setFilterAluno] = useState('')
  const [filterTipo, setFilterTipo] = useState<AvaliacaoTipo | ''>('')
  const [showCreate, setShowCreate] = useState(false)
  const [viewing, setViewing] = useState<Avaliacao | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [avs, als] = await Promise.all([
        api.avaliacoes.list(filterAluno || undefined, filterTipo || undefined),
        api.alunos.list(1, 100),
      ])
      setAvaliacoes(avs)
      setAlunos(als.data)
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [filterAluno, filterTipo, toast])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta avaliação?')) return
    try {
      await api.avaliacoes.delete(id)
      toast('success', 'Excluída')
      load()
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao excluir')
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Avaliações</h1>
          <p className="text-sm text-gray-400 mt-1">{avaliacoes.length} avaliação(ões)</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ Nova</Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Select placeholder="Todos os alunos"
          options={[{ value: '', label: 'Todos os alunos' }, ...alunos.map(a => ({ value: a.id, label: a.nome }))]}
          value={filterAluno} onChange={e => setFilterAluno(e.target.value)} className="max-w-xs" />
        <Select placeholder="Todos os tipos"
          options={[{ value: '', label: 'Todos' }, { value: 'anamnese', label: 'Anamnese' }, { value: 'fisica', label: 'Física' }, { value: 'bioimpedancia', label: 'Bioimpedância' }]}
          value={filterTipo} onChange={e => setFilterTipo(e.target.value as AvaliacaoTipo | '')} className="max-w-xs" />
      </div>
      {avaliacoes.length === 0 ? (
        <EmptyState icon="📋" title="Nenhuma avaliação" description="Registre avaliações para acompanhar a evolução"
          action={<Button onClick={() => setShowCreate(true)}>Criar</Button>} />
      ) : (
        <div className="grid gap-3">
          {avaliacoes.map(av => {
            const info = TIPO_MAP[av.tipo]
            return (
              <Card key={av.id} className="hover:border-green-500/30 transition-colors cursor-pointer">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="flex-1" onClick={() => setViewing(av)}>
                      <div className="flex items-center gap-2">
                        <span>{info.icon}</span>
                        <p className="font-medium text-white">{info.label}</p>
                        <Badge variant={info.variant}>{av.tipo}</Badge>
                      </div>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {av.aluno_nome} · {new Date(av.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setViewing(av)}>Ver</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(av.id)}>🗑</Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
      {showCreate && <CriarAvaliacaoModal alunos={alunos} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />}
      {viewing && <VisualizarAvaliacaoModal avaliacao={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

function CriarAvaliacaoModal({ alunos, onClose, onCreated }: { alunos: Aluno[]; onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast()
  const [alunoId, setAlunoId] = useState('')
  const [tipo, setTipo] = useState<AvaliacaoTipo | ''>('')
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [historico, setHistorico] = useState('')
  const [lesoes, setLesoes] = useState('')
  const [medicamentos, setMedicamentos] = useState('')
  const [objetivos, setObjetivos] = useState('')
  const [restricoes, setRestricoes] = useState('')
  const [pesoKg, setPesoKg] = useState('')
  const [alturaCm, setAlturaCm] = useState('')
  const [cinturaCm, setCinturaCm] = useState('')
  const [quadrilCm, setQuadrilCm] = useState('')
  const [bracoDCm, setBracoDCm] = useState('')
  const [bracoECm, setBracoECm] = useState('')
  const [pernaDCm, setPernaDCm] = useState('')
  const [pernaECm, setPernaECm] = useState('')
  const [gorduraPct, setGorduraPct] = useState('')
  const [massaMagraKg, setMassaMagraKg] = useState('')
  const [aguaPct, setAguaPct] = useState('')
  const [metabolismoBasal, setMetabolismoBasal] = useState('')
  const [idadeMetabolica, setIdadeMetabolica] = useState('')

  function buildDados(): AvaliacaoAnamnese | AvaliacaoFisica | AvaliacaoBioimpedancia | null {
    if (tipo === 'anamnese') {
      return { historico_medico: historico, lesoes, medicamentos, objetivos, nivel_atividade: '', observacoes: restricoes }
    }
    if (tipo === 'fisica') {
      const peso = parseFloat(pesoKg) || 0
      const altura = parseFloat(alturaCm) || 0
      const imc = peso && altura ? peso / ((altura / 100) ** 2) : 0
      return {
        peso, altura, imc: Math.round(imc * 10) / 10,
        medidas: [
          { local: 'cintura', valor: parseFloat(cinturaCm) || 0, unidade: 'cm' },
          { local: 'quadril', valor: parseFloat(quadrilCm) || 0, unidade: 'cm' },
          { local: 'braço direito', valor: parseFloat(bracoDCm) || 0, unidade: 'cm' },
          { local: 'braço esquerdo', valor: parseFloat(bracoECm) || 0, unidade: 'cm' },
          { local: 'perna direita', valor: parseFloat(pernaDCm) || 0, unidade: 'cm' },
          { local: 'perna esquerda', valor: parseFloat(pernaECm) || 0, unidade: 'cm' },
        ].filter(m => m.valor > 0),
      }
    }
    if (tipo === 'bioimpedancia') {
      return {
        gordura_percentual: parseFloat(gorduraPct) || 0,
        massa_magra: parseFloat(massaMagraKg) || 0,
        agua_corporal: parseFloat(aguaPct) || 0,
        taxa_metabolica: parseFloat(metabolismoBasal) || 0,
        idade_metabolica: parseFloat(idadeMetabolica) || 0,
        gordura_visceral: 0,
      }
    }
    return null
  }

  async function handleSave() {
    if (!alunoId || !tipo) return
    const dados = buildDados()
    if (!dados) return
    try {
      setSaving(true); setError('')
      await api.avaliacoes.create({ aluno_id: alunoId, tipo, dados, observacoes: observacoes || undefined })
      toast('success', 'Avaliação criada')
      onCreated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar')
    } finally { setSaving(false) }
  }

  return (
    <Modal open onClose={onClose} title="Nova Avaliação" size="xl">
      <div className="space-y-4">
        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Aluno" placeholder="Selecione..." options={alunos.map(a => ({ value: a.id, label: a.nome }))} value={alunoId} onChange={e => setAlunoId(e.target.value)} />
          <Select label="Tipo" placeholder="Selecione..." options={[
            { value: 'anamnese', label: 'Anamnese' },
            { value: 'fisica', label: 'Física' },
            { value: 'bioimpedancia', label: 'Bioimpedância' },
          ]} value={tipo} onChange={e => setTipo(e.target.value as AvaliacaoTipo)} />
        </div>

        {tipo === 'anamnese' && (
          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium text-gray-300">📝 Dados da Anamnese</p>
            <Textarea label="Histórico Médico" placeholder="Doenças, cirurgias..." value={historico} onChange={e => setHistorico(e.target.value)} />
            <Textarea label="Lesões" placeholder="Lesões anteriores..." value={lesoes} onChange={e => setLesoes(e.target.value)} />
            <Textarea label="Medicamentos" placeholder="Medicamentos em uso..." value={medicamentos} onChange={e => setMedicamentos(e.target.value)} />
            <Textarea label="Objetivos" placeholder="Objetivos do aluno..." value={objetivos} onChange={e => setObjetivos(e.target.value)} />
            <Textarea label="Restrições" placeholder="Restrições..." value={restricoes} onChange={e => setRestricoes(e.target.value)} />
          </div>
        )}

        {tipo === 'fisica' && (
          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium text-gray-300">📏 Medidas Corporais</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Peso (kg)" type="number" step="0.1" placeholder="75.5" value={pesoKg} onChange={e => setPesoKg(e.target.value)} />
              <Input label="Altura (cm)" type="number" step="0.1" placeholder="175" value={alturaCm} onChange={e => setAlturaCm(e.target.value)} />
              <Input label="Cintura (cm)" type="number" step="0.1" value={cinturaCm} onChange={e => setCinturaCm(e.target.value)} />
              <Input label="Quadril (cm)" type="number" step="0.1" value={quadrilCm} onChange={e => setQuadrilCm(e.target.value)} />
              <Input label="Braço D (cm)" type="number" step="0.1" value={bracoDCm} onChange={e => setBracoDCm(e.target.value)} />
              <Input label="Braço E (cm)" type="number" step="0.1" value={bracoECm} onChange={e => setBracoECm(e.target.value)} />
              <Input label="Perna D (cm)" type="number" step="0.1" value={pernaDCm} onChange={e => setPernaDCm(e.target.value)} />
              <Input label="Perna E (cm)" type="number" step="0.1" value={pernaECm} onChange={e => setPernaECm(e.target.value)} />
            </div>
          </div>
        )}

        {tipo === 'bioimpedancia' && (
          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium text-gray-300">⚡ Bioimpedância</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Gordura (%)" type="number" step="0.1" value={gorduraPct} onChange={e => setGorduraPct(e.target.value)} />
              <Input label="Massa Magra (kg)" type="number" step="0.1" value={massaMagraKg} onChange={e => setMassaMagraKg(e.target.value)} />
              <Input label="Água (%)" type="number" step="0.1" value={aguaPct} onChange={e => setAguaPct(e.target.value)} />
              <Input label="Metabolismo Basal" type="number" value={metabolismoBasal} onChange={e => setMetabolismoBasal(e.target.value)} />
              <Input label="Idade Metabólica" type="number" value={idadeMetabolica} onChange={e => setIdadeMetabolica(e.target.value)} />
            </div>
          </div>
        )}

        <Textarea label="Observações" placeholder="Observações gerais..." value={observacoes} onChange={e => setObservacoes(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving} disabled={!alunoId || !tipo}>Criar</Button>
        </div>
      </div>
    </Modal>
  )
}

function VisualizarAvaliacaoModal({ avaliacao, onClose }: { avaliacao: Avaliacao; onClose: () => void }) {
  const info = TIPO_MAP[avaliacao.tipo]

  function renderAnamnese(dados: AvaliacaoAnamnese) {
    const fields = [
      { label: 'Histórico Médico', value: dados.historico_medico },
      { label: 'Lesões', value: dados.lesoes },
      { label: 'Medicamentos', value: dados.medicamentos },
      { label: 'Objetivos', value: dados.objetivos },
      { label: 'Restrições / Obs', value: dados.observacoes },
    ]
    return (
      <div className="space-y-3">
        {fields.map(f => f.value ? (
          <div key={f.label}>
            <p className="text-xs font-medium text-gray-500 mb-1">{f.label}</p>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{f.value}</p>
          </div>
        ) : null)}
      </div>
    )
  }

  function renderFisica(dados: AvaliacaoFisica) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Peso</p>
            <p className="text-lg font-bold text-white">{dados.peso}<span className="text-xs text-gray-500"> kg</span></p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Altura</p>
            <p className="text-lg font-bold text-white">{dados.altura}<span className="text-xs text-gray-500"> cm</span></p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">IMC</p>
            <p className="text-lg font-bold text-white">{dados.imc}</p>
          </div>
        </div>
        {dados.medidas.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Medidas</p>
            <div className="grid grid-cols-2 gap-2">
              {dados.medidas.map(m => (
                <div key={m.local} className="flex justify-between bg-gray-800/50 rounded px-3 py-2">
                  <span className="text-sm text-gray-400 capitalize">{m.local}</span>
                  <span className="text-sm text-white font-medium">{m.valor} {m.unidade}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderBioimpedancia(dados: AvaliacaoBioimpedancia) {
    const items = [
      { label: 'Gordura Corporal', value: dados.gordura_percentual, unit: '%' },
      { label: 'Massa Magra', value: dados.massa_magra, unit: 'kg' },
      { label: 'Água Corporal', value: dados.agua_corporal, unit: '%' },
      { label: 'Taxa Metabólica', value: dados.taxa_metabolica, unit: 'kcal' },
      { label: 'Idade Metabólica', value: dados.idade_metabolica, unit: 'anos' },
    ]
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map(i => (
          <div key={i.label} className="bg-gray-800/50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">{i.label}</p>
            <p className="text-lg font-bold text-white">{i.value}<span className="text-xs text-gray-500 ml-1">{i.unit}</span></p>
          </div>
        ))}
      </div>
    )
  }

  function renderDados() {
    switch (avaliacao.tipo) {
      case 'anamnese': return renderAnamnese(avaliacao.dados as AvaliacaoAnamnese)
      case 'fisica': return renderFisica(avaliacao.dados as AvaliacaoFisica)
      case 'bioimpedancia': return renderBioimpedancia(avaliacao.dados as AvaliacaoBioimpedancia)
    }
  }

  return (
    <Modal open onClose={onClose} title={info.icon + ' ' + info.label} size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">{avaliacao.aluno_nome}</p>
            <p className="text-xs text-gray-500">{new Date(avaliacao.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
          <Badge variant={info.variant}>{avaliacao.tipo}</Badge>
        </div>
        {renderDados()}
        {avaliacao.observacoes && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Observações</p>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{avaliacao.observacoes}</p>
          </div>
        )}
        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </Modal>
  )
}
