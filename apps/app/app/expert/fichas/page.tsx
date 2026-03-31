export const runtime = 'edge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function FichasPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fichas de Treino</h1>
          <p className="text-muted-foreground">
            Crie e gerencie fichas de treino para seus alunos
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Ficha
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { name: "Treino A - Peito/Tríceps", students: 15, exercises: 8 },
          { name: "Treino B - Costas/Bíceps", students: 15, exercises: 9 },
          { name: "Treino C - Pernas", students: 12, exercises: 10 },
        ].map((ficha) => (
          <Card key={ficha.name}>
            <CardHeader>
              <CardTitle className="text-lg">{ficha.name}</CardTitle>
              <CardDescription>
                {ficha.students} alunos • {ficha.exercises} exercícios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Editar Ficha
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
