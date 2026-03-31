export const runtime = 'edge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple, Flame, Droplet } from "lucide-react";

export default function DietaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minha Dieta</h1>
        <p className="text-muted-foreground">
          Acompanhe sua nutrição diária
        </p>
      </div>

      {/* Daily Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">1,847</p>
            <p className="text-xs text-muted-foreground">kcal</p>
            <p className="text-xs text-muted-foreground mt-1">de 2,500</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Apple className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">120g</p>
            <p className="text-xs text-muted-foreground">proteína</p>
            <p className="text-xs text-muted-foreground mt-1">de 180g</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Droplet className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">1.8L</p>
            <p className="text-xs text-muted-foreground">água</p>
            <p className="text-xs text-muted-foreground mt-1">de 3L</p>
          </CardContent>
        </Card>
      </div>

      {/* Meals */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Refeições de Hoje</h2>
        <div className="space-y-3">
          {[
            { name: "Café da Manhã", time: "08:00", calories: 450, done: true },
            { name: "Lanche da Manhã", time: "10:30", calories: 200, done: true },
            { name: "Almoço", time: "12:30", calories: 650, done: true },
            { name: "Lanche da Tarde", time: "16:00", calories: 300, done: false },
            { name: "Jantar", time: "19:00", calories: 600, done: false },
            { name: "Ceia", time: "22:00", calories: 200, done: false },
          ].map((meal) => (
            <Card key={meal.name} className={meal.done ? "opacity-60" : ""}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{meal.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {meal.time} • {meal.calories} kcal
                  </p>
                </div>
                {meal.done ? (
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full">
                    Concluído
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                    Pendente
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
