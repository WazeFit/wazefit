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
  Loader2,
  Apple,
  Pencil,
  Trash2,
  X,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Eye,
} from "lucide-react";
import {
  api,
  ApiError,
  type PlanoNutricional,
  type PlanoNutricionalInput,
  type Aluno,
  type PaginatedResponse,
} from "@/lib/api";

export default function NutricaoPage() {
  const router = useRouter();
  const [planos, setPlanos] = useState<PlanoNutricional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPlano, setEditingPlano] = useState<PlanoNutricional | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailPlano, setDetailPlano] = useState<PlanoNutricional | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    loadPlanos();
  }, []);

  async function loadPlanos() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.nutricao.planos.list();
      setPlanos(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await api.nutricao.planos.delete(id);
      setPlanos((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao deletar plano");
    } finally {
      setDeleting(false);
    }
  }

  async function viewPlano(id: string) {
    setLoadingDetail(true);
    try {
      const detail = await api.nutricao.planos.get(id);
      setDetailPlano(detail);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar plano");
    } finally {
      setLoadingDetail(false);
    }
  }

  const filteredPlanos = planos.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.aluno_nome && p.aluno_nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const macroBar = (plano: PlanoNutricional) => {
    const cal = plano.calorias_diarias || 0;
    const prot = plano.proteina_g || 0;
    const carb = plano.carboidrato_g || 0;
    const fat = plano.gordura_g || 0;
    const total = prot + carb + fat;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-400" />
            <span className="text-muted-foreground">{cal} kcal</span>
          </div>
          <div className="flex items-center gap-1">
            <Beef className="w-3 h-3 text-red-400" />
            <span className="text-muted-foreground">{prot}g P</span>
          </div>
          <div className="flex items-center gap-1">
            <Wheat className="w-3 h-3 text-yellow-400" />
            <span className="text-muted-foreground">{carb}g C</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="w-3 h-3 text-blue-400" />
            <span className="text-muted-foreground">{fat}g G</span>
          </div>
        </div>
        {total > 0 && (
          <div className="flex h-2 rounded-full overflow-hidden bg-accent">
            <div
              className="bg-red-400"
              style={{ width: `${(prot / total) * 100}%` }}
            />
            <div
              className="bg-yellow-400"
              style={{ width: `${(carb / total) * 100}%` }}
            />
            <div
              className="bg-blue-400"
              style={{ width: `${(fat / total) * 100}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nutricao</h1>
          <p className="text-muted-foreground">Planos nutricionais dos alunos</p>
        </div>
        <Button
          onClick={() => {
            setEditingPlano(null);
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
      ) : filteredPlanos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Apple className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "Nenhum plano encontrado" : "Nenhum plano nutricional"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? "Tente ajustar a busca"
                : "Crie um plano nutricional para seus alunos"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Plano
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlanos.map((plano) => (
            <Card key={plano.id} className="hover:border-primary/50 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{plano.nome}</h3>
                    {plano.aluno_nome && (
                      <p className="text-xs text-muted-foreground truncate">
                        {plano.aluno_nome}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => viewPlano(plano.id)}
                      className="p-1.5 hover:bg-accent rounded-md transition-colors"
                    >
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingPlano(plano);
                        setShowModal(true);
                      }}
                      className="p-1.5 hover:bg-accent rounded-md transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(plano.id)}
                      className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
                {plano.objetivo && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                    Objetivo: {plano.objetivo}
                  </p>
                )}
                {macroBar(plano)}
                <div className="flex items-center justify-between mt-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      plano.ativo
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                    }`}
                  >
                    {plano.ativo ? "Ativo" : "Inativo"}
                  </span>
                  {plano.refeicoes && (
                    <span className="text-xs text-muted-foreground">
                      {plano.refeicoes.length} refeicoes
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader>
              <CardTitle>Confirmar exclusao</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Tem certeza que deseja excluir este plano nutricional?
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleting}
                >
                  {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {detailPlano && !loadingDetail && (
        <PlanoDetailModal
          plano={detailPlano}
          onClose={() => setDetailPlano(null)}
        />
      )}

      {showModal && (
        <PlanoModal
          plano={editingPlano}
          onClose={() => {
            setShowModal(false);
            setEditingPlano(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingPlano(null);
            loadPlanos();
          }}
        />
      )}
    </div>
  );
}

function PlanoDetailModal({
  plano,
  onClose,
}: {
  plano: PlanoNutricional;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{plano.nome}</CardTitle>
            {plano.aluno_nome && (
              <p className="text-sm text-muted-foreground mt-1">{plano.aluno_nome}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-md">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Calorias", value: `${plano.calorias_diarias || 0} kcal`, color: "text-orange-400", icon: Flame },
              { label: "Proteina", value: `${plano.proteina_g || 0}g`, color: "text-red-400", icon: Beef },
              { label: "Carboidrato", value: `${plano.carboidrato_g || 0}g`, color: "text-yellow-400", icon: Wheat },
              { label: "Gordura", value: `${plano.gordura_g || 0}g`, color: "text-blue-400", icon: Droplets },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="text-center p-3 rounded-lg border border-border">
                  <Icon className={`w-5 h-5 ${m.color} mx-auto mb-1`} />
                  <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
              );
            })}
          </div>

          {plano.objetivo && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Objetivo</h4>
              <p className="text-sm text-muted-foreground">{plano.objetivo}</p>
            </div>
          )}

          {plano.observacoes && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Observacoes</h4>
              <p className="text-sm text-muted-foreground">{plano.observacoes}</p>
            </div>
          )}

          {plano.refeicoes && plano.refeicoes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3">Refeicoes</h4>
              <div className="space-y-3">
                {plano.refeicoes
                  .sort((a, b) => a.ordem - b.ordem)
                  .map((ref) => (
                    <div key={ref.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm">{ref.nome}</h5>
                        {ref.horario && (
                          <span className="text-xs text-muted-foreground">{ref.horario}</span>
                        )}
                      </div>
                      {ref.alimentos && ref.alimentos.length > 0 ? (
                        <div className="space-y-1">
                          {ref.alimentos.map((al) => (
                            <div
                              key={al.id}
                              className="flex items-center justify-between text-xs text-muted-foreground"
                            >
                              <span>
                                {al.nome} ({al.quantidade}{al.unidade})
                              </span>
                              <span>{al.calorias} kcal</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Nenhum alimento cadastrado
                        </p>
                      )}
                    </div>
                  ))}
              </div>
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

function PlanoModal({
  plano,
  onClose,
  onSuccess,
}: {
  plano: PlanoNutricional | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!plano;
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(true);
  const [formData, setFormData] = useState<PlanoNutricionalInput>({
    aluno_id: plano?.aluno_id || "",
    nome: plano?.nome || "",
    objetivo: plano?.objetivo || "",
    calorias_diarias: plano?.calorias_diarias || undefined,
    proteina_g: plano?.proteina_g || undefined,
    carboidrato_g: plano?.carboidrato_g || undefined,
    gordura_g: plano?.gordura_g || undefined,
    observacoes: plano?.observacoes || "",
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
      if (isEditing) {
        await api.nutricao.planos.update(plano.id, formData);
      } else {
        await api.nutricao.planos.create(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar plano");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{isEditing ? "Editar Plano" : "Novo Plano Nutricional"}</CardTitle>
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
                  disabled={isEditing}
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
              <label className="text-sm font-medium mb-1 block">Nome do Plano</label>
              <Input
                placeholder="Ex: Dieta Cutting"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Objetivo (opcional)</label>
              <Input
                placeholder="Ex: Perda de gordura, ganho de massa"
                value={formData.objetivo || ""}
                onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Calorias/dia</label>
                <Input
                  type="number"
                  placeholder="2000"
                  value={formData.calorias_diarias || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, calorias_diarias: Number(e.target.value) || undefined })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Proteina (g)</label>
                <Input
                  type="number"
                  placeholder="150"
                  value={formData.proteina_g || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, proteina_g: Number(e.target.value) || undefined })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Carboidrato (g)</label>
                <Input
                  type="number"
                  placeholder="250"
                  value={formData.carboidrato_g || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, carboidrato_g: Number(e.target.value) || undefined })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Gordura (g)</label>
                <Input
                  type="number"
                  placeholder="60"
                  value={formData.gordura_g || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, gordura_g: Number(e.target.value) || undefined })
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Observacoes (opcional)</label>
              <textarea
                placeholder="Anotacoes sobre o plano..."
                value={formData.observacoes || ""}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? "Salvar" : "Criar Plano"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
