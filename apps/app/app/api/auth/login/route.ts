export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.wazefit.com";

export async function POST(request: NextRequest) {
  try {
    const { email, senha, tenant_slug } = await request.json();

    if (!email || !senha) {
      return NextResponse.json(
        { error: "Email e senha sao obrigatorios" },
        { status: 400 }
      );
    }

    // Chamar API real do WazeFit
    const apiRes = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha, tenant_slug }),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(
        { error: data.error || "Credenciais invalidas" },
        { status: apiRes.status }
      );
    }

    // A API retorna { token, user, tenant }
    // Salvar o JWT da API no cookie httpOnly
    const response = NextResponse.json({
      user: data.user,
      tenant: data.tenant,
    });

    response.cookies.set("wf_token", data.token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erro ao fazer login" },
      { status: 500 }
    );
  }
}
