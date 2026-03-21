import { useState, useEffect, useCallback } from 'react'
import { api, type Conversa, ApiError } from '../../lib/api'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { ChatInline } from './ChatInline'

interface Props {
  alunoId?: string
  onNavigate: (path: string) => void
}

export function ChatPage({ alunoId, onNavigate }: Props) {
  const { toast } = useToast()
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setConversas(await api.chat.conversas())
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao carregar conversas')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [load])

  if (loading) return <PageLoader />

  // Se tem alunoId selecionado, mostrar chat
  if (alunoId) {
    const conversa = conversas.find((c) => c.aluno_id === alunoId)
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => onNavigate('/expert/chat')} className="text-gray-400 hover:text-white transition-colors">← Voltar</button>
          <h1 className="text-xl font-bold">{conversa?.aluno_nome ?? 'Chat'}</h1>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <ChatInline alunoId={alunoId} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Chat</h1>
        <p className="text-gray-400 text-sm">Conversas com seus alunos</p>
      </div>

      {conversas.length === 0 ? (
        <EmptyState icon="💬" title="Nenhuma conversa" description="As conversas com alunos aparecerão aqui." />
      ) : (
        <div className="space-y-2">
          {conversas.map((conv) => (
            <button
              key={conv.aluno_id}
              onClick={() => onNavigate(`/expert/chat/${conv.aluno_id}`)}
              className="w-full flex items-center gap-4 bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                {conv.aluno_nome.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white truncate">{conv.aluno_nome}</h3>
                  <span className="text-xs text-gray-500 shrink-0">
                    {new Date(conv.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-gray-400 truncate">{conv.ultima_mensagem}</p>
              </div>
              {conv.nao_lidas > 0 && (
                <Badge variant="success">{conv.nao_lidas}</Badge>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
