"use client";
export const runtime = 'edge';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  Mail,
  Phone,
  Loader2,
  Save,
  Check,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface UserData {
  id?: string;
  nome: string;
  email: string;
  telefone: string;
  role?: string;
}

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("wf_user");
      if (raw) {
        const parsed = JSON.parse(raw) as UserData;
        setUser(parsed);
        setForm({
          nome: parsed.nome || "",
          email: parsed.email || "",
          telefone: parsed.telefone || "",
        });
      }
    } catch {
      // ignore parse errors
    }
    setLoading(false);
  }, []);

  const handleSave = () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = { ...user, ...form };
      localStorage.setItem("wf_user", JSON.stringify(updated));
      setUser(updated as UserData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("wf_token");
    localStorage.removeItem("wf_user");
    localStorage.removeItem("wf_tenant");
    router.push("/login");
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
          <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground">Visualize e edite suas informacoes</p>
        </div>
        <div className="flex gap-3">
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
          <Button variant="outline" onClick={handleLogout} className="text-destructive hover:text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 text-center">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-4xl mx-auto mb-4">
              {(form.nome || "U").charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-semibold">{form.nome || "Usuario"}</h2>
            <p className="text-sm text-muted-foreground mt-1">{form.email}</p>
            {user?.role && (
              <span className="inline-block mt-3 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />
              Informacoes Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Seu nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!user && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Faca login para visualizar seu perfil
            </p>
            <Button onClick={() => router.push("/login")}>Ir para Login</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
