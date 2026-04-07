"use client";
export const runtime = 'edge';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Dumbbell,
  TrendingUp,
  DollarSign,
  Loader2,
  BarChart3,
  Activity,
  Target,
} from "lucide-react";
import { api, ApiError, type AnalyticsDashboard } from "@/lib/api";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.analytics.dashboard();
        setData(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Erro ao carregar analytics");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpis = [
    {
      icon: Users,
      label: "Alunos Ativos",
      value: String(data?.alunos_ativos ?? 0),
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Dumbbell,
      label: "Treinos/Semana",
      value: String(data?.treinos_semana ?? 0),
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: Target,
      label: "Taxa de Aderencia",
      value: `${(data?.taxa_aderencia ?? 0).toFixed(0)}%`,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      icon: DollarSign,
      label: "Receita Mensal",
      value: `R$ ${(data?.receita_mes ?? 0).toFixed(2)}`,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Metricas e insights sobre sua plataforma</p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-5 text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                <div className={`w-10 h-10 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
              Treinos por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.treinos_por_dia && data.treinos_por_dia.length > 0 ? (
              <div className="space-y-2">
                {data.treinos_por_dia.slice(-7).map((item) => {
                  const maxCount = Math.max(...data.treinos_por_dia.map((d) => d.count), 1);
                  const pct = (item.count / maxCount) * 100;
                  return (
                    <div key={item.data} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20 flex-shrink-0">
                        {new Date(item.data).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" })}
                      </span>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sem dados de treino recentes</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              Top Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.top_ranking && data.top_ranking.length > 0 ? (
              <div className="space-y-3">
                {data.top_ranking.map((entry, i) => (
                  <div key={entry.aluno_nome} className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                      i === 1 ? "bg-gray-400/20 text-gray-400" :
                      i === 2 ? "bg-amber-700/20 text-amber-600" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.aluno_nome}</p>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {entry.treinos} treinos
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sem dados de ranking</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
