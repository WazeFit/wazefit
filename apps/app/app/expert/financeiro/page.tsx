"use client";
export const runtime = 'edge';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  DollarSign,
  Loader2,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  api,
  ApiError,
  type ResumoFinanceiro,
  type Cobranca,
  type CobrancaInput,
  type Aluno,
  type PaginatedResponse,
} from "@/lib/api";

export default function FinanceiroPage() {
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [resumoData, cobrancasData] = await Promise.all([
        api.financeiro.resumo(),
        api.cobrancas.list(),
      ]);
      setResumo(resumoData);
      setCobrancas(cobrancasData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar dados financeiros");
    } finally {
      setLoading(false);
    }
  }

  const filteredCobrancas = cobrancas.filter(
    (c) => statusFilter === "all" || c.status === statusFilter
  );

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pago: "bg-green-500/10 text-green-400 border-green-500/20",
      paga: "bg-green-500/10 text-green-400 border-green-500/20",
      pendente: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      atrasado: "bg-red-500/10 text-red-400 border-red-500/20",
      atrasada: "bg-red-500/10 text-red-400 border-red-500/20",
      cancelado: "bg-gray-500/10 text-gray-400 border-gray-500/20",
      cancelada: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    };
    const labels: Record<string, string> = {
      pago: "Pago",
      paga: "Pago",
      pendente: "Pendente",
      atrasado: "Atrasado",
      atrasada: "Atrasado",
      cancelado: "Cancelado",
      cancelada: "Cancelado",
    };
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full border ${styles[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const summaryCards = resumo
    ? [
        {
          icon: DollarSign,
          label: "Receita Mensal",
          value: `R$ ${resumo.receita_mes.toFixed(2)}`,
          color: "text-green-400",
          bg: "bg-green-500/10",
          subIcon: resumo.receita_mes >= resumo.receita_mes_anterior ? TrendingUp : TrendingDown,
          sub:
            resumo.receita_mes_anterior > 0
              ? `${(((resumo.receita_mes - resumo.receita_mes_anterior) / resumo.receita_mes_anterior) * 100).toFixed(0)}% vs mes anterior`
              : "Primeiro mes",
        },
        {
          icon: CheckCircle2,
          label: "Cobrancas Pagas",
          value: String(resumo.cobrancas_pagas),
          color: "text-emerald-400",
          bg: "bg-emerald-500/10",
        },
        {
          icon: Clock,
          label: "Pendentes",
          value: String(resumo.cobrancas_pendentes),
          color: "text-yellow-400",
          bg: "bg-yellow-500/10",
        },
        {
          icon: AlertTriangle,
          label: "Atrasadas",
          value: String(resumo.cobrancas_atrasadas),
          color: "text-red-400",
          bg: "bg-red-500/10",
        },
      ]
    : [];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Gerencie cobrancas e receitas</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Cobranca
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-5 text-destructive">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                    <div
                      className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}
                    >
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                    {card.sub && (
                      <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Cobrancas</CardTitle>
                <div className="flex gap-2">
                  {["all", "pendente", "pago", "atrasado"].map((f) => (
                    <Button
                      key={f}
                      variant={statusFilter === f ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(f)}
                    >
                      {f === "all"
                        ? "Todas"
                        : f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCobrancas.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma cobranca encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCobrancas.map((cob) => (
                    <div
                      key={cob.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold flex-shrink-0">
                        {(cob.aluno_nome || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm truncate">
                            {cob.aluno_nome || "Aluno"}
                          </span>
                          {statusBadge(cob.status)}
                        </div>
                        {cob.descricao && (
                          <p className="text-xs text-muted-foreground truncate">{cob.descricao}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Vencimento: {new Date(cob.vencimento).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-lg">R$ {cob.valor.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {showModal && (
        <CobrancaModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function CobrancaModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(true);
  const [formData, setFormData] = useState<CobrancaInput>({
    aluno_id: "",
    valor: 0,
    vencimento: "",
    descricao: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.alunos
      .list(1, 100)
      .then((res: PaginatedResponse<Aluno>) => setAlunos(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingAlunos(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.cobrancas.create(formData);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar cobranca");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Nova Cobranca</CardTitle>
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
                  value={formData.aluno_id}
                  onChange={(e) => setFormData({ ...formData, aluno_id: e.target.value })}
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
            <div>
              <label className="text-sm font-medium mb-1 block">Valor (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="150.00"
                value={formData.valor || ""}
                onChange={(e) => setFormData({ ...formData, valor: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Vencimento</label>
              <Input
                type="date"
                value={formData.vencimento}
                onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Descricao (opcional)</label>
              <Input
                placeholder="Ex: Mensalidade abril"
                value={formData.descricao || ""}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Cobranca
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
