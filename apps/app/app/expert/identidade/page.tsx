"use client";
export const runtime = 'edge';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Palette, Eye, Check, Loader2, AlertCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface BrandConfig {
  nome: string;
  tagline: string;
  corPrimaria: string;
  corSecundaria: string;
  logoUrl: string;
}

export default function IdentidadeVisualPage() {
  const [tab, setTab] = useState<"geral" | "cores" | "preview">("geral");
  const [config, setConfig] = useState<BrandConfig>({
    nome: "", tagline: "",
    corPrimaria: "#22c55e", corSecundaria: "#16a34a",
    logoUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.tenant.config();
        const cfg = (data as { config: Record<string, string | null> }).config || {};
        setConfig({
          nome: cfg.nome_exibicao || cfg.nome || "",
          tagline: cfg.tagline || "",
          corPrimaria: cfg.cor_primaria || "#22c55e",
          corSecundaria: cfg.cor_secundaria || "#16a34a",
          logoUrl: cfg.logo_url || "",
        });
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false);
    try {
      await api.tenant.updateConfig({
        nome_exibicao: config.nome,
        tagline: config.tagline,
        cor_primaria: config.corPrimaria,
        cor_secundaria: config.corSecundaria,
        logo_url: config.logoUrl || null,
      } as Record<string, string | null>);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar");
    } finally { setSaving(false); }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Palette className="w-8 h-8 text-primary" /> Identidade Visual
          </h1>
          <p className="text-muted-foreground">Personalize a aparencia da sua plataforma</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : saved ? <Check className="w-4 h-4 mr-2" /> : null}
          {saved ? "Salvo!" : "Salvar"}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {[
          { id: "geral" as const, label: "Geral", icon: Palette },
          { id: "cores" as const, label: "Cores", icon: Palette },
          { id: "preview" as const, label: "Preview", icon: Eye },
        ].map((t) => (
          <Button key={t.id} variant={tab === t.id ? "default" : "ghost"} size="sm" onClick={() => setTab(t.id)}>
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "geral" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Informacoes da Marca</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nome de exibicao</label>
                <Input value={config.nome} onChange={(e) => setConfig({ ...config, nome: e.target.value })}
                  placeholder="Ex: Fitness Pro Academy" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tagline</label>
                <Input value={config.tagline} onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                  placeholder="Ex: Transforme seu corpo, transforme sua vida" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">URL do Logo</label>
                <Input value={config.logoUrl} onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                  placeholder="https://..." />
                {config.logoUrl && (
                  <div className="mt-2 p-4 bg-muted rounded-lg flex items-center justify-center">
                    <img src={config.logoUrl} alt="Logo" className="max-h-16 object-contain"
                      onError={(e) => (e.currentTarget.style.display = "none")} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "cores" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Cores da Marca</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Cor Primaria</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={config.corPrimaria}
                    onChange={(e) => setConfig({ ...config, corPrimaria: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0" />
                  <Input value={config.corPrimaria}
                    onChange={(e) => setConfig({ ...config, corPrimaria: e.target.value })}
                    className="w-32 font-mono" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Cor Secundaria</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={config.corSecundaria}
                    onChange={(e) => setConfig({ ...config, corSecundaria: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0" />
                  <Input value={config.corSecundaria}
                    onChange={(e) => setConfig({ ...config, corSecundaria: e.target.value })}
                    className="w-32 font-mono" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Preview das Cores</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-20 rounded-lg" style={{ background: `linear-gradient(135deg, ${config.corPrimaria}, ${config.corSecundaria})` }} />
                <div className="flex gap-2">
                  <div className="flex-1 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: config.corPrimaria }}>Primaria</div>
                  <div className="flex-1 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: config.corSecundaria }}>Secundaria</div>
                </div>
                <button className="w-full py-2 rounded-lg text-white font-medium text-sm"
                  style={{ backgroundColor: config.corPrimaria }}>
                  Botao Exemplo
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "preview" && (
        <Card>
          <CardHeader><CardTitle>Preview da Plataforma</CardTitle></CardHeader>
          <CardContent>
            <div className="border rounded-xl overflow-hidden">
              {/* Fake header */}
              <div className="p-4 flex items-center justify-between"
                style={{ backgroundColor: config.corPrimaria }}>
                <div className="flex items-center gap-2">
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" className="h-8 object-contain"
                      onError={(e) => (e.currentTarget.style.display = "none")} />
                  ) : (
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {(config.nome || "W").charAt(0)}
                    </div>
                  )}
                  <span className="text-white font-bold">{config.nome || "WazeFit"}</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-white/10 rounded-full" />
                </div>
              </div>
              {/* Fake content */}
              <div className="p-6 bg-background">
                <h2 className="text-lg font-bold mb-1">{config.tagline || "Sua plataforma fitness"}</h2>
                <p className="text-sm text-muted-foreground mb-4">Preview de como seus alunos verao a plataforma</p>
                <div className="grid grid-cols-3 gap-3">
                  {["Treinos", "Dieta", "Ranking"].map((item) => (
                    <div key={item} className="p-3 rounded-lg text-center text-white text-sm font-medium"
                      style={{ backgroundColor: config.corPrimaria }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
