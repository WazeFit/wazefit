/**
 * Auth Store — estado de autenticação.
 * Usa localStorage diretamente. Sem Zustand.
 * Re-render via React state no App.
 */

import { api, ApiError } from '../lib/api'

export interface User {
  id: string
  nome: string
  email: string
  role: string
}

export interface Tenant {
  id: string
  nome?: string
  slug?: string
  plano?: string
  logo_url?: string | null
  cor_primaria?: string | null
  cor_secundaria?: string | null
  max_alunos?: number
}

interface AuthResponse {
  user: User
  tenant: Tenant
  access_token: string
  refresh_token: string
}

interface MeResponse {
  user: User
  tenant: Tenant | null
}

/** Salvar tokens e dados do usuário */
function save(data: AuthResponse) {
  localStorage.setItem('wf_token', data.access_token)
  localStorage.setItem('wf_refresh', data.refresh_token)
  localStorage.setItem('wf_user', JSON.stringify(data.user))
  localStorage.setItem('wf_tenant', JSON.stringify(data.tenant))
}

/** Limpar tudo */
function clear() {
  localStorage.removeItem('wf_token')
  localStorage.removeItem('wf_refresh')
  localStorage.removeItem('wf_user')
  localStorage.removeItem('wf_tenant')
}

/** Ler user do localStorage */
export function getSavedUser(): User | null {
  try {
    const raw = localStorage.getItem('wf_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Ler tenant do localStorage */
export function getSavedTenant(): Tenant | null {
  try {
    const raw = localStorage.getItem('wf_tenant')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Tem token? */
export function hasToken(): boolean {
  return !!localStorage.getItem('wf_token')
}

/** Register — retorna user e tenant */
export async function register(data: {
  nome: string
  email: string
  senha: string
  nome_negocio: string
  telefone?: string
}): Promise<{ user: User; tenant: Tenant }> {
  const res = await api.post<AuthResponse>('/api/v1/auth/register', data)
  save(res)
  return { user: res.user, tenant: res.tenant }
}

/** Login */
export async function login(email: string, senha: string): Promise<{ user: User; tenant: Tenant }> {
  const res = await api.post<AuthResponse>('/api/v1/auth/login', { email, senha })
  save(res)
  return { user: res.user, tenant: res.tenant }
}

/** Verificar sessão (GET /auth/me) */
export async function checkSession(): Promise<{ user: User; tenant: Tenant } | null> {
  if (!hasToken()) return null

  try {
    const res = await api.get<MeResponse>('/api/v1/auth/me')
    // Atualizar dados locais
    localStorage.setItem('wf_user', JSON.stringify(res.user))
    if (res.tenant) localStorage.setItem('wf_tenant', JSON.stringify(res.tenant))
    return { user: res.user, tenant: res.tenant! }
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      clear()
    }
    return null
  }
}

/** Logout */
export async function logout(): Promise<void> {
  try {
    await api.post('/api/v1/auth/logout')
  } catch {
    // Ignorar
  }
  clear()
}

export { ApiError }
