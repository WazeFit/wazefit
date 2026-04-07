"use client";

export const runtime = 'edge';

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  AlertCircle,
  Flame,
  Beef,
  Wheat,
  Droplet,
  UtensilsCrossed,
  Clock,
} from "lucide-react";
import { api, ApiError, type PlanoNutricional, type Alimento } from "@/lib/api";

function calcRefeicaoTotals(alimentos: Alimento[]) {
  return alimentos.reduce(
    (acc, a) => ({
      calorias: acc.calorias + (a.calorias || 0),
      proteina: acc.proteina + (a.proteina_g || 0),
      carb: acc.carb + (a.carboidrato_g || 0),
      gordura: acc.gordura + (a.gordura_g || 0),
    }),
    { calorias: 0, proteina: 0, carb: 0, gordura: 0 }
  );
}

export default function DietaPage() {
  const [plano, setPlano] = useState<PlanoNutricional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const result = await api.nutricao.meuPlano();
        setPlano(result);
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          setError("Sem permissão para ver planos nutricionais.");
        } else {
          setError("Erro ao carregar plano nutricional.");
        }
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

  if (!plano) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <span className="text-5xl">🥗</span>
        <h2 className="text-xl font-bold">Nenhum plano nutricional</h2>
        <p className="text-muted-foreground text-sm">
          Seu profissional ainda não criou um plano nutricional para você.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          {plano.nome}
        </h1>
        {plano.objetivo && (
          <p className="text-muted-foreground text-sm mt-1">{plano.objetivo}</p>
        )}
      </div>

      {/* Daily macros */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <p className="text-2xl font-bold">{plano.calorias_diarias || 0}</p>
            <p className="text-xs text-muted-foreground">kcal/dia</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Beef className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold">{plano.proteina_g || 0}g</p>
            <p className="text-xs text-muted-foreground">Proteína</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Wheat className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
            <p className="text-2xl font-bold">{plano.carboidrato_g || 0}g</p>
            <p className="text-xs text-muted-foreground">Carboidrato</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Droplet className="h-5 w-5 mx-auto mb-1 text-red-500" />
            <p className="text-2xl font-bold">{plano.gordura_g || 0}g</p>
            <p className="text-xs text-muted-foreground">Gordura</p>
          </CardContent>
        </Card>
      </div>

      {/* Meals */}
      {(plano.refeicoes || [])
        .sort((a, b) => a.ordem - b.ordem)
        .map((ref) => {
          const totals = calcRefeicaoTotals(ref.alimentos || []);
          return (
            <Card key={ref.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{ref.nome}</h3>
                    {ref.horario && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {ref.horario}
                      </span>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                    {totals.calorias} kcal
                  </span>
                </div>

                {(ref.alimentos || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sem alimentos cadastrados
                  </p>
                ) : (
                  <div className="space-y-2">
                    {ref.alimentos.map((al) => (
                      <div
                        key={al.id}
                        className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0"
                      >
                        <div>
                          <span className="font-medium">{al.nome}</span>
                          <span className="text-muted-foreground ml-2">
                            {al.quantidade} {al.unidade}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-x-2">
                          <span>{al.calorias}kcal</span>
                          <span className="text-blue-500">P:{al.proteina_g}g</span>
                          <span className="text-yellow-500">C:{al.carboidrato_g}g</span>
                          <span className="text-red-500">G:{al.gordura_g}g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-2 border-t flex justify-end text-xs text-muted-foreground space-x-3">
                  <span>P: {totals.proteina}g</span>
                  <span>C: {totals.carb}g</span>
                  <span>G: {totals.gordura}g</span>
                </div>
              </CardContent>
            </Card>
          );
        })}

      {/* Notes */}
      {plano.observacoes && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Observações</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {plano.observacoes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
