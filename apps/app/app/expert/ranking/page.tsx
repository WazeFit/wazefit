"use client";
export const runtime = 'edge';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  Medal,
  Loader2,
  Dumbbell,
  Star,
  TrendingUp,
} from "lucide-react";
import { api, ApiError, type RankingEntry } from "@/lib/api";

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.ranking.list();
        setRanking(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Erro ao carregar ranking");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const podium = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  const podiumColors = [
    { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", icon: Trophy },
    { bg: "bg-gray-400/10", border: "border-gray-400/30", text: "text-gray-400", icon: Medal },
    { bg: "bg-amber-700/10", border: "border-amber-700/30", text: "text-amber-600", icon: Medal },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ranking</h1>
        <p className="text-muted-foreground">Classificacao dos alunos por pontuacao</p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-5 text-destructive">{error}</CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && ranking.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ranking vazio</h3>
            <p className="text-muted-foreground">
              Os alunos aparecerao aqui conforme realizarem treinos
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && podium.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {podium.map((entry, index) => {
              const style = podiumColors[index];
              const Icon = style.icon;
              return (
                <Card key={entry.aluno_id} className={`${style.border} border`}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 ${style.bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                      <Icon className={`w-8 h-8 ${style.text}`} />
                    </div>
                    <p className={`text-3xl font-bold ${style.text} mb-1`}>{entry.posicao}o</p>
                    <h3 className="font-semibold text-lg mb-2">{entry.nome}</h3>
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        {entry.pontos} pts
                      </span>
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-4 h-4" />
                        {entry.treinos_semana}/sem
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {rest.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Demais posicoes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {rest.map((entry) => (
                    <div key={entry.aluno_id} className="flex items-center gap-4 px-5 py-3.5">
                      <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                        {entry.posicao}
                      </span>
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold flex-shrink-0">
                        {entry.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{entry.nome}</h4>
                        <p className="text-sm text-muted-foreground">
                          {entry.treinos_semana} treinos/semana
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{entry.pontos}</p>
                        <p className="text-xs text-muted-foreground">pontos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
