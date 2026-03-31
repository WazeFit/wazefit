export const runtime = 'edge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Clock, CheckCircle2 } from "lucide-react";

export default function TreinosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meus Treinos</h1>
        <p className="text-muted-foreground">
          Acompanhe sua rotina de treinos
        </p>
      </div>

      {/* Today's Workout */}
      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Treino de Hoje
            </CardTitle>
            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
              Hoje
            </span>
          </div>
          <CardDescription>Treino A - Peito e Tríceps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">0/8 exercícios</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: "0%" }} />
            </div>
          </div>
          <Button className="w-full">
            Iniciar Treino
          </Button>
        </CardContent>
      </Card>

      {/* Week Overview */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Esta Semana</h2>
        <div className="space-y-3">
          {[
            { day: "Segunda", name: "Treino A", done: true },
            { day: "Terça", name: "Treino B", done: true },
            { day: "Quarta", name: "Descanso", done: true },
            { day: "Quinta", name: "Treino C", done: false },
            { day: "Sexta", name: "Treino A", done: false },
          ].map((workout) => (
            <Card key={workout.day}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {workout.done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{workout.day}</p>
                    <p className="text-sm text-muted-foreground">{workout.name}</p>
                  </div>
                </div>
                {!workout.done && workout.name !== "Descanso" && (
                  <Button size="sm" variant="outline">
                    Ver
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
