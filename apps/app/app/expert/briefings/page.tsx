"use client";
export const runtime = 'edge';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  FileText,
  Loader2,
  Search,
  ChevronRight,
  X,
  ClipboardCheck,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  api,
  ApiError,
  type Briefing,
  type BriefingDetail,
  type Aluno,
  type PaginatedResponse,
} from "@/lib/api";

export default function BriefingsPage() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBriefing, setSelectedBriefing] = useState<BriefingDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    loadBriefings();
  }, []);

  async function loadBriefings() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.briefings.list();
      setBriefings(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar briefings");
    } finally {
      setLoading(false);
    }
  }

  async function viewBriefing(id: string) {
    setLoadingDetail(true);
    try {
      const detail = await api.briefings.get(id);
      setSelectedBriefing(detail);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar briefing");
    } finally {
      setLoadingDetail(false);
    }
  }

  const filteredBriefings = briefings.filter((b) => {
    const matchesSearch = b.aluno_nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusConfig: Record<
    string,
    { label: string; style: string; icon: React.ElementType }
  > = {
    pendente: {
      label: "Pendente",
      style: "bg-gray-500/10 text-gray-400 border-gray-500/20",
      icon: Clock,
    },
    gerando: {
      label: "Gerando",
      style: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      icon: Sparkles,
    },
    aguardando_respostas: {
      label: "Aguardando",
      style: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      icon: ClipboardCheck,
    },
    completo: {
      label: "Completo",
      style: "bg-green-500/10 text-green-400 border-green-500/20",
      icon: CheckCircle2,
    },
    erro: {
      label: "Erro",
      style: "bg-red-500/10 text-red-400 border-red-500/20",
      icon: AlertCircle,
    },
  };

  const statusBadge = (status: string) => {
    const cfg = statusConfig[status] || statusConfig.pendente;
    const Icon = cfg.icon;
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${cfg.style}`}
      >
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const stats = {
    total: briefings.length,
    pendentes: briefings.filter((b) => b.status === "pendente" || b.status === "gerando").length,
    aguardando: briefings.filter((b) => b.status === "aguardando_respostas").length,
    completos: briefings.filter((b) => b.status === "completo").length,
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Briefings</h1>
          <p className="text-muted-foreground">Questionarios de anamnese dos alunos</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Briefing
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-primary" },
          { label: "Em Andamento", value: stats.pendentes, color: "text-blue-400" },
          { label: "Aguardando", value: stats.aguardando, color: "text-yellow-400" },
          { label: "Completos", value: stats.completos, color: "text-green-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
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
          <div className="flex gap-2 flex-wrap">
            {["all", "pendente", "aguardando_respostas", "completo"].map((f) => (
              <Button
                key={f}
                variant={statusFilter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(f)}
              >
                {f === "all"
                  ? "Todos"
                  : statusConfig[f]?.label || f}
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

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredBriefings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || statusFilter !== "all"
                ? "Nenhum briefing encontrado"
                : "Nenhum briefing criado"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Tente ajustar os filtros"
                : "Crie um briefing para coletar informacoes dos alunos"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Briefing
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBriefings.map((b) => (
            <Card
              key={b.id}
              className="cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => viewBriefing(b.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold flex-shrink-0">
                    {b.aluno_nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{b.aluno_nome}</h3>
                      {statusBadge(b.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {b.respostas_count}/{b.total_perguntas} respostas
                      </span>
                      <span>
                        {new Date(b.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {selectedBriefing && !loadingDetail && (
        <BriefingDetailModal
          briefing={selectedBriefing}
          onClose={() => setSelectedBriefing(null)}
        />
      )}

      {showCreateModal && (
        <CreateBriefingModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadBriefings();
          }}
        />
      )}
    </div>
  );
}

function BriefingDetailModal({
  briefing,
  onClose,
}: {
  briefing: BriefingDetail;
  onClose: () => void;
}) {
  const statusConfig: Record<string, { label: string; style: string }> = {
    pendente: { label: "Pendente", style: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
    gerando: { label: "Gerando", style: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    aguardando_respostas: { label: "Aguardando Respostas", style: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    completo: { label: "Completo", style: "bg-green-500/10 text-green-400 border-green-500/20" },
    erro: { label: "Erro", style: "bg-red-500/10 text-red-400 border-red-500/20" },
  };

  const cfg = statusConfig[briefing.status] || statusConfig.pendente;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Briefing - {briefing.aluno_nome}
            </CardTitle>
            <div className="mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.style}`}>
                {cfg.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-md">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {briefing.perguntas && briefing.perguntas.length > 0 ? (
            <div className="space-y-4">
              {briefing.perguntas.map((p, i) => (
                <div key={p.id} className="border border-border rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">
                    {i + 1}. {p.texto}
                  </p>
                  {p.resposta ? (
                    <p className="text-sm text-muted-foreground bg-accent/50 rounded-md p-3">
                      {p.resposta}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Sem resposta</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma pergunta gerada ainda
            </p>
          )}

          {briefing.analise && (
            <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Analise IA
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {briefing.analise}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateBriefingModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(true);
  const [selectedAlunoId, setSelectedAlunoId] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.alunos
      .list(1, 100)
      .then((res: PaginatedResponse<Aluno>) => setAlunos(res.data || []))
      .catch(() => setError("Erro ao carregar alunos"))
      .finally(() => setLoadingAlunos(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlunoId) return;

    setCreating(true);
    setError(null);
    try {
      await api.briefings.create(selectedAlunoId);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar briefing");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Novo Briefing</CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-md">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div>
              <label className="text-sm font-medium mb-1 block">Aluno</label>
              {loadingAlunos ? (
                <div className="flex items-center gap-2 h-10">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Carregando...</span>
                </div>
              ) : (
                <select
                  value={selectedAlunoId}
                  onChange={(e) => setSelectedAlunoId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  required
                >
                  <option value="">Selecione um aluno...</option>
                  {alunos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Um briefing sera gerado com perguntas personalizadas para o aluno selecionado.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={creating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={creating || !selectedAlunoId}>
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Briefing
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
