export const runtime = 'edge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function NutricaoPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nutrição</h1>
          <p className="text-muted-foreground">
            Gerencie planos nutricionais dos seus alunos
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { name: "Dieta Cutting", students: 8, calories: "2000 kcal" },
          { name: "Dieta Bulking", students: 12, calories: "3500 kcal" },
          { name: "Dieta Manutenção", students: 20, calories: "2500 kcal" },
        ].map((plano) => (
          <Card key={plano.name}>
            <CardHeader>
              <CardTitle className="text-lg">{plano.name}</CardTitle>
              <CardDescription>
                {plano.students} alunos • {plano.calories}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Editar Plano
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
