"use client";
export const runtime = 'edge';

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  Dumbbell,
  CalendarDays,
  TrendingUp,
  MessageSquare,
  DollarSign,
} from "lucide-react";
import { api, ApiError, type Aluno, type Ficha, type CalendarioData, type EvolucaoData, type Cobranca } from "@/lib/api";

type Tab = "fichas" | "calendario" | "evolucao" | "chat" | "financeiro";

const TABS: { key: Tab; label: string; icon: typeof Dumbbell }[] = [
  { key: "fichas", label: "Fichas", icon: Dumbbell },
  { key: "calendario", label: "Calendario", icon: CalendarDays },
  { key: "evolucao", label: "Evolucao", icon: TrendingUp },
  { key: "chat", label: "Chat", icon: MessageSquare },
  { key: "financeiro", label: "Financeiro", icon: DollarSign },
];

export default function AlunoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("fichas");

  useEffect(() => {
    async function load() {
      try {
        const data = await api.alunos.get(id);
        setAluno(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Erro ao carregar aluno");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !aluno) {
    return (
      <div className="p-8 space-y-4">
        <Button variant="ghost" onClick={() => router.push("/expert/alunos")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Card className="border-destructive">
          <CardContent className="p-5 text-destructive">
            {error || "Aluno nao encontrado"}
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ativo: "bg-green-500/10 text-green-400 border-green-500/20",
      trial: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      inativo: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[status] || styles.inativo}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-8 space-y-6">
      <Button variant="ghost" onClick={() => router.push("/expert/alunos")} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para Alunos
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">
              {aluno.nome.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{aluno.nome}</h1>
                {statusBadge(aluno.status)}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" /> {aluno.email}
                </span>
                {aluno.telefone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4" /> {aluno.telefone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Desde {new Date(aluno.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "fichas" && <FichasTab alunoId={id} />}
      {activeTab === "calendario" && <CalendarioTab alunoId={id} />}
      {activeTab === "evolucao" && <EvolucaoTab alunoId={id} />}
      {activeTab === "chat" && <ChatTab alunoId={id} />}
      {activeTab === "financeiro" && <FinanceiroTab alunoId={id} />}
    </div>
  );
}

function FichasTab({ alunoId }: { alunoId: string }) {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const all = await api.fichas.list();
        setFichas(all);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Erro ao carregar fichas");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [alunoId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-5 text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (fichas.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma ficha encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {fichas.map((ficha) => (
        <Card key={ficha.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{ficha.nome}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              {ficha.exercicios?.length || 0} exercicios
              {ficha.tipo && ` | ${ficha.tipo}`}
            </p>
            {ficha.descricao && (
              <p className="text-xs text-muted-foreground line-clamp-2">{ficha.descricao}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CalendarioTab({ alunoId }: { alunoId: string }) {
  const [calendario, setCalendario] = useState<CalendarioData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const DIAS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
  const DIAS_LABELS: Record<string, string> = {
    segunda: "Seg", terca: "Ter", quarta: "Qua", quinta: "Qui",
    sexta: "Sex", sabado: "Sab", domingo: "Dom",
  };

  useEffect(() => {
    async function load() {
      try {
        const data = await api.calendario.get(alunoId);
        setCalendario(data || {});
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Erro ao carregar calendario");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [alunoId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-5 text-destructive">{error}</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {DIAS.map((dia) => {
        const entry = calendario[dia];
        return (
          <Card key={dia} className={entry?.ficha_id ? "border-primary/30" : ""}>
            <CardContent className="p-3 text-center">
              <p className="text-xs font-medium text-muted-foreground mb-1">{DIAS_LABELS[dia]}</p>
              {entry?.ficha_id ? (
                <div>
                  <CalendarDays className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xs font-medium truncate">{entry.ficha_nome || "Treino"}</p>
                </div>
              ) : (
                <div>
                  <div className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Descanso</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function EvolucaoTab({ alunoId }: { alunoId: string }) {
  const [evolucao, setEvolucao] = useState<EvolucaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.evolucao.get(alunoId);
        setEvolucao(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Erro ao carregar evolucao");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [alunoId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-5 text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (!evolucao) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Sem dados de evolucao</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-primary">{evolucao.total_treinos}</p>
            <p className="text-sm text-muted-foreground">Total de treinos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-blue-400">{evolucao.frequencia_semanal.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Frequencia semanal</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-green-400">{evolucao.sequencia_atual}</p>
            <p className="text-sm text-muted-foreground">Sequencia atual</p>
          </CardContent>
        </Card>
      </div>

      {evolucao.historico && evolucao.historico.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historico (ultimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {evolucao.historico.map((h) => (
                <div
                  key={h.data}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium ${
                    h.treinou
                      ? "bg-green-500/20 text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                  title={`${new Date(h.data).toLocaleDateString("pt-BR")} - ${h.treinou ? "Treinou" : "Nao treinou"}`}
                >
                  {new Date(h.data).getDate()}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ChatTab({ alunoId }: { alunoId: string }) {
  const router = useRouter();

  return (
    <Card>
      <CardContent className="p-8 text-center">
        <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-2">Chat</h3>
        <p className="text-muted-foreground mb-4">
          Acesse a conversa completa com este aluno
        </p>
        <Button onClick={() => router.push(`/expert/chat?aluno=${alunoId}`)}>
          <MessageSquare className="w-4 h-4 mr-2" />
          Abrir Chat
        </Button>
      </CardContent>
    </Card>
  );
}

function FinanceiroTab({ alunoId }: { alunoId: string }) {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const all = await api.cobrancas.list();
        const filtered = all.filter((c) => c.aluno_id === alunoId);
        setCobrancas(filtered);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Erro ao carregar financeiro");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [alunoId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-5 text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (cobrancas.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma cobranca encontrada</p>
        </CardContent>
      </Card>
    );
  }

  const statusStyles: Record<string, string> = {
    pago: "bg-green-500/10 text-green-400",
    pendente: "bg-yellow-500/10 text-yellow-400",
    atrasado: "bg-red-500/10 text-red-400",
    cancelado: "bg-gray-500/10 text-gray-400",
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {cobrancas.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="font-medium">R$ {c.valor.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  Vencimento: {new Date(c.vencimento).toLocaleDateString("pt-BR")}
                  {c.descricao && ` - ${c.descricao}`}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[c.status] || statusStyles.pendente}`}>
                {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
