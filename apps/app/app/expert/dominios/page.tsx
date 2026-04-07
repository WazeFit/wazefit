"use client";
export const runtime = 'edge';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Globe,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  RefreshCw,
  Shield,
} from "lucide-react";
import { api, ApiError, type DominioTenant } from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  active: { label: "Ativo", icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
  pending: { label: "Pendente", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  failed: { label: "Falhou", icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
};

export default function DominiosPage() {
  const [dominios, setDominios] = useState<DominioTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    loadDominios();
  }, []);

  async function loadDominios() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.dominios.list();
      setDominios(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar dominios");
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await api.dominios.create({ dominio: newDomain.trim() });
      setNewDomain("");
      setShowAdd(false);
      await loadDominios();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao adicionar dominio");
    } finally {
      setAdding(false);
    }
  };

  const handleVerify = async (id: string) => {
    setVerifying(id);
    setError(null);
    try {
      const result = await api.dominios.verificar(id);
      if (result.verificado) {
        await loadDominios();
      } else {
        setError("DNS ainda nao propagado. Tente novamente em alguns minutos.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao verificar dominio");
    } finally {
      setVerifying(null);
    }
  };

  const handleRemove = async (id: string) => {
    setRemoving(id);
    setError(null);
    try {
      await api.dominios.remove(id);
      await loadDominios();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao remover dominio");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dominios Personalizados</h1>
          <p className="text-muted-foreground">Configure dominios customizados para sua plataforma</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Dominio
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-5 text-destructive">{error}</CardContent>
        </Card>
      )}

      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Novo Dominio</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="flex gap-3">
              <Input
                placeholder="meudominio.com.br"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" disabled={adding}>
                {adding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Adicionar
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
                Cancelar
              </Button>
            </form>
            <div className="mt-4 p-4 bg-muted rounded-lg text-sm space-y-2">
              <p className="font-medium">Configuracao DNS necessaria:</p>
              <p className="text-muted-foreground">
                Adicione um registro CNAME apontando seu dominio para <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">proxy.wazefit.com</code>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && dominios.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dominio configurado</h3>
            <p className="text-muted-foreground mb-4">
              Adicione um dominio personalizado para sua plataforma
            </p>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Dominio
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && dominios.length > 0 && (
        <div className="space-y-4">
          {dominios.map((dominio) => {
            const status = STATUS_CONFIG[dominio.status] || STATUS_CONFIG.pending;
            const StatusIcon = status.icon;
            return (
              <Card key={dominio.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 ${status.bg} rounded-lg flex items-center justify-center`}>
                        <Globe className={`w-5 h-5 ${status.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{dominio.dominio}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                          <span className={`flex items-center gap-1 ${status.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.label}
                          </span>
                          {dominio.ssl_status && (
                            <span className="flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5" />
                              SSL: {dominio.ssl_status}
                            </span>
                          )}
                          <span>
                            Adicionado em {new Date(dominio.criado_em).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {dominio.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerify(dominio.id)}
                          disabled={verifying === dominio.id}
                        >
                          {verifying === dominio.id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-1" />
                          )}
                          Verificar DNS
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemove(dominio.id)}
                        disabled={removing === dominio.id}
                        className="text-destructive hover:text-destructive"
                      >
                        {removing === dominio.id ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-1" />
                        )}
                        Remover
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
