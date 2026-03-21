import { useState, useEffect } from 'react'
import { api, type Aluno, type EvolucaoData, ApiError } from '../../lib/api'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/ui/Toast'
import { getSavedUser } from '../../stores/auth'

export function PerfilPage() {
  const { toast } = useToast()
  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [evolucao, setEvolucao] = useState<EvolucaoData | null>(null)
  const [loading, setLoading] = useState(true)
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
        setEvolucao(ev)
      } catch (err) {
        toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar perfil')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, toast])

  if (loading) return <PageLoader />
  if (!aluno) return <div className="text-center py-12 text-gray-500">Perfil não encontrado</div>

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3">
          {aluno.nome.charAt(0)}
        </div>
        <h1 className="text-2xl font-bold">{aluno.nome}</h1>
        <Badge variant={aluno.status === 'ativo' ? 'success' : 'danger'}>{aluno.status}</Badge>
      </div>

      <Card className="mb-4">
        <CardBody>
          <div className="space-y-3">
            <InfoRow label="Email" value={aluno.email} />
            {aluno.telefone && <InfoRow label="Telefone" value={aluno.telefone} />}
            <InfoRow label="Membro desde" value={new Date(aluno.created_at).toLocaleDateString('pt-BR')} />
          </div>
        </CardBody>
      </Card>

      {evolucao && (
        <Card>
          <CardBody>
            <h2 className="text-sm font-medium text-gray-400 mb-3">📊 Estatísticas</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-white">{evolucao.total_treinos}</p>
                <p className="text-xs text-gray-500">Total de treinos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{evolucao.frequencia_semanal}x</p>
                <p className="text-xs text-gray-500">Frequência semanal</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{evolucao.sequencia_atual}</p>
                <p className="text-xs text-gray-500">Sequência atual (dias)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{evolucao.historico.filter((h) => h.treinou).length}</p>
                <p className="text-xs text-gray-500">Treinos (30 dias)</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  )
}
