"use client";
export const runtime = 'edge';

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Sparkles, Dumbbell, Apple, Loader2, AlertCircle, RefreshCw, Clock } from "lucide-react";
import { api, ApiError, type Aluno, type LLMJob, type PaginatedResponse } from "@/lib/api";

const JOB_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  processing: { label: "Processando...", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  completed: { label: "Completo", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  failed: { label: "Falhou", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function IAPage() {
  const [tab, setTab] = useState<"treino" | "dieta" | "historico">("treino");
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [jobs, setJobs] = useState<LLMJob[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [a, j] = await Promise.allSettled([
        api.alunos.list(1, 100),
        api.llm.jobs(),
      ]);
      if (a.status === "fulfilled") setAlunos((a.value as PaginatedResponse<Aluno>).data || []);
      if (j.status === "fulfilled") setJobs(j.value as LLMJob[]);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tabs = [
    { id: "treino" as const, label: "Gerar Treino", icon: Dumbbell },
    { id: "dieta" as const, label: "Gerar Dieta", icon: Apple },
    { id: "historico" as const, label: "Historico", icon: Clock },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="w-8 h-8 text-primary" /> IA Assistant
        </h1>
        <p className="text-muted-foreground">Use IA para criar treinos e dietas personalizadas</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <Button
              key={t.id}
              variant={tab === t.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setTab(t.id)}
            >
              <Icon className="w-4 h-4 mr-2" />
              {t.label}
            </Button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {tab === "treino" && <GerarTreino alunos={alunos} onJobCreated={load} />}
          {tab === "dieta" && <GerarDieta alunos={alunos} onJobCreated={load} />}
          {tab === "historico" && <Historico jobs={jobs} onRefresh={load} />}
        </>
      )}
    </div>
  );
}

function GerarTreino({ alunos, onJobCreated }: { alunos: Aluno[]; onJobCreated: () => void }) {
  const [alunoId, setAlunoId] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [nivel, setNivel] = useState("");
  const [diasSemana, setDiasSemana] = useState("3");
  const [observacoes, setObservacoes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<LLMJob | null>(null);
  const [error, setError] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  async function handleGerar() {
    if (!alunoId || !objetivo || !nivel) return;
    setGenerating(true); setError(""); setCurrentJob(null);
    try {
      const res = await api.llm.gerarTreino({
        aluno_id: alunoId, objetivo, nivel,
        dias_semana: parseInt(diasSemana),
        observacoes: observacoes || undefined,
      });
      pollingRef.current = setInterval(async () => {
        try {
          const job = await api.llm.job(res.job_id);
          setCurrentJob(job);
          if (job.status !== "pending" && job.status !== "processing") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            setGenerating(false);
            onJobCreated();
          }
        } catch { /* ignore */ }
      }, 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao gerar treino");
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Parametros do Treino</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Aluno</label>
              <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Selecione...</option>
                {alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Objetivo</label>
              <select value={objetivo} onChange={(e) => setObjetivo(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Selecione...</option>
                {["hipertrofia", "emagrecimento", "forca", "resistencia", "condicionamento"].map((o) => (
                  <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Nivel</label>
              <select value={nivel} onChange={(e) => setNivel(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Selecione...</option>
                {["iniciante", "intermediario", "avancado"].map((n) => (
                  <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Dias por semana</label>
              <select value={diasSemana} onChange={(e) => setDiasSemana(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {[2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{d} dias</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Observacoes (opcional)</label>
            <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: foco em membros superiores, lesao no joelho..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" />
          </div>
          {error && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</p>}
          <Button onClick={handleGerar} disabled={generating || !alunoId || !objetivo || !nivel}>
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Gerar Treino com IA
          </Button>
        </CardContent>
      </Card>

      {generating && !currentJob && (
        <Card><CardContent className="text-center py-8">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Gerando treino com IA...</p>
        </CardContent></Card>
      )}

      {currentJob && <JobResult job={currentJob} />}
    </div>
  );
}

function GerarDieta({ alunos, onJobCreated }: { alunos: Aluno[]; onJobCreated: () => void }) {
  const [alunoId, setAlunoId] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [restricoes, setRestricoes] = useState("");
  const [caloriasAlvo, setCaloriasAlvo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<LLMJob | null>(null);
  const [error, setError] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  async function handleGerar() {
    if (!alunoId || !objetivo) return;
    setGenerating(true); setError(""); setCurrentJob(null);
    try {
      const res = await api.llm.gerarDieta({
        aluno_id: alunoId, objetivo,
        restricoes: restricoes || undefined,
        calorias_alvo: caloriasAlvo ? parseInt(caloriasAlvo) : undefined,
        observacoes: observacoes || undefined,
      });
      pollingRef.current = setInterval(async () => {
        try {
          const job = await api.llm.job(res.job_id);
          setCurrentJob(job);
          if (job.status !== "pending" && job.status !== "processing") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            setGenerating(false);
            onJobCreated();
          }
        } catch { /* ignore */ }
      }, 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao gerar dieta");
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Parametros da Dieta</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Aluno</label>
              <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Selecione...</option>
                {alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Objetivo</label>
              <select value={objetivo} onChange={(e) => setObjetivo(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Selecione...</option>
                {["emagrecimento", "ganho_massa", "manutencao", "performance"].map((o) => (
                  <option key={o} value={o}>{o.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Calorias alvo (opcional)</label>
              <Input type="number" placeholder="Ex: 2000" value={caloriasAlvo}
                onChange={(e) => setCaloriasAlvo(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Restricoes alimentares (opcional)</label>
            <textarea value={restricoes} onChange={(e) => setRestricoes(e.target.value)}
              placeholder="Ex: sem lactose, vegetariano..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Observacoes (opcional)</label>
            <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: preferencia por refeicoes praticas..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]" />
          </div>
          {error && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</p>}
          <Button onClick={handleGerar} disabled={generating || !alunoId || !objetivo}>
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Gerar Dieta com IA
          </Button>
        </CardContent>
      </Card>

      {generating && !currentJob && (
        <Card><CardContent className="text-center py-8">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Gerando dieta com IA...</p>
        </CardContent></Card>
      )}

      {currentJob && <JobResult job={currentJob} />}
    </div>
  );
}

function JobResult({ job }: { job: LLMJob }) {
  const st = JOB_STATUS[job.status] || { label: job.status, color: "bg-gray-500/10 text-gray-400" };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{job.tipo === "treino" ? "Treino Gerado" : "Dieta Gerada"}</span>
          <div className="flex items-center gap-2">
            {job.tokens_usados != null && <span className="text-xs text-muted-foreground">{job.tokens_usados} tokens</span>}
            <span className={`text-xs px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {job.status === "processing" && (
          <div className="text-center py-6">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Processando...</p>
          </div>
        )}
        {job.status === "failed" && job.erro && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">{job.erro}</div>
        )}
        {job.status === "completed" && job.resultado && (
          <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto whitespace-pre-wrap max-h-96">
            {JSON.stringify(job.resultado, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}

function Historico({ jobs, onRefresh }: { jobs: LLMJob[]; onRefresh: () => void }) {
  if (jobs.length === 0) {
    return (
      <Card><CardContent className="p-12 text-center">
        <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum job encontrado</h3>
        <p className="text-muted-foreground">Gere treinos ou dietas com IA para ver o historico aqui</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
        </Button>
      </div>
      {jobs.map((job) => {
        const st = JOB_STATUS[job.status] || { label: job.status, color: "bg-gray-500/10 text-gray-400" };
        return (
          <Card key={job.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {job.tipo === "treino" ? <Dumbbell className="w-4 h-4 text-primary" /> : <Apple className="w-4 h-4 text-primary" />}
                  <span className="font-medium capitalize">{job.tipo}</span>
                  {job.aluno_nome && <span className="text-muted-foreground text-sm">- {job.aluno_nome}</span>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{new Date(job.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  {job.tokens_usados != null && <span>{job.tokens_usados} tokens</span>}
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
