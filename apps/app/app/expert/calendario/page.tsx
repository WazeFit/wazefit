"use client";
export const runtime = 'edge';

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Loader2,
  Save,
  Dumbbell,
  ChevronDown,
  Check,
} from "lucide-react";
import { api, ApiError, type CalendarioData, type Aluno, type Ficha, type PaginatedResponse } from "@/lib/api";

const DIAS_SEMANA = [
  { key: "segunda", label: "Segunda" },
  { key: "terca", label: "Terca" },
  { key: "quarta", label: "Quarta" },
  { key: "quinta", label: "Quinta" },
  { key: "sexta", label: "Sexta" },
  { key: "sabado", label: "Sabado" },
  { key: "domingo", label: "Domingo" },
];

export default function CalendarioPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [selectedAluno, setSelectedAluno] = useState<string>("");
  const [calendario, setCalendario] = useState<CalendarioData>({});
  const [loading, setLoading] = useState(true);
  const [loadingCalendario, setLoadingCalendario] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [alunosRes, fichasRes] = await Promise.all([
          api.alunos.list(1, 100) as Promise<PaginatedResponse<Aluno>>,
          api.fichas.list(),
        ]);
        setAlunos(alunosRes.data || []);
        setFichas(fichasRes);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  const loadCalendario = useCallback(async (alunoId: string) => {
    if (!alunoId) return;
    setLoadingCalendario(true);
    setError(null);
    setSaved(false);
    try {
      const data = await api.calendario.get(alunoId);
      setCalendario(data || {});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar calendario");
      setCalendario({});
    } finally {
      setLoadingCalendario(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAluno) {
      loadCalendario(selectedAluno);
    }
  }, [selectedAluno, loadCalendario]);

  const handleDiaChange = (dia: string, fichaId: string) => {
    setSaved(false);
    setCalendario((prev) => ({
      ...prev,
      [dia]: fichaId ? { ficha_id: fichaId } : null,
    }));
  };

  const handleSave = async () => {
    if (!selectedAluno) return;
    setSaving(true);
    setError(null);
    try {
      await api.calendario.save(selectedAluno, calendario);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar calendario");
    } finally {
      setSaving(false);
    }
  };

  const selectedAlunoNome = alunos.find((a) => a.id === selectedAluno)?.nome;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
          <p className="text-muted-foreground">Defina a ficha de treino para cada dia da semana</p>
        </div>
        {selectedAluno && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-5">
          <label className="text-sm font-medium mb-2 block">Selecione o aluno</label>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          ) : (
            <div className="relative">
              <select
                className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none pr-8"
                value={selectedAluno}
                onChange={(e) => setSelectedAluno(e.target.value)}
              >
                <option value="">Selecione um aluno...</option>
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-5 text-destructive">{error}</CardContent>
        </Card>
      )}

      {selectedAluno && loadingCalendario && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {selectedAluno && !loadingCalendario && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Calendario de <span className="font-medium text-foreground">{selectedAlunoNome}</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DIAS_SEMANA.map((dia) => {
              const entry = calendario[dia.key];
              const fichaId = entry?.ficha_id || "";
              const fichaObj = fichas.find((f) => f.id === fichaId);

              return (
                <Card key={dia.key} className={fichaId ? "border-primary/30" : ""}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      {dia.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={fichaId}
                      onChange={(e) => handleDiaChange(dia.key, e.target.value)}
                    >
                      <option value="">Descanso</option>
                      {fichas.map((f) => (
                        <option key={f.id} value={f.id}>{f.nome}</option>
                      ))}
                    </select>
                    {fichaObj && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Dumbbell className="w-3 h-3" />
                        <span>{fichaObj.exercicios?.length || 0} exercicios</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {!selectedAluno && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Selecione um aluno</h3>
            <p className="text-muted-foreground">
              Escolha um aluno acima para configurar o calendario de treinos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
