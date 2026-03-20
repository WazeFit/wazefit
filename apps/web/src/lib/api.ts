/**
 * API Client — comunicação com o Worker API.
 * Gerencia tokens, refresh automático e error handling.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

interface TokenStore {
  getAccessToken: () => string | null
  getRefreshToken: () => string | null
  setTokens: (access: string, refresh: string) => void
  clearTokens: () => void
}

let tokenStore: TokenStore | null = null

export function setTokenStore(store: TokenStore) {
  tokenStore = store
}

interface ApiError {
  error: string
  code: number
  detalhes?: Array<{ campo: string; mensagem: string }>
}

class ApiClientError extends Error {
  constructor(
    public status: number,
    public data: ApiError,
  ) {
    super(data.error)
    this.name = 'ApiClientError'
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  // Adicionar token se disponível
  const token = tokenStore?.getAccessToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  // Se 401 e temos refresh token, tentar refresh
  if (res.status === 401 && tokenStore?.getRefreshToken()) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      // Retry com novo token
      headers['Authorization'] = `Bearer ${tokenStore!.getAccessToken()}`
      const retryRes = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
      })
      if (!retryRes.ok) {
        const data = await retryRes.json()
        throw new ApiClientError(retryRes.status, data as ApiError)
      }
      return retryRes.json() as Promise<T>
    } else {
      // Refresh falhou — limpar tokens
      tokenStore?.clearTokens()
      window.location.href = '/login'
      throw new ApiClientError(401, { error: 'Sessão expirada.', code: 401 })
    }
  }

  if (!res.ok) {
    const data = await res.json()
    throw new ApiClientError(res.status, data as ApiError)
  }

  return res.json() as Promise<T>
}

async function tryRefresh(): Promise<boolean> {
  try {
    const refreshToken = tokenStore?.getRefreshToken()
    if (!refreshToken) return false

    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!res.ok) return false

    const data = (await res.json()) as {
      access_token: string
      refresh_token: string
    }
    tokenStore?.setTokens(data.access_token, data.refresh_token)
    return true
  } catch {
    return false
  }
}

// ── API Methods ──

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export { ApiClientError }
