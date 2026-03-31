export const runtime = 'edge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

export default function AlunosPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alunos</h1>
          <p className="text-muted-foreground">
            Gerencie seus alunos e acompanhe o progresso
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Aluno
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar alunos..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Students List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { name: "João Silva", email: "joao@email.com", status: "Ativo" },
          { name: "Maria Santos", email: "maria@email.com", status: "Ativo" },
          { name: "Pedro Oliveira", email: "pedro@email.com", status: "Inativo" },
        ].map((student) => (
          <Card key={student.email}>
            <CardHeader>
              <CardTitle className="text-lg">{student.name}</CardTitle>
              <CardDescription>{student.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  student.status === "Ativo" 
                    ? "bg-green-500/10 text-green-500" 
                    : "bg-gray-500/10 text-gray-500"
                }`}>
                  {student.status}
                </span>
                <Button variant="outline" size="sm">
                  Ver Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
