export const runtime = 'edge';
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";

export default function RankingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ranking</h1>
        <p className="text-muted-foreground">
          Veja sua posição e compete com outros alunos
        </p>
      </div>

      {/* Your Position */}
      <Card className="border-primary">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">#7</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold">Sua Posição</p>
              <p className="text-sm text-muted-foreground">
                850 pontos • 23 treinos concluídos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 10 */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Top 10</h2>
        <div className="space-y-2">
          {[
            { position: 1, name: "Carlos Mendes", points: 1250, icon: Trophy, color: "text-yellow-500" },
            { position: 2, name: "Ana Paula", points: 1180, icon: Medal, color: "text-gray-400" },
            { position: 3, name: "Ricardo Santos", points: 1050, icon: Award, color: "text-orange-600" },
            { position: 4, name: "Julia Costa", points: 980, icon: null, color: "" },
            { position: 5, name: "Fernando Lima", points: 920, icon: null, color: "" },
            { position: 6, name: "Patricia Alves", points: 890, icon: null, color: "" },
            { position: 7, name: "Você", points: 850, icon: null, color: "text-primary", highlight: true },
            { position: 8, name: "Marcos Silva", points: 820, icon: null, color: "" },
            { position: 9, name: "Beatriz Souza", points: 790, icon: null, color: "" },
            { position: 10, name: "Gabriel Rocha", points: 760, icon: null, color: "" },
          ].map((user) => (
            <Card key={user.position} className={user.highlight ? "border-primary" : ""}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex items-center gap-3 flex-1">
                  {user.icon ? (
                    <user.icon className={`h-6 w-6 ${user.color}`} />
                  ) : (
                    <span className={`text-lg font-bold w-6 text-center ${user.color || "text-muted-foreground"}`}>
                      {user.position}
                    </span>
                  )}
                  <div>
                    <p className={`font-medium ${user.highlight ? "text-primary" : ""}`}>
                      {user.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.points} pontos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
