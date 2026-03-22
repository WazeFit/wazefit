/**
 * Página de Alunos — lista, busca, filtros e criação.
 */
import { useState, useEffect } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  Plus, 
  Search, 
  Users, 
  Mail, 
  Phone,
  Calendar,
  Activity,
} from 'lucide-react'

interface Aluno {
  id: string
  nome: string
  email: string
  telefone?: string
  status: 'ativo' | 'inativo' | 'trial'
  dataInicio: string
  ultimoTreino?: string
  avatar?: string
}

export function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo' | 'trial'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Mock data - substituir por API real
  useEffect(() => {
    setTimeout(() => {
      setAlunos([
        {
          id: '1',
          nome: 'João Silva',
          email: 'joao@example.com',
          telefone: '(11) 99999-9999',
          status: 'ativo',
          dataInicio: '2024-01-15',
          ultimoTreino: '2024-03-20',
        },
        {
          id: '2',
          nome: 'Maria Santos',
          email: 'maria@example.com',
          status: 'ativo',
          dataInicio: '2024-02-01',
          ultimoTreino: '2024-03-21',
        },
        {
          id: '3',
          nome: 'Pedro Oliveira',
          email: 'pedro@example.com',
          telefone: '(11) 98888-8888',
          status: 'trial',
          dataInicio: '2024-03-15',
        },
        {
          id: '4',
          nome: 'Ana Costa',
          email: 'ana@example.com',
          status: 'inativo',
          dataInicio: '2023-12-01',
          ultimoTreino: '2024-02-28',
        },
      ])
      setLoading(false)
    }, 800)
  }, [])

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

  const getStatusBadge = (status: Aluno['status']) => {
    const variants = {
      ativo: 'success' as const,
      trial: 'warning' as const,
      inativo: 'default' as const,
    }
    const labels = {
      ativo: 'Ativo',
      trial: 'Trial',
      inativo: 'Inativo',
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
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
                      <span>Desde {new Date(aluno.dataInicio).toLocaleDateString('pt-BR')}</span>
                    </div>

                    {aluno.ultimoTreino && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Activity className="w-4 h-4 flex-shrink-0" />
                        <span>Último treino: {new Date(aluno.ultimoTreino).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-dark-800">
                    <Button variant="ghost" size="sm" className="w-full">
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
        onSuccess={(novoAluno) => {
          setAlunos([...alunos, novoAluno])
          setShowCreateModal(false)
        }}
      />
    </div>
  )
}

// Modal de criação de aluno
interface CreateAlunoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (aluno: Aluno) => void
}

function CreateAlunoModal({ isOpen, onClose, onSuccess }: CreateAlunoModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    status: 'trial' as Aluno['status'],
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simular API call
    setTimeout(() => {
      const novoAluno: Aluno = {
        id: String(Date.now()),
        nome: formData.nome,
        email: formData.email,
        ...(formData.telefone && { telefone: formData.telefone }),
        status: formData.status,
        dataInicio: new Date().toISOString().split('T')[0]!,
      }
      onSuccess(novoAluno)
      setLoading(false)
      setFormData({ nome: '', email: '', telefone: '', status: 'trial' })
    }, 1000)
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

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Status inicial
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['trial', 'ativo', 'inativo'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFormData({ ...formData, status })}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${formData.status === status
                    ? 'bg-brand-500 text-white'
                    : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                  }
                `}
              >
                {status === 'trial' && 'Trial'}
                {status === 'ativo' && 'Ativo'}
                {status === 'inativo' && 'Inativo'}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}
