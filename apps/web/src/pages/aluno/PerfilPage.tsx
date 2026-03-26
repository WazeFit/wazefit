import { useState, useEffect } from 'react'
import { api, type Aluno, type EvolucaoData, ApiError } from '../../lib/api'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/ui/Toast'
import { getSavedUser } from '../../stores/auth'

export function PerfilPage() {
  const { toast } = useToast()
  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [evolucao, setEvolucao] = useState<EvolucaoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [telefone, setTelefone] = useState('')
  const [salvando, setSalvando] = useState(false)
  const user = getSavedUser()

  useEffect(() => {
    async function load() {
      if (!user) return
      try {
        const [a, ev] = await Promise.all([
          api.alunos.get(user.id),
          api.evolucao.get(user.id, 30).catch(() => null),
        ])
        setAluno(a)
        setTelefone(a.telefone || '')
        setEvolucao(ev)
      } catch (err) {
        toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar perfil')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, toast])

  async function handleSalvar() {
    if (!aluno) return
    setSalvando(true)
    try {
      const novoTelefone = telefone || null
      await api.alunos.update(aluno.id, { telefone: novoTelefone || undefined })
      toast('success', 'Perfil atualizado!')
      setAluno({ ...aluno, telefone: novoTelefone })
      setEditando(false)
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) return <PageLoader />
  if (!aluno) return <div className="text-center py-12 text-gray-500">Perfil não encontrado</div>

  // Calcular streak (dias consecutivos)
  const streak = evolucao?.sequencia_atual || 0
  const totalTreinos = evolucao?.total_treinos || 0
  const frequencia = evolucao?.frequencia_semanal || 0

  // Medalhas baseadas em conquistas
  const medalhas = []
  if (totalTreinos >= 10) medalhas.push({ emoji: '🔥', label: '10 treinos' })
  if (totalTreinos >= 50) medalhas.push({ emoji: '💪', label: '50 treinos' })
  if (totalTreinos >= 100) medalhas.push({ emoji: '🏆', label: '100 treinos' })
  if (streak >= 7) medalhas.push({ emoji: '⚡', label: '7 dias seguidos' })
  if (streak >= 30) medalhas.push({ emoji: '🌟', label: '30 dias seguidos' })
  if (frequencia >= 5) medalhas.push({ emoji: '👑', label: 'Frequência alta' })

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header com avatar */}
      <div className="text-center mb-6">
        <div className="w-24 h-24 bg-gradient-to-br from-brand-500 to-emerald-500 rounded-full flex items-center justify-center text-4xl font-bold mx-auto mb-3 shadow-glow">
          {aluno.nome.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold">{aluno.nome}</h1>
        <p className="text-gray-400 text-sm">{aluno.email}</p>
        <div className="mt-2">
          <Badge variant={aluno.status === 'ativo' ? 'success' : 'danger'}>
            {aluno.status === 'ativo' ? '✓ Ativo' : '⏸ Inativo'}
          </Badge>
        </div>
      </div>

      {/* Estatísticas principais */}
      {evolucao && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <CardBody>
              <p className="text-3xl font-bold text-brand-400">{totalTreinos}</p>
              <p className="text-xs text-gray-500 mt-1">Treinos</p>
            </CardBody>
          </Card>
          <Card className="text-center">
            <CardBody>
              <p className="text-3xl font-bold text-emerald-400">{streak}</p>
              <p className="text-xs text-gray-500 mt-1">Sequência</p>
            </CardBody>
          </Card>
          <Card className="text-center">
            <CardBody>
              <p className="text-3xl font-bold text-purple-400">{frequencia}x</p>
              <p className="text-xs text-gray-500 mt-1">Por semana</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Medalhas/Conquistas */}
      {medalhas.length > 0 && (
        <Card>
          <CardBody>
            <h2 className="text-sm font-semibold text-gray-400 mb-3">🏅 Conquistas</h2>
            <div className="flex flex-wrap gap-2">
              {medalhas.map((m, i) => (
                <div 
                  key={i} 
                  className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 flex items-center gap-2"
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-xs text-gray-300">{m.label}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Informações pessoais */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400">📋 Informações</h2>
            {!editando && (
              <button 
                onClick={() => setEditando(true)}
                className="text-xs text-brand-400 hover:text-brand-300"
              >
                Editar
              </button>
            )}
          </div>
          <div className="space-y-3">
            <InfoRow label="Email" value={aluno.email} />
            
            {editando ? (
              <div className="space-y-2">
                <label className="text-sm text-gray-500">Telefone</label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handleSalvar} loading={salvando}>Salvar</Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      setEditando(false)
                      setTelefone(aluno.telefone || '')
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <InfoRow label="Telefone" value={aluno.telefone || 'Não informado'} />
            )}
            
            <InfoRow 
              label="Membro desde" 
              value={new Date(aluno.created_at).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })} 
            />
          </div>
        </CardBody>
      </Card>

      {/* Histórico visual (últimos 30 dias) */}
      {evolucao?.historico && (
        <Card>
          <CardBody>
            <h2 className="text-sm font-semibold text-gray-400 mb-3">📅 Últimos 30 dias</h2>
            <div className="grid grid-cols-10 gap-1.5">
              {evolucao.historico.slice(0, 30).reverse().map((dia, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded ${
                    dia.treinou 
                      ? 'bg-brand-500 shadow-sm' 
                      : 'bg-dark-700 border border-dark-600'
                  }`}
                  title={`${dia.data} - ${dia.treinou ? 'Treinou' : 'Não treinou'}`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              {evolucao.historico.filter(h => h.treinou).length} treinos nos últimos 30 dias
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  )
}
