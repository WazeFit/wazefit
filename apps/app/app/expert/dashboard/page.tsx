"use client";
export const runtime = 'edge';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Dumbbell, MessageSquare, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { api } from "@/lib/api";

interface DashboardData {
  totalAlunos: number;
  treinosHoje: number;
  mensagensNaoLidas: number;
  receitaMes: number;
}

export default function ExpertDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [alunos, conversas, financeiro] = await Promise.allSettled([
          api.alunos.list(1, 1),
          api.chat.conversas(),
          api.financeiro.resumo(),
        ]);

        setData({
          totalAlunos:
            alunos.status === "fulfilled"
              ? ((alunos.value as { total?: number })?.total ?? 0)
              : 0,
          treinosHoje: 0,
          mensagensNaoLidas:
            conversas.status === "fulfilled"
              ? ((conversas.value as { nao_lidas?: number }[])?.reduce(
                  (acc, c) => acc + (c.nao_lidas ?? 0),
                  0,
                ) ?? 0)
              : 0,
          receitaMes:
            financeiro.status === "fulfilled"
              ? ((financeiro.value as { receita_mes?: number })?.receita_mes ?? 0)
              : 0,
        });
      } catch {
        setData({ totalAlunos: 0, treinosHoje: 0, mensagensNaoLidas: 0, receitaMes: 0 });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = [
    {
      icon: Users,
      label: "Alunos Ativos",
      value: loading ? "..." : String(data?.totalAlunos ?? 0),
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      path: "/expert/alunos",
    },
    {
      icon: Dumbbell,
      label: "Treinos Hoje",
      value: loading ? "..." : String(data?.treinosHoje ?? 0),
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      path: "/expert/fichas",
    },
    {
      icon: MessageSquare,
      label: "Mensagens",
      value: loading ? "..." : String(data?.mensagensNaoLidas ?? 0),
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      path: "/expert/chat",
    },
    {
      icon: DollarSign,
      label: "Receita Mensal",
      value: loading ? "..." : `R$ ${(data?.receitaMes ?? 0).toFixed(2)}`,
      color: "text-green-400",
      bg: "bg-green-500/10",
      path: "/expert/financeiro",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visao geral da sua plataforma</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.label}
              className="cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => router.push(card.path)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!loading && data?.totalAlunos === 0 && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Comece agora!</h2>
            <p className="text-muted-foreground mb-6">
              Cadastre seu primeiro aluno, crie exercicios e monte fichas de treino personalizadas.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push("/expert/alunos")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Adicionar Aluno
              </button>
              <button
                onClick={() => router.push("/expert/exercicios")}
                className="px-4 py-2 border border-input rounded-md hover:bg-accent"
              >
                Criar Exercicios
              </button>
            </div>
          </div>
        </Card>
      )}

      {!loading && data && data.totalAlunos > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="cursor-pointer hover:border-primary/50 transition-all"
            onClick={() => router.push("/expert/alunos")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary" />
                Atividades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Veja as ultimas atividades dos seus alunos.</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/50 transition-all"
            onClick={() => router.push("/expert/analytics")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Metricas de engajamento e retencao.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
