"use client";
export const runtime = 'edge';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  Calendar,
  Activity,
  Loader2,
} from "lucide-react";
import { api, ApiError, type Aluno, type PaginatedResponse } from "@/lib/api";

export default function AlunosPage() {
  const router = useRouter();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAlunos();
  }, []);

  async function loadAlunos() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.alunos.list(1, 100) as PaginatedResponse<Aluno>;
      setAlunos(response.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  }

  const filteredAlunos = alunos.filter((aluno) => {
    const matchesSearch =
      aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || aluno.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: alunos.length,
    ativos: alunos.filter((a) => a.status === "ativo").length,
    trial: alunos.filter((a) => a.status === "trial").length,
    inativos: alunos.filter((a) => a.status === "inativo").length,
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ativo: "bg-green-500/10 text-green-400 border-green-500/20",
      trial: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      inativo: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    };
    const labels: Record<string, string> = { ativo: "Ativo", trial: "Trial", inativo: "Inativo" };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[status] || styles.inativo}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alunos</h1>
          <p className="text-muted-foreground">Gerencie seus alunos e acompanhe a evolucao</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Aluno
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Users, color: "text-primary" },
          { label: "Ativos", value: stats.ativos, icon: Activity, color: "text-green-400" },
          { label: "Trial", value: stats.trial, icon: Calendar, color: "text-yellow-400" },
          { label: "Inativos", value: stats.inativos, icon: Users, color: "text-gray-400" },
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
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["all", "ativo", "trial", "inativo"].map((f) => (
              <Button
                key={f}
                variant={statusFilter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(f)}
              >
                {f === "all" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
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

      {!loading && filteredAlunos.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Tente ajustar os filtros" : "Comece adicionando seu primeiro aluno"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Aluno
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!loading && filteredAlunos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlunos.map((aluno) => (
            <Card
              key={aluno.id}
              className="cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => router.push(`/expert/alunos/${aluno.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold text-lg flex-shrink-0">
                    {aluno.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold truncate">{aluno.nome}</h3>
                      {statusBadge(aluno.status)}
                    </div>
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{aluno.email}</span>
                      </div>
                      {aluno.telefone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{aluno.telefone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>Desde {new Date(aluno.created_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateAlunoModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadAlunos();
          }}
        />
      )}
    </div>
  );
}

function CreateAlunoModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({ nome: "", email: "", telefone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.alunos.create({
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar aluno");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Novo Aluno</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div>
              <label className="text-sm font-medium mb-1 block">Nome completo</label>
              <Input
                placeholder="Ex: Joao Silva"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                type="email"
                placeholder="joao@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Telefone (opcional)</label>
              <Input
                placeholder="(11) 99999-9999"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Aluno
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
