"use client";
export const runtime = 'edge';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Settings,
  Loader2,
  Save,
  Check,
  Palette,
  Globe,
  Phone,
  Mail,
  Building,
} from "lucide-react";
import { api, ApiError, type TenantConfig } from "@/lib/api";

interface ConfigForm {
  nome: string;
  cor_primaria: string;
  cor_secundaria: string;
  logo_url: string;
  contato_email: string;
  contato_telefone: string;
  endereco: string;
  website: string;
}

export default function ConfigPage() {
  const [form, setForm] = useState<ConfigForm>({
    nome: "",
    cor_primaria: "#6366f1",
    cor_secundaria: "#8b5cf6",
    logo_url: "",
    contato_email: "",
    contato_telefone: "",
    endereco: "",
    website: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.tenant.config();
        const c = res.config || {};
        setForm({
          nome: c.nome || "",
          cor_primaria: c.cor_primaria || "#6366f1",
          cor_secundaria: c.cor_secundaria || "#8b5cf6",
          logo_url: c.logo_url || "",
          contato_email: c.contato_email || "",
          contato_telefone: c.contato_telefone || "",
          endereco: c.endereco || "",
          website: c.website || "",
        });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Erro ao carregar configuracoes");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.tenant.updateConfig(form as unknown as Record<string, string | null | undefined>);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar configuracoes");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof ConfigForm, value: string) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuracoes</h1>
          <p className="text-muted-foreground">Configure sua plataforma e marca</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-5 text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="w-5 h-5 text-primary" />
              Informacoes da Marca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nome da empresa</label>
              <Input
                placeholder="Minha Academia"
                value={form.nome}
                onChange={(e) => updateField("nome", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">URL do Logo</label>
              <Input
                placeholder="https://exemplo.com/logo.png"
                value={form.logo_url}
                onChange={(e) => updateField("logo_url", e.target.value)}
              />
              {form.logo_url && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <img
                    src={form.logo_url}
                    alt="Logo preview"
                    className="h-12 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="https://meusite.com"
                  value={form.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="w-5 h-5 text-primary" />
              Cores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Cor primaria</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={form.cor_primaria}
                  onChange={(e) => updateField("cor_primaria", e.target.value)}
                  className="w-10 h-10 rounded-md border border-input cursor-pointer"
                />
                <Input
                  value={form.cor_primaria}
                  onChange={(e) => updateField("cor_primaria", e.target.value)}
                  className="flex-1"
                  placeholder="#6366f1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Cor secundaria</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={form.cor_secundaria}
                  onChange={(e) => updateField("cor_secundaria", e.target.value)}
                  className="w-10 h-10 rounded-md border border-input cursor-pointer"
                />
                <Input
                  value={form.cor_secundaria}
                  onChange={(e) => updateField("cor_secundaria", e.target.value)}
                  className="flex-1"
                  placeholder="#8b5cf6"
                />
              </div>
            </div>
            <div className="mt-4 p-4 rounded-lg" style={{ background: `linear-gradient(135deg, ${form.cor_primaria}, ${form.cor_secundaria})` }}>
              <p className="text-white font-semibold text-sm">Preview das cores</p>
              <p className="text-white/70 text-xs">Gradiente primaria para secundaria</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="w-5 h-5 text-primary" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Email de contato</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="contato@empresa.com"
                    value={form.contato_email}
                    onChange={(e) => updateField("contato_email", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="(11) 99999-9999"
                    value={form.contato_telefone}
                    onChange={(e) => updateField("contato_telefone", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1 block">Endereco</label>
                <Input
                  placeholder="Rua Exemplo, 123 - Cidade/UF"
                  value={form.endereco}
                  onChange={(e) => updateField("endereco", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
