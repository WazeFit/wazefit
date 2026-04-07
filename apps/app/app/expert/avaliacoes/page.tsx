"use client";
export const runtime = 'edge';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  ClipboardList,
  Activity,
  Scale,
  Loader2,
  Search,
  Calendar,
  User,
} from "lucide-react";
import { api, ApiError, type Avaliacao, type AvaliacaoInput, type AvaliacaoTipo, type Aluno, type PaginatedResponse } from "@/lib/api";

const TIPO_CONFIG: Record<AvaliacaoTipo, { label: string; icon: typeof ClipboardList; color: string; bg: string }> = {
  anamnese: { label: "Anamnese", icon: ClipboardList, color: "text-blue-400", bg: "bg-blue-500/10" },
  fisica: { label: "Avaliacao Fisica", icon: Activity, color: "text-green-400", bg: "bg-green-500/10" },
  bioimpedancia: { label: "Bioimpedancia", icon: Scale, color: "text-purple-400", bg: "bg-purple-500/10" },
};

export default function AvaliacoesPage() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipoFilter, setTipoFilter] = useState<AvaliacaoTipo | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadAvaliacoes();
  }, []);

  async function loadAvaliacoes() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.avaliacoes.list();
      setAvaliacoes(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar avaliacoes");
    } finally {
      setLoading(false);
    }
  }

  const filtered = avaliacoes.filter((a) => {
    const matchesTipo = tipoFilter === "all" || a.tipo === tipoFilter;
    const matchesSearch =
      !searchTerm ||
      (a.aluno_nome ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTipo && matchesSearch;
  });

  const stats = {
    total: avaliacoes.length,
    anamnese: avaliacoes.filter((a) => a.tipo === "anamnese").length,
    fisica: avaliacoes.filter((a) => a.tipo === "fisica").length,
    bioimpedancia: avaliacoes.filter((a) => a.tipo === "bioimpedancia").length,
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Avaliacoes</h1>
          <p className="text-muted-foreground">Gerencie avaliacoes dos seus alunos</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Avaliacao
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: ClipboardList, color: "text-primary" },
          { label: "Anamnese", value: stats.anamnese, icon: ClipboardList, color: "text-blue-400" },
          { label: "Fisica", value: stats.fisica, icon: Activity, color: "text-green-400" },
          { label: "Bioimpedancia", value: stats.bioimpedancia, icon: Scale, color: "text-purple-400" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
                <Icon className={`w-6 h-6 ${s.color} opacity-50`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-5 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "anamnese", "fisica", "bioimpedancia"] as const).map((f) => (
              <Button
                key={f}
                variant={tipoFilter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setTipoFilter(f)}
              >
                {f === "all" ? "Todos" : TIPO_CONFIG[f].label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

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

      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma avaliacao encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || tipoFilter !== "all" ? "Tente ajustar os filtros" : "Crie a primeira avaliacao de um aluno"}
            </p>
            {!searchTerm && tipoFilter === "all" && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Avaliacao
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((avaliacao) => {
            const config = TIPO_CONFIG[avaliacao.tipo];
            const Icon = config.icon;
            return (
              <Card key={avaliacao.id} className="hover:border-primary/50 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 ${config.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold truncate">{config.label}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${config.bg} ${config.color}`}>
                          {avaliacao.tipo}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{avaliacao.aluno_nome || "Aluno"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{new Date(avaliacao.data).toLocaleDateString("pt-BR")}</span>
                        </div>
                        {avaliacao.observacoes && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{avaliacao.observacoes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateAvaliacaoModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            loadAvaliacoes();
          }}
        />
      )}
    </div>
  );
}

function CreateAvaliacaoModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(true);
  const [formData, setFormData] = useState<{
    aluno_id: string;
    tipo: AvaliacaoTipo;
    data: string;
    observacoes: string;
  }>({
    aluno_id: "",
    tipo: "anamnese",
    data: new Date().toISOString().split("T")[0],
    observacoes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAlunos() {
      try {
        const res = await api.alunos.list(1, 100) as PaginatedResponse<Aluno>;
        setAlunos(res.data || []);
      } catch {
        // ignore
      } finally {
        setLoadingAlunos(false);
      }
    }
    loadAlunos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.aluno_id) {
      setError("Selecione um aluno");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const input: AvaliacaoInput = {
        aluno_id: formData.aluno_id,
        tipo: formData.tipo,
        data: formData.data,
        dados_json: {},
        observacoes: formData.observacoes || undefined,
      };
      await api.avaliacoes.create(input);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar avaliacao");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Nova Avaliacao</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div>
              <label className="text-sm font-medium mb-1 block">Aluno</label>
              {loadingAlunos ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando alunos...
                </div>
              ) : (
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.aluno_id}
                  onChange={(e) => setFormData({ ...formData, aluno_id: e.target.value })}
                  required
                >
                  <option value="">Selecione um aluno</option>
                  {alunos.map((a) => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tipo</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as AvaliacaoTipo })}
              >
                <option value="anamnese">Anamnese</option>
                <option value="fisica">Avaliacao Fisica</option>
                <option value="bioimpedancia">Bioimpedancia</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Data</label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Observacoes (opcional)</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
                placeholder="Observacoes sobre a avaliacao..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || loadingAlunos}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Avaliacao
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
