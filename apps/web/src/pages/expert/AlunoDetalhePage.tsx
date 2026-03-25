/**
 * Página de Detalhes do Aluno — 8 abas organizadas
 */
import { useState, useEffect, useCallback } from 'react'
import { api, type Aluno, ApiError } from '../../lib/api'
import { Tabs } from '../../components/ui/Tabs'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { CalendarioPage } from './CalendarioPage'
import { ChatInline } from './ChatInline'
import {
  DetalhesTab,
  TreinosTab,
  NutricaoTab,
  FormulariosTab,
  EvolucaoTab,
  FinanceiroTab,
} from './aluno-tabs'
import {
  ArrowLeft,
  User,
  Dumbbell,
  MessageCircle,
  Calendar,
  Apple,
  TrendingUp,
  ClipboardList,
  DollarSign,
} from 'lucide-react'

interface Props {
  alunoId: string
  onNavigate: (path: string) => void
}

export function AlunoDetalhePage({ alunoId, onNavigate }: Props) {
  const { toast } = useToast()
  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const a = await api.alunos.get(alunoId)
      setAluno(a)
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar aluno')
    } finally {
      setLoading(false)
    }
  }, [alunoId, toast])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Carregando aluno..." />
      </div>
    )
  }

  if (!aluno) {
    return (
      <Card className="p-12">
        <EmptyState
          icon={<User />}
          title="Aluno não encontrado"
          description="O aluno que você está procurando não existe ou foi removido"
          action={{
            label: 'Voltar para Alunos',
            onClick: () => onNavigate('/expert/alunos'),
          }}
        />
      </Card>
    )
  }

  const statusVariant = aluno.status === 'ativo' ? 'success' : aluno.status === 'inativo' ? 'danger' : 'warning'

  return (
    <div>
      {/* Header com botão voltar */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('/expert/alunos')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Alunos
        </Button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-glow-sm">
            {aluno.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{aluno.nome}</h1>
              <Badge variant={statusVariant}>{aluno.status}</Badge>
            </div>
            <p className="text-gray-400 text-sm">{aluno.email}</p>
            {aluno.telefone && <p className="text-gray-500 text-xs">{aluno.telefone}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'detalhes',
            label: <TabLabel icon={<User className="w-4 h-4" />} text="Detalhes" />,
            content: <DetalhesTab aluno={aluno} onUpdate={load} />,
          },
          {
            id: 'treinos',
            label: <TabLabel icon={<Dumbbell className="w-4 h-4" />} text="Treinos" />,
            content: <TreinosTab alunoId={alunoId} />,
          },
          {
            id: 'calendario',
            label: <TabLabel icon={<Calendar className="w-4 h-4" />} text="Calendário" />,
            content: <CalendarioPage alunoId={alunoId} alunoNome={aluno.nome} />,
          },
          {
            id: 'nutricao',
            label: <TabLabel icon={<Apple className="w-4 h-4" />} text="Nutrição" />,
            content: <NutricaoTab alunoId={alunoId} />,
          },
          {
            id: 'formularios',
            label: <TabLabel icon={<ClipboardList className="w-4 h-4" />} text="Formulários" />,
            content: <FormulariosTab alunoId={alunoId} />,
          },
          {
            id: 'evolucao',
            label: <TabLabel icon={<TrendingUp className="w-4 h-4" />} text="Evolução" />,
            content: <EvolucaoTab alunoId={alunoId} />,
          },
          {
            id: 'chat',
            label: <TabLabel icon={<MessageCircle className="w-4 h-4" />} text="Chat" />,
            content: <ChatInline alunoId={alunoId} />,
          },
          {
            id: 'financeiro',
            label: <TabLabel icon={<DollarSign className="w-4 h-4" />} text="Financeiro" />,
            content: <FinanceiroTab alunoId={alunoId} />,
          },
        ]}
      />
    </div>
  )
}

// Tab Label Helper
function TabLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span>{text}</span>
    </div>
  )
}
