"use client";
export const runtime = 'edge';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  ClipboardList,
  Loader2,
  Pencil,
  Trash2,
  X,
  Dumbbell,
  UserPlus,
} from "lucide-react";
import {
  api,
  ApiError,
  type Ficha,
  type FichaInput,
  type FichaExercicio,
  type Exercicio,
  type Aluno,
  type PaginatedResponse,
} from "@/lib/api";

export default function FichasPage() {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingFicha, setEditingFicha] = useState<Ficha | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAtribuirModal, setShowAtribuirModal] = useState<string | null>(null);

  useEffect(() => {
    loadFichas();
  }, []);

  async function loadFichas() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fichas.list();
      setFichas(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar fichas");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await api.fichas.delete(id);
      setFichas((prev) => prev.filter((f) => f.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao deletar ficha");
    } finally {
      setDeleting(false);
    }
  }

  const filteredFichas = fichas.filter(
    (f) =>
      f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.tipo && f.tipo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const tipoBadge = (tipo: string) => {
    const styles: Record<string, string> = {
      musculacao: "bg-red-500/10 text-red-400 border-red-500/20",
      funcional: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      aerobico: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      hiit: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    };
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full border ${styles[tipo?.toLowerCase()] || "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}
      >
        {tipo || "Geral"}
      </span>
    );
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fichas de Treino</h1>
          <p className="text-muted-foreground">Crie e gerencie fichas de treino</p>
        </div>
        <Button
          onClick={() => {
            setEditingFicha(null);
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Ficha
        </Button>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar fichas por nome ou tipo..."
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

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && filteredFichas.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "Nenhuma ficha encontrada" : "Nenhuma ficha cadastrada"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Tente ajustar a busca" : "Crie sua primeira ficha de treino"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Ficha
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!loading && filteredFichas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFichas.map((ficha) => (
            <Card key={ficha.id} className="hover:border-primary/50 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold truncate">{ficha.nome}</h3>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => setShowAtribuirModal(ficha.id)}
                      className="p-1.5 hover:bg-accent rounded-md transition-colors"
                      title="Atribuir a aluno"
                    >
                      <UserPlus className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingFicha(ficha);
                        setShowModal(true);
                      }}
                      className="p-1.5 hover:bg-accent rounded-md transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(ficha.id)}
                      className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {tipoBadge(ficha.tipo)}
                </div>
                {ficha.descricao && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {ficha.descricao}
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Dumbbell className="w-4 h-4" />
                  <span>{ficha.exercicios?.length || 0} exercicios</span>
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
                Tem certeza que deseja excluir esta ficha? Esta acao nao pode ser desfeita.
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

      {showAtribuirModal && (
        <AtribuirModal
          fichaId={showAtribuirModal}
          onClose={() => setShowAtribuirModal(null)}
        />
      )}

      {showModal && (
        <FichaModal
          ficha={editingFicha}
          onClose={() => {
            setShowModal(false);
            setEditingFicha(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingFicha(null);
            loadFichas();
          }}
        />
      )}
    </div>
  );
}

function AtribuirModal({
  fichaId,
  onClose,
}: {
  fichaId: string;
  onClose: () => void;
}) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    api.alunos
      .list(1, 100)
      .then((res: PaginatedResponse<Aluno>) => setAlunos(res.data || []))
      .catch(() => setError("Erro ao carregar alunos"))
      .finally(() => setLoading(false));
  }, []);

  async function handleAtribuir(alunoId: string, alunoNome: string) {
    setAssigning(true);
    setError(null);
    try {
      await api.fichas.atribuir(fichaId, alunoId);
      setSuccess(`Ficha atribuida a ${alunoNome}`);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao atribuir ficha");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 max-h-[70vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Atribuir Ficha</CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-md">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive mb-3">{error}</p>}
          {success && <p className="text-sm text-green-400 mb-3">{success}</p>}
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : alunos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum aluno cadastrado
            </p>
          ) : (
            <div className="space-y-2">
              {alunos.map((aluno) => (
                <button
                  key={aluno.id}
                  onClick={() => handleAtribuir(aluno.id, aluno.nome)}
                  disabled={assigning}
                  className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-accent transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                    {aluno.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{aluno.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">{aluno.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FichaModal({
  ficha,
  onClose,
  onSuccess,
}: {
  ficha: Ficha | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!ficha;
  const [nome, setNome] = useState(ficha?.nome || "");
  const [descricao, setDescricao] = useState(ficha?.descricao || "");
  const [tipo, setTipo] = useState(ficha?.tipo || "musculacao");
  const [exerciciosSelecionados, setExerciciosSelecionados] = useState<FichaExercicio[]>(
    ficha?.exercicios || []
  );
  const [exerciciosDisponiveis, setExerciciosDisponiveis] = useState<Exercicio[]>([]);
  const [loadingEx, setLoadingEx] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchEx, setSearchEx] = useState("");

  useEffect(() => {
    api.exercicios
      .list()
      .then(setExerciciosDisponiveis)
      .catch(() => {})
      .finally(() => setLoadingEx(false));
  }, []);

  function addExercicio(ex: Exercicio) {
    if (exerciciosSelecionados.find((e) => e.exercicio_id === ex.id)) return;
    setExerciciosSelecionados((prev) => [
      ...prev,
      {
        exercicio_id: ex.id,
        series: 3,
        repeticoes: "12",
        descanso_seg: 60,
        ordem: prev.length + 1,
        exercicio: ex,
      },
    ]);
  }

  function removeExercicio(exId: string) {
    setExerciciosSelecionados((prev) =>
      prev
        .filter((e) => e.exercicio_id !== exId)
        .map((e, i) => ({ ...e, ordem: i + 1 }))
    );
  }

  function updateExercicio(exId: string, field: string, value: string | number) {
    setExerciciosSelecionados((prev) =>
      prev.map((e) => (e.exercicio_id === exId ? { ...e, [field]: value } : e))
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const input: FichaInput = {
      nome,
      descricao: descricao || undefined,
      tipo,
      exercicios: exerciciosSelecionados.map(({ exercicio: _ex, ...rest }) => rest),
    };

    try {
      if (isEditing) {
        await api.fichas.update(ficha.id, input);
      } else {
        await api.fichas.create(input);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar ficha");
    } finally {
      setSaving(false);
    }
  };

  const filteredAvailable = exerciciosDisponiveis.filter(
    (ex) =>
      ex.nome.toLowerCase().includes(searchEx.toLowerCase()) &&
      !exerciciosSelecionados.find((s) => s.exercicio_id === ex.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{isEditing ? "Editar Ficha" : "Nova Ficha"}</CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-md">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nome</label>
                <Input
                  placeholder="Ex: Treino A - Peito"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tipo</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="musculacao">Musculacao</option>
                  <option value="funcional">Funcional</option>
                  <option value="aerobico">Aerobico</option>
                  <option value="hiit">HIIT</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Descricao (opcional)</label>
              <textarea
                placeholder="Descreva o objetivo da ficha..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Exercicios ({exerciciosSelecionados.length})
              </label>
              {exerciciosSelecionados.length > 0 && (
                <div className="space-y-2 mb-3">
                  {exerciciosSelecionados.map((ex) => (
                    <div
                      key={ex.exercicio_id}
                      className="flex items-center gap-3 p-3 rounded-md border border-input bg-accent/30"
                    >
                      <span className="text-xs font-bold text-muted-foreground w-6">
                        {ex.ordem}
                      </span>
                      <span className="flex-1 text-sm font-medium truncate">
                        {ex.exercicio?.nome || ex.exercicio_id}
                      </span>
                      <Input
                        type="number"
                        value={ex.series}
                        onChange={(e) =>
                          updateExercicio(ex.exercicio_id, "series", Number(e.target.value))
                        }
                        className="w-16 h-8 text-xs text-center"
                        min={1}
                        title="Series"
                      />
                      <span className="text-xs text-muted-foreground">x</span>
                      <Input
                        value={ex.repeticoes}
                        onChange={(e) =>
                          updateExercicio(ex.exercicio_id, "repeticoes", e.target.value)
                        }
                        className="w-16 h-8 text-xs text-center"
                        title="Repeticoes"
                      />
                      <button
                        type="button"
                        onClick={() => removeExercicio(ex.exercicio_id)}
                        className="p-1 hover:bg-destructive/10 rounded"
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border border-input rounded-md p-3">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar exercicio para adicionar..."
                    value={searchEx}
                    onChange={(e) => setSearchEx(e.target.value)}
                    className="pl-10 h-8 text-sm"
                  />
                </div>
                {loadingEx ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredAvailable.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Nenhum exercicio disponivel
                      </p>
                    ) : (
                      filteredAvailable.slice(0, 20).map((ex) => (
                        <button
                          key={ex.id}
                          type="button"
                          onClick={() => addExercicio(ex)}
                          className="w-full flex items-center gap-2 p-2 rounded hover:bg-accent transition-colors text-left text-sm"
                        >
                          <Plus className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="truncate">{ex.nome}</span>
                          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                            {ex.grupo_muscular}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? "Salvar" : "Criar Ficha"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
