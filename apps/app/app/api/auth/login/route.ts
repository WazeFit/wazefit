export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // TODO: Validar credenciais com a API
    // const response = await fetch("https://api.wazefit.com/auth/login", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ email, password }),
    // });

    // Mock de autenticação para desenvolvimento
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Mock user (em produção, virá da API)
    const user = {
      id: "1",
      email,
      name: email.split("@")[0],
      role: email.includes("expert") ? "expert" : "user",
      tenantId: "default",
    } as const;

    // Cria token JWT
    const token = await createToken(user);

    // Define cookie
    await setAuthCookie(token);

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erro ao fazer login" },
      { status: 500 }
    );
  }
}
