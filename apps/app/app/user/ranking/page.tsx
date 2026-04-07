"use client";

export const runtime = 'edge';

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, Trophy } from "lucide-react";
import { api, ApiError, type RankingEntry } from "@/lib/api";

function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("wf_user");
    if (!raw) return null;
    return JSON.parse(raw)?.id ?? null;
  } catch {
    return null;
  }
}

const MEDALHAS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
const PODIO_COLORS: Record<number, string> = {
  1: "from-yellow-500 to-amber-500",
  2: "from-gray-400 to-gray-500",
  3: "from-orange-600 to-orange-700",
};

function PodioCard({
  item,
  posicao,
  destaque = false,
}: {
  item: RankingEntry;
  posicao: number;
  destaque?: boolean;
}) {
  return (
    <div className={destaque ? "-mt-4" : ""}>
      <Card className={`text-center ${destaque ? "border-primary shadow-md" : ""}`}>
        <CardContent className="p-4 space-y-2">
          <div className="text-3xl">{MEDALHAS[posicao]}</div>
          <div
            className={`w-14 h-14 mx-auto bg-gradient-to-br ${PODIO_COLORS[posicao]} rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg`}
          >
            {item.nome.charAt(0).toUpperCase()}
          </div>
          <p className="font-semibold text-sm truncate">{item.nome}</p>
          <p className="text-xs text-muted-foreground">
            {item.treinos_semana} treinos
          </p>
          <span className="inline-block text-xs px-2 py-0.5 bg-muted rounded-full">
            {item.pontos} pts
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userId = useRef(getUserId());

  useEffect(() => {
    async function load() {
      try {
        const data = await api.ranking.list();
        setRanking(data);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Erro ao carregar ranking"
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

  const minhaPosicao = ranking.findIndex(
    (r) => r.aluno_id === userId.current
  );
  const meuItem = minhaPosicao >= 0 ? ranking[minhaPosicao] : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Ranking
        </h1>
        <p className="text-muted-foreground text-sm">
          Veja sua posição entre todos os alunos
        </p>
      </div>

      {/* My position highlight */}
      {meuItem && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-green-400 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md">
                  {meuItem.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">Você</p>
                  <p className="text-xs text-muted-foreground">
                    {meuItem.treinos_semana} treinos esta semana
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  #{minhaPosicao + 1}
                </p>
                <p className="text-xs text-muted-foreground">Posição</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Podium (Top 3) */}
      {ranking.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          <PodioCard item={ranking[1]!} posicao={2} />
          <PodioCard item={ranking[0]!} posicao={1} destaque />
          <PodioCard item={ranking[2]!} posicao={3} />
        </div>
      )}

      {/* Full list */}
      {ranking.length > 3 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">
              Classificação Completa
            </h2>
            <div className="space-y-2">
              {ranking.slice(3).map((item, index) => {
                const posicao = index + 4;
                const isMe = item.aluno_id === userId.current;
                return (
                  <div
                    key={item.aluno_id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      isMe
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                        {posicao}
                      </span>
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-sm font-bold">
                        {item.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p
                          className={`font-medium ${
                            isMe ? "text-primary" : ""
                          }`}
                        >
                          {item.nome}
                          {isMe && (
                            <span className="text-xs ml-2">(você)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.treinos_semana} treinos
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                      {item.pontos} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {ranking.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <span className="text-4xl block mb-3">🏃</span>
          <p className="text-sm">Nenhum treino registrado ainda.</p>
          <p className="text-xs mt-1">
            Complete seu primeiro treino para aparecer no ranking!
          </p>
        </div>
      )}
    </div>
  );
}
