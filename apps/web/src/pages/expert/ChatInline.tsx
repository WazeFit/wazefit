import { useState, useEffect, useRef, useCallback } from 'react'
import { api, type ChatMensagem, ApiError } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { getSavedUser } from '../../stores/auth'

interface Props {
  alunoId: string
}

export function ChatInline({ alunoId }: Props) {
  const { toast } = useToast()
  const [mensagens, setMensagens] = useState<ChatMensagem[]>([])
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const currentUser = getSavedUser()

  const loadMessages = useCallback(async () => {
    try {
      const msgs = await api.chat.mensagens(alunoId)
      setMensagens(msgs)
      api.chat.marcarLidas(alunoId).catch(() => {})
    } catch (err) {
      if (err instanceof ApiError && err.status !== 404) {
        toast('error', 'Erro ao carregar mensagens')
      }
    }
  }, [alunoId, toast])

  useEffect(() => {
    loadMessages()
    const interval = setInterval(loadMessages, 3000)
    return () => clearInterval(interval)
  }, [loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function handleSend() {
    if (!texto.trim()) return
    setSending(true)
    try {
      await api.chat.enviar(alunoId, texto.trim())
      setTexto('')
      loadMessages()
    } catch (err) {
      toast('error', err instanceof ApiError ? err.message : 'Erro ao enviar')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
        {mensagens.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">Nenhuma mensagem ainda</p>
        )}
        {mensagens.map((msg) => {
          const isMe = msg.remetente_id === currentUser?.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                isMe ? 'bg-green-500/20 text-green-100' : 'bg-gray-800 text-gray-300'
              }`}>
                {!isMe && <p className="text-xs text-gray-500 mb-0.5">{msg.remetente_nome}</p>}
                <p className="whitespace-pre-wrap">{msg.conteudo}</p>
                <p className="text-[10px] text-gray-600 mt-1 text-right">
                  {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
        />
        <Button onClick={handleSend} loading={sending} disabled={!texto.trim()}>Enviar</Button>
      </div>
    </div>
  )
}
