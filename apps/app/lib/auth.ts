import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "wazefit-secret-change-in-production"
);

export interface User {
  id: string;
  email: string;
  name: string;
  role: "expert" | "user";
  tenantId: string;
}

export interface AuthToken {
  user: User;
  exp: number;
}

/**
 * Cria um JWT token
 */
export async function createToken(user: User): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verifica e decodifica um JWT token
 */
export async function verifyToken(token: string): Promise<AuthToken | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Valida se o payload tem a estrutura esperada
    if (!payload.user || typeof payload.user !== "object") {
      return null;
    }
    
    return payload as unknown as AuthToken;
  } catch {
    return null;
  }
}

/**
 * Obtém o usuário autenticado da sessão
 */
export async function getUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");

  if (!token) {
    return null;
  }

  const decoded = await verifyToken(token.value);
  return decoded?.user || null;
}

/**
 * Define o cookie de autenticação
 */
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

/**
 * Remove o cookie de autenticação
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}

/**
 * Verifica se o usuário tem permissão de expert
 */
export function isExpert(user: User | null): boolean {
  return user?.role === "expert";
}

/**
 * API client com autenticação
 */
export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token.value}`);
  }

  const response = await fetch(`https://api.wazefit.com${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
