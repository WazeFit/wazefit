"use client";

export const runtime = 'edge';

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Loader2, CheckCircle2, Play, AlertCircle } from "lucide-react";
import { api, ApiError, type TreinoHoje } from "@/lib/api";

function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("wf_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id ?? null;
  } catch {
    return null;
  }
}

export default function TreinosPage() {
  const [treino, setTreino] = useState<TreinoHoje | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      setError("Usuário não encontrado. Faça login novamente.");
      setLoading(false);
      return;
    }
    try {
      const data = await api.treino.hoje(userId);
      setTreino(data);
    } catch (err) {
      if (err instanceof ApiError && err.status !== 404) {
        setError("Erro ao carregar treino de hoje.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggleExercise(exercicioId: string) {
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exercicioId)) {
        next.delete(exercicioId);
      } else {
        next.add(exercicioId);
      }
      return next;
    });
  }

  async function handleCheckIn() {
    if (!treino?.ficha) return;

    const totalExercicios = treino.ficha.exercicios.length;
    const completados = completedExercises.size;

    if (completados < totalExercicios) {
      const confirmar = window.confirm(
        `Você completou ${completados} de ${totalExercicios} exercícios. Deseja concluir mesmo assim?`
      );
      if (!confirmar) return;
    }

    setCheckingIn(true);
    try {
      await api.execucoes.create({ ficha_id: treino.ficha.id });
      setCheckedIn(true);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro no check-in");
    } finally {
      setCheckingIn(false);
    }
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

  if (!treino?.ficha) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <span className="text-5xl">😴</span>
        <h2 className="text-xl font-bold">{treino?.mensagem ?? "Dia de descanso"}</h2>
        <p className="text-muted-foreground text-sm">
          Nenhum treino programado para hoje. Aproveite para descansar!
        </p>
      </div>
    );
  }

  const ficha = treino.ficha;
  const totalExercicios = ficha.exercicios.length;
  const completados = completedExercises.size;
  const progresso = totalExercicios > 0 ? Math.round((completados / totalExercicios) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6">
      {/* Header */}
      <div className="text-center">
        <span className="inline-block text-xs px-3 py-1 bg-primary/10 text-primary rounded-full mb-2">
          {treino.dia_semana}
        </span>
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Dumbbell className="h-6 w-6 text-primary" />
          {ficha.nome}
        </h1>
        {ficha.descricao && (
          <p className="text-muted-foreground text-sm mt-1">{ficha.descricao}</p>
        )}
      </div>

      {/* Progress bar */}
      {!checkedIn && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progresso</span>
              <span className="text-sm font-semibold text-primary">
                {completados}/{totalExercicios}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise list */}
      <div className="space-y-3">
        {ficha.exercicios.map((ex) => {
          const isCompleted = completedExercises.has(ex.exercicio_id);
          return (
            <Card
              key={ex.exercicio_id}
              className={isCompleted ? "border-primary/30 bg-primary/5" : ""}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleExercise(ex.exercicio_id)}
                    className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30 hover:border-primary/50"
                    }`}
                    disabled={checkedIn}
                  >
                    {isCompleted && <CheckCircle2 className="h-4 w-4" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-medium transition-colors ${
                        isCompleted ? "text-muted-foreground line-through" : ""
                      }`}
                    >
                      {ex.exercicio?.nome ?? ex.exercicio_id}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-semibold text-primary">
                        {ex.series}x{ex.repeticoes}
                      </span>
                      {" · "}
                      {ex.descanso_seg}s descanso
                    </p>
                    {ex.observacoes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {ex.observacoes}
                      </p>
                    )}
                    {ex.exercicio?.video_url && (
                      <a
                        href={ex.exercicio.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                      >
                        <Play className="h-3 w-3" /> Ver técnica
                      </a>
                    )}
                  </div>

                  {/* Order */}
                  <span className="text-xs text-muted-foreground shrink-0 font-mono">
                    #{ex.ordem}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Check-in button */}
      <div className="text-center">
        {checkedIn ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6 text-center">
              <span className="text-5xl block mb-3">🎉</span>
              <p className="text-primary font-semibold text-lg">Treino concluído!</p>
              <p className="text-muted-foreground text-sm mt-1">
                Ótimo trabalho! Continue assim.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Button
            size="lg"
            onClick={handleCheckIn}
            disabled={completados === 0 || checkingIn}
            className="w-full sm:w-auto"
          >
            {checkingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {completados === totalExercicios
              ? "Concluir Treino"
              : `Concluir (${completados}/${totalExercicios})`}
          </Button>
        )}
      </div>
    </div>
  );
}
