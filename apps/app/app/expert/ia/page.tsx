export const runtime = 'edge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles } from "lucide-react";

export default function IAPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">IA Assistant</h1>
        <p className="text-muted-foreground">
          Ferramentas inteligentes para otimizar seu trabalho
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Gerador de Fichas
            </CardTitle>
            <CardDescription>
              Crie fichas personalizadas com IA baseado no perfil do aluno
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar Ficha
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Análise de Progresso
            </CardTitle>
            <CardDescription>
              IA analisa o progresso dos alunos e sugere ajustes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              Ver Análises
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Plano Nutricional
            </CardTitle>
            <CardDescription>
              Gere planos nutricionais personalizados automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              Gerar Plano
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Chatbot Expert
            </CardTitle>
            <CardDescription>
              Tire dúvidas e receba sugestões da IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              Abrir Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
