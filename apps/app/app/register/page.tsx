"use client";
export const runtime = 'edge';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.wazefit.com";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    nome_marca: "",
    slug: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleMarcaChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      nome_marca: value,
      slug: prev.slug || generateSlug(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar conta");
      }

      if (data.token) {
        localStorage.setItem("wf_token", data.token);
      }
      if (data.user) {
        localStorage.setItem("wf_user", JSON.stringify(data.user));
      }
      if (data.tenant) {
        localStorage.setItem("wf_tenant", JSON.stringify(data.tenant));
      }

      router.push("/expert/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            WazeFit
          </CardTitle>
          <CardDescription className="text-center">
            Crie sua conta e comece a usar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="nome" className="text-sm font-medium">
                Nome completo
              </label>
              <Input
                id="nome"
                placeholder="Seu nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="senha" className="text-sm font-medium">
                Senha
              </label>
              <Input
                id="senha"
                type="password"
                placeholder="********"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="nome_marca" className="text-sm font-medium">
                Nome da marca
              </label>
              <Input
                id="nome_marca"
                placeholder="Minha Academia"
                value={formData.nome_marca}
                onChange={(e) => handleMarcaChange(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="slug" className="text-sm font-medium">
                Slug (URL)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">wazefit.com/</span>
                <Input
                  id="slug"
                  placeholder="minha-academia"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                  required
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Criando conta..." : "Criar Conta"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Ja tem conta?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-primary hover:underline font-medium"
              >
                Entrar
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
