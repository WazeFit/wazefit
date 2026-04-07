"use client";

export const runtime = 'edge';

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, MessageCircle, AlertCircle } from "lucide-react";
import { api, ApiError, type ChatMensagem } from "@/lib/api";

function getUser(): { id: string; nome?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("wf_user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function ChatPage() {
  const [mensagens, setMensagens] = useState<ChatMensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const user = useRef(getUser());

  const loadMessages = useCallback(async () => {
    const u = user.current;
    if (!u) return;
    try {
      const msgs = await api.chat.mensagens(u.id);
      setMensagens(msgs);
      api.chat.marcarLidas(u.id).catch(() => {});
    } catch (err) {
      if (err instanceof ApiError && err.status !== 404) {
        setError("Erro ao carregar mensagens.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function handleSend() {
    const u = user.current;
    if (!texto.trim() || !u) return;
    setSending(true);
    try {
      await api.chat.enviar(u.id, texto.trim());
      setTexto("");
      await loadMessages();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!user.current) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-destructive text-sm">Usuário não encontrado. Faça login novamente.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-2xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" />
          Chat com Expert
        </h1>
        <p className="text-muted-foreground text-sm">
          Converse com seu personal trainer
        </p>
      </div>

      {/* Messages */}
      <Card className="flex-1 mb-4 overflow-hidden">
        <CardContent className="p-4 h-full overflow-y-auto space-y-3">
          {mensagens.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              Envie uma mensagem para seu expert!
            </p>
          )}
          {mensagens.map((msg) => {
            const isMe = msg.remetente_id === user.current?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    isMe
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {!isMe && (
                    <p className="text-xs text-muted-foreground mb-0.5 font-medium">
                      {msg.remetente_nome}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.conteudo}</p>
                  <p className="text-[10px] opacity-60 mt-1 text-right">
                    {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </CardContent>
      </Card>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Digite sua mensagem..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          onClick={handleSend}
          size="icon"
          disabled={!texto.trim() || sending}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
