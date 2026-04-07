"use client";
export const runtime = 'edge';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building,
  Users,
  Dumbbell,
  DollarSign,
  Search,
  Loader2,
  Mail,
  Calendar,
  Shield,
} from "lucide-react";
import { api, ApiError, type AdminTenant, type AdminStats } from "@/lib/api";

export default function AdminPage() {
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [tenantsRes, statsRes] = await Promise.allSettled([
        api.admin.tenants(),
        api.admin.stats(),
      ]);
      if (tenantsRes.status === "fulfilled") setTenants(tenantsRes.value);
      if (statsRes.status === "fulfilled") setStats(statsRes.value);
      if (tenantsRes.status === "rejected" && statsRes.status === "rejected") {
        throw tenantsRes.reason;
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar dados admin");
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.tenants(searchTerm || undefined);
      setTenants(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro na busca");
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = searchTerm
    ? tenants.filter(
        (t) =>
          t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : tenants;

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ativo: "bg-green-500/10 text-green-400 border-green-500/20",
      trial: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      inativo: "bg-gray-500/10 text-gray-400 border-gray-500/20",
      suspenso: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[status] || styles.inativo}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const planoBadge = (plano: string) => {
    const styles: Record<string, string> = {
      free: "bg-gray-500/10 text-gray-400",
      starter: "bg-blue-500/10 text-blue-400",
      pro: "bg-purple-500/10 text-purple-400",
      enterprise: "bg-yellow-500/10 text-yellow-400",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[plano] || styles.free}`}>
        {plano.charAt(0).toUpperCase() + plano.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
          <p className="text-muted-foreground">Painel administrativo global</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Building, label: "Tenants", value: stats.total_tenants, color: "text-primary" },
            { icon: Users, label: "Alunos", value: stats.total_alunos, color: "text-emerald-400" },
            { icon: Dumbbell, label: "Treinos", value: stats.total_treinos, color: "text-blue-400" },
            { icon: DollarSign, label: "Receita", value: `R$ ${stats.revenue.toFixed(2)}`, color: "text-green-400" },
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
      )}

      <Card>
        <CardContent className="p-5">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tenant por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              Buscar
            </Button>
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

      {!loading && filteredTenants.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum tenant encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Tente ajustar a busca" : "Nenhum tenant cadastrado no sistema"}
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && filteredTenants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tenants ({filteredTenants.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Tenant</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Plano</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Alunos</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Ultimo Login</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Criado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-medium">{tenant.nome}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {tenant.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">{planoBadge(tenant.plano)}</td>
                      <td className="px-5 py-3.5">{statusBadge(tenant.status)}</td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1 text-sm">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          {tenant.alunos_count}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {tenant.last_login
                          ? new Date(tenant.last_login).toLocaleDateString("pt-BR")
                          : "Nunca"}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
