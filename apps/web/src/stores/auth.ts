/**
 * Auth Store — gerencia estado de autenticação.
 * Persiste tokens no localStorage.
 */
import { create } from 'zustand'
import { api, setTokenStore } from '../lib/api'

interface User {
  id: string
  nome: string
  email: string
  role: string
  avatar_url?: string | null
}

interface Tenant {
  id: string
  nome?: string
  slug?: string
  plano?: string
  max_alunos?: number
  cor_primaria?: string
  cor_secundaria?: string
  logo_url?: string | null
}

interface AuthState {
  user: User | null
  tenant: Tenant | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (email: string, senha: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
}

interface RegisterData {
  nome: string
  email: string
  senha: string
  nome_negocio: string
  telefone?: string
  especialidade?: string
}

interface AuthResponse {
  user: User
  tenant: Tenant
  access_token: string
  refresh_token: string
  expires_in: number
}

interface MeResponse {
  user: User
  tenant: Tenant | null
}

// ── Token helpers ──

function getAccessToken(): string | null {
  try {
    return localStorage.getItem('wf_access_token')
  } catch {
    return null
  }
}

function getRefreshToken(): string | null {
  try {
    return localStorage.getItem('wf_refresh_token')
  } catch {
    return null
  }
}

function setTokens(access: string, refresh: string) {
  try {
    localStorage.setItem('wf_access_token', access)
    localStorage.setItem('wf_refresh_token', refresh)
  } catch {
    console.warn('[Auth] Falha ao salvar tokens no localStorage')
  }
}

function clearTokens() {
  try {
    localStorage.removeItem('wf_access_token')
    localStorage.removeItem('wf_refresh_token')
  } catch {
    // Ignorar
  }
}

// Registrar token store no API client
setTokenStore({ getAccessToken, getRefreshToken, setTokens, clearTokens })

// ── Store ──

export const useAuth = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, senha) => {
    const data = await api.post<AuthResponse>('/api/v1/auth/login', { email, senha })
    setTokens(data.access_token, data.refresh_token)
    set({ user: data.user, tenant: data.tenant, isAuthenticated: true, isLoading: false })
  },

  register: async (registerData) => {
    const data = await api.post<AuthResponse>('/api/v1/auth/register', registerData)
    setTokens(data.access_token, data.refresh_token)
    set({ user: data.user, tenant: data.tenant, isAuthenticated: true, isLoading: false })
  },

  logout: async () => {
    try {
      await api.post('/api/v1/auth/logout')
    } catch {
      // Ignorar
    }
    clearTokens()
    set({ user: null, tenant: null, isAuthenticated: false, isLoading: false })
  },

  loadUser: async () => {
    const token = getAccessToken()

    // Sem token = não autenticado
    if (!token) {
      set({ isLoading: false, isAuthenticated: false })
      return
    }

    try {
      const data = await api.get<MeResponse>('/api/v1/auth/me')
      set({
        user: data.user,
        tenant: data.tenant,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (err) {
      console.warn('[Auth] loadUser falhou:', err)
      clearTokens()
      set({ user: null, tenant: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
