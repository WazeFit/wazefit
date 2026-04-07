"use client";
export const runtime = 'edge';

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Send,
  Loader2,
  Search,
  ArrowLeft,
} from "lucide-react";
import { api, ApiError, type Conversa, type ChatMensagem } from "@/lib/api";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const initialAlunoId = searchParams.get("alunoId");

  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAluno, setSelectedAluno] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const [mensagens, setMensagens] = useState<ChatMensagem[]>([]);
  const [loadingMensagens, setLoadingMensagens] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadConversas = useCallback(async () => {
    try {
      const data = await api.chat.conversas();
      setConversas(data);
    } catch (err) {
      if (loading) {
        setError(err instanceof ApiError ? err.message : "Erro ao carregar conversas");
      }
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    loadConversas();
  }, [loadConversas]);

  // Polling for new conversations
  useEffect(() => {
    const interval = setInterval(() => {
      api.chat.conversas().then(setConversas).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-select from searchParams
  useEffect(() => {
    if (initialAlunoId && conversas.length > 0 && !selectedAluno) {
      const conv = conversas.find((c) => c.aluno_id === initialAlunoId);
      if (conv) {
        setSelectedAluno({ id: conv.aluno_id, nome: conv.aluno_nome });
      }
    }
  }, [initialAlunoId, conversas, selectedAluno]);

  // Load messages when selecting a conversation
  useEffect(() => {
    if (!selectedAluno) {
      setMensagens([]);
      return;
    }

    setLoadingMensagens(true);
    api.chat
      .mensagens(selectedAluno.id)
      .then((data) => {
        setMensagens(data);
        api.chat.marcarLidas(selectedAluno.id).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoadingMensagens(false));

    // Polling for new messages
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      api.chat.mensagens(selectedAluno.id).then((data) => {
        setMensagens(data);
      }).catch(() => {});
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedAluno]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedAluno) return;

    setSending(true);
    try {
      const msg = await api.chat.enviar(selectedAluno.id, newMessage.trim());
      setMensagens((prev) => [...prev, msg]);
      setNewMessage("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  }

  const filteredConversas = conversas.filter((c) =>
    c.aluno_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return d.toLocaleDateString("pt-BR", { weekday: "short" });
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  return (
    <div className="p-8 h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
          <p className="text-muted-foreground">Converse com seus alunos</p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive mb-4">
          <CardContent className="p-3 text-destructive text-sm">{error}</CardContent>
        </Card>
      )}

      <Card className="h-[calc(100%-5rem)] overflow-hidden">
        <div className="flex h-full">
          {/* Conversations list */}
          <div
            className={`w-full md:w-80 border-r border-border flex flex-col ${
              selectedAluno ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredConversas.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma conversa</p>
                </div>
              ) : (
                filteredConversas.map((conv) => (
                  <button
                    key={conv.aluno_id}
                    onClick={() =>
                      setSelectedAluno({ id: conv.aluno_id, nome: conv.aluno_nome })
                    }
                    className={`w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left border-b border-border/50 ${
                      selectedAluno?.id === conv.aluno_id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold flex-shrink-0">
                      {conv.aluno_nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">
                          {conv.aluno_nome}
                        </span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatTime(conv.updated_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.ultima_mensagem}
                        </p>
                        {conv.nao_lidas > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center flex-shrink-0">
                            {conv.nao_lidas}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Messages area */}
          <div
            className={`flex-1 flex flex-col ${
              !selectedAluno ? "hidden md:flex" : "flex"
            }`}
          >
            {!selectedAluno ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-1">Selecione uma conversa</h3>
                  <p className="text-sm text-muted-foreground">
                    Escolha um aluno para iniciar o chat
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <button
                    onClick={() => setSelectedAluno(null)}
                    className="md:hidden p-1 hover:bg-accent rounded-md"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold flex-shrink-0">
                    {selectedAluno.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{selectedAluno.nome}</h3>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMensagens ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : mensagens.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        Nenhuma mensagem ainda. Envie a primeira!
                      </p>
                    </div>
                  ) : (
                    mensagens.map((msg) => {
                      const isMe = msg.remetente_id !== selectedAluno.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-accent rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.conteudo}</p>
                            <p
                              className={`text-[10px] mt-1 ${
                                isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form
                  onSubmit={handleSend}
                  className="p-4 border-t border-border flex gap-2"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
