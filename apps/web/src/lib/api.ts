/**
 * API Client — comunicação com o Worker API.
 * Simples e direto. Sem refresh automático, sem redirects.
 */

const BASE = 'https://api.wazefit.com'

export class ApiError extends Error {
  status: number
  body: { error: string; code: number }

  constructor(status: number, body: { error: string; code: number }) {
    super(body.error)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = localStorage.getItem('wf_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let data: { error: string; code: number }
    try {
      data = await res.json()
    } catch {
      data = { error: `HTTP ${res.status}`, code: res.status }
    }
    throw new ApiError(res.status, data)
  }

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
