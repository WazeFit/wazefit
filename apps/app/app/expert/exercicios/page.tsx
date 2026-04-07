"use client";
export const runtime = 'edge';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Dumbbell,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { api, ApiError, type Exercicio, type ExercicioInput, type TipoExercicio } from "@/lib/api";

const GRUPOS_MUSCULARES = [
  "Peito",
  "Costas",
  "Ombros",
  "Biceps",
  "Triceps",
  "Quadriceps",
  "Posteriores",
  "Gluteos",
  "Panturrilhas",
  "Abdomen",
  "Antebraco",
  "Core",
];

const TIPOS_EXERCICIO: { value: TipoExercicio; label: string }[] = [
  { value: "forca", label: "Forca" },
  { value: "aerobico", label: "Aerobico" },
  { value: "funcional", label: "Funcional" },
];

export default function ExerciciosPage() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [grupoFilter, setGrupoFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingExercicio, setEditingExercicio] = useState<Exercicio | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadExercicios();
  }, []);

  async function loadExercicios() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.exercicios.list();
      setExercicios(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar exercicios");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await api.exercicios.delete(id);
      setExercicios((prev) => prev.filter((e) => e.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao deletar exercicio");
    } finally {
      setDeleting(false);
    }
  }

  const filteredExercicios = exercicios.filter((ex) => {
    const matchesSearch =
      ex.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.grupo_muscular.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrupo =
      grupoFilter === "all" || ex.grupo_muscular.toLowerCase() === grupoFilter.toLowerCase();
    return matchesSearch && matchesGrupo;
  });

  const tipoBadge = (tipo: string | null) => {
    const styles: Record<string, string> = {
      forca: "bg-red-500/10 text-red-400 border-red-500/20",
      aerobico: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      funcional: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full border ${styles[tipo || ""] || "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}
      >
        {tipo || "N/A"}
      </span>
    );
  };

  const grupoBadge = (grupo: string) => (
    <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
      {grupo}
    </span>
  );

  const uniqueGrupos = Array.from(new Set(exercicios.map((e) => e.grupo_muscular))).sort();

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exercicios</h1>
          <p className="text-muted-foreground">Biblioteca de exercicios</p>
        </div>
        <Button
          onClick={() => {
            setEditingExercicio(null);
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Exercicio
        </Button>
      </div>

      <Card>
        <CardContent className="p-5 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou grupo muscular..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={grupoFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setGrupoFilter("all")}
            >
              Todos
            </Button>
            {uniqueGrupos.slice(0, 5).map((g) => (
              <Button
                key={g}
                variant={grupoFilter === g ? "default" : "outline"}
                size="sm"
                onClick={() => setGrupoFilter(g)}
              >
                {g}
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

      {!loading && filteredExercicios.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || grupoFilter !== "all"
                ? "Nenhum exercicio encontrado"
                : "Nenhum exercicio cadastrado"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || grupoFilter !== "all"
                ? "Tente ajustar os filtros"
                : "Comece adicionando exercicios a biblioteca"}
            </p>
            {!searchTerm && grupoFilter === "all" && (
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Exercicio
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!loading && filteredExercicios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercicios.map((ex) => (
            <Card key={ex.id} className="hover:border-primary/50 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold truncate">{ex.nome}</h3>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditingExercicio(ex);
                        setShowModal(true);
                      }}
                      className="p-1.5 hover:bg-accent rounded-md transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(ex.id)}
                      className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {grupoBadge(ex.grupo_muscular)}
                  {tipoBadge(ex.tipo_exercicio)}
                </div>
                {ex.equipamento && (
                  <p className="text-sm text-muted-foreground">
                    Equipamento: {ex.equipamento}
                  </p>
                )}
                {ex.instrucoes && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {ex.instrucoes}
                  </p>
                )}
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
                Tem certeza que deseja excluir este exercicio? Esta acao nao pode ser desfeita.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                >
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

      {showModal && (
        <ExercicioModal
          exercicio={editingExercicio}
          onClose={() => {
            setShowModal(false);
            setEditingExercicio(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingExercicio(null);
            loadExercicios();
          }}
        />
      )}
    </div>
  );
}

function ExercicioModal({
  exercicio,
  onClose,
  onSuccess,
}: {
  exercicio: Exercicio | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!exercicio;
  const [formData, setFormData] = useState<ExercicioInput>({
    nome: exercicio?.nome || "",
    grupo_muscular: exercicio?.grupo_muscular || "",
    equipamento: exercicio?.equipamento || "",
    video_url: exercicio?.video_url || "",
    instrucoes: exercicio?.instrucoes || "",
    tipo_exercicio: exercicio?.tipo_exercicio || undefined,
    subtipo: exercicio?.subtipo || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        await api.exercicios.update(exercicio.id, formData);
      } else {
        await api.exercicios.create(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar exercicio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{isEditing ? "Editar Exercicio" : "Novo Exercicio"}</CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-md">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div>
              <label className="text-sm font-medium mb-1 block">Nome</label>
              <Input
                placeholder="Ex: Supino Reto"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Grupo Muscular</label>
              <select
                value={formData.grupo_muscular}
                onChange={(e) => setFormData({ ...formData, grupo_muscular: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                required
              >
                <option value="">Selecione...</option>
                {GRUPOS_MUSCULARES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tipo de Exercicio</label>
              <select
                value={formData.tipo_exercicio || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tipo_exercicio: (e.target.value as TipoExercicio) || undefined,
                  })
                }
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Selecione...</option>
                {TIPOS_EXERCICIO.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Equipamento (opcional)</label>
              <Input
                placeholder="Ex: Barra, Halteres, Maquina"
                value={formData.equipamento || ""}
                onChange={(e) => setFormData({ ...formData, equipamento: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">URL do Video (opcional)</label>
              <Input
                placeholder="https://youtube.com/..."
                value={formData.video_url || ""}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Instrucoes (opcional)</label>
              <textarea
                placeholder="Descreva como realizar o exercicio..."
                value={formData.instrucoes || ""}
                onChange={(e) => setFormData({ ...formData, instrucoes: e.target.value })}
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? "Salvar" : "Criar Exercicio"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
