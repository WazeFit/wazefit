/**
 * Página de Alunos — lista, busca, filtros e criação.
 */
import { useState, useEffect } from 'react'
import { api, type Aluno, type PaginatedResponse, ApiError } from '../../lib/api'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/ui/Toast'
import { 
  Plus, 
  Search, 
  Users, 
  Mail, 
  Phone,
  Calendar,
  Activity,
} from 'lucide-react'

interface AlunosPageProps {
  onNavigate: (path: string) => void
}

export function AlunosPage({ onNavigate }: AlunosPageProps) {
  const { toast } = useToast()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo' | 'trial'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Carregar alunos da API
  useEffect(() => {
    loadAlunos()
  }, [])

  async function loadAlunos() {
    setLoading(true)
    try {
      const response: PaginatedResponse<Aluno> = await api.alunos.list(1, 100)
      setAlunos(response.data)
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar alunos')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar alunos
  const filteredAlunos = alunos.filter((aluno) => {
    const matchesSearch = aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         aluno.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || aluno.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Stats
  const stats = {
    total: alunos.length,
    ativos: alunos.filter(a => a.status === 'ativo').length,
    trial: alunos.filter(a => a.status === 'trial').length,
    inativos: alunos.filter(a => a.status === 'inativo').length,
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'default'> = {
      ativo: 'success',
      trial: 'warning',
      inativo: 'default',
    }
    const labels: Record<string, string> = {
      ativo: 'Ativo',
      trial: 'Trial',
      inativo: 'Inativo',
    }
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  return (
    <div>
      <PageHeader
        title="Alunos"
        description="Gerencie seus alunos, acompanhe evolução e organize treinos"
        action={
          <Button onClick={() => setShowCreateModal(true)} size="lg">
            <Plus className="w-5 h-5" />
            Novo Aluno
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-brand-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Ativos</p>
              <p className="text-2xl font-bold text-white">{stats.ativos}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Trial</p>
              <p className="text-2xl font-bold text-white">{stats.trial}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Inativos</p>
              <p className="text-2xl font-bold text-white">{stats.inativos}</p>
            </div>
            <div className="w-12 h-12 bg-gray-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'primary' : 'ghost'}
              onClick={() => setStatusFilter('all')}
              size="sm"
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === 'ativo' ? 'primary' : 'ghost'}
              onClick={() => setStatusFilter('ativo')}
              size="sm"
            >
              Ativos
            </Button>
            <Button
              variant={statusFilter === 'trial' ? 'primary' : 'ghost'}
              onClick={() => setStatusFilter('trial')}
              size="sm"
            >
              Trial
            </Button>
            <Button
              variant={statusFilter === 'inativo' ? 'primary' : 'ghost'}
              onClick={() => setStatusFilter('inativo')}
              size="sm"
            >
              Inativos
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Alunos */}
      {loading ? (
        <Card className="p-12">
          <LoadingSpinner size="lg" text="Carregando alunos..." />
        </Card>
      ) : filteredAlunos.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={<Users />}
            title={searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
            description={
              searchTerm
                ? 'Tente ajustar os filtros ou termos de busca'
                : 'Comece adicionando seu primeiro aluno'
            }
            action={
              !searchTerm
                ? {
                    label: 'Adicionar Aluno',
                    onClick: () => setShowCreateModal(true),
                  }
                : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlunos.map((aluno) => (
            <Card key={aluno.id} hover className="p-5">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 shadow-glow-sm">
                  {aluno.nome.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white truncate">
                      {aluno.nome}
                    </h3>
                    {getStatusBadge(aluno.status)}
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{aluno.email}</span>
                    </div>
                    
                    {aluno.telefone && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{aluno.telefone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Desde {new Date(aluno.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-dark-800">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => onNavigate(`/expert/alunos/${aluno.id}`)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      <CreateAlunoModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          loadAlunos()
        }}
      />
    </div>
  )
}

// Modal de criação de aluno
interface CreateAlunoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function CreateAlunoModal({ isOpen, onClose, onSuccess }: CreateAlunoModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.alunos.create({
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone || undefined,
      })
      toast('success', 'Aluno criado com sucesso!')
      setFormData({ nome: '', email: '', telefone: '' })
      onSuccess()
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao criar aluno')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Aluno"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Criar Aluno
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome completo"
          placeholder="Ex: João Silva"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          required
        />

        <Input
          label="Email"
          type="email"
          placeholder="joao@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <Input
          label="Telefone (opcional)"
          placeholder="(11) 99999-9999"
          value={formData.telefone}
          onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
        />
      </form>
    </Modal>
  )
}
