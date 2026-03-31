export const runtime = 'edge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Activity } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Métricas e insights sobre sua plataforma
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Crescimento de Alunos
            </CardTitle>
            <CardDescription>
              Últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              [Gráfico de crescimento]
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Taxa de Conclusão
            </CardTitle>
            <CardDescription>
              Treinos concluídos vs. planejados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              [Gráfico de conclusão]
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progresso Médio
            </CardTitle>
            <CardDescription>
              Evolução dos alunos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              [Gráfico de progresso]
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Exercícios Mais Usados
            </CardTitle>
            <CardDescription>
              Top 10 exercícios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              [Gráfico de exercícios]
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
