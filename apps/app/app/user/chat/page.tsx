"use client";

export const runtime = 'edge';

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages] = useState([
    { id: 1, from: "expert", text: "Olá! Como foi o treino de hoje?", time: "14:30" },
    { id: 2, from: "user", text: "Foi ótimo! Consegui aumentar a carga no supino.", time: "14:32" },
    { id: 3, from: "expert", text: "Excelente! Parabéns pelo progresso 💪", time: "14:33" },
  ]);

  const handleSend = () => {
    if (message.trim()) {
      // TODO: Enviar mensagem
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div>
        <h1 className="text-2xl font-bold mb-2">Chat</h1>
        <p className="text-muted-foreground mb-4">
          Converse com seu personal trainer
        </p>
      </div>

      {/* Messages */}
      <Card className="flex-1 mb-4 overflow-hidden">
        <CardContent className="p-4 h-full overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.from === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className="text-xs opacity-70 mt-1">{msg.time}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Digite sua mensagem..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
        />
        <Button onClick={handleSend} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
