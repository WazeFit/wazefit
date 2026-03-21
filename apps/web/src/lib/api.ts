/**
 * API Client v2 — comunicação tipada com o Worker API.
 * Todos os endpoints da Sprint 2 cobertos.
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

// ── Types ──

export interface Exercicio {
  id: string
  nome: string
  grupo_muscular: string
  equipamento: string
  video_url: string | null
  instrucoes: string | null
  created_at: string
}

export interface ExercicioInput {
  nome: string
  grupo_muscular: string
  equipamento?: string
  video_url?: string
  instrucoes?: string
}

export interface FichaExercicio {
  exercicio_id: string
  series: number
  repeticoes: string
  descanso_seg: number
  ordem: number
  observacoes?: string
  exercicio?: Exercicio
}

export interface Ficha {
  id: string
  nome: string
  descricao: string | null
  tipo: string
  exercicios: FichaExercicio[]
  created_at: string
}

export interface FichaInput {
  nome: string
  descricao?: string
  tipo?: string
  exercicios: Omit<FichaExercicio, 'exercicio'>[]
}

export interface Template {
  id: string
  nome: string
  descricao: string | null
  tipo: string
  exercicios: FichaExercicio[]
}

export interface CalendarioData {
  [dia: string]: { ficha_id: string; ficha_nome?: string } | null
}

export interface TreinoHoje {
  dia_semana: string
  ficha: Ficha | null
  mensagem?: string
}

export interface Execucao {
  id: string
  aluno_id: string
  ficha_id: string
  data: string
  duracao_min: number | null
  observacoes: string | null
  created_at: string
}

export interface ExecucaoInput {
  ficha_id: string
  data?: string
  duracao_min?: number
  observacoes?: string
}

export interface RankingEntry {
  aluno_id: string
  nome: string
  pontos: number
  posicao: number
  treinos_semana: number
}

export interface EvolucaoData {
  total_treinos: number
  frequencia_semanal: number
  sequencia_atual: number
  historico: { data: string; treinou: boolean }[]
}

export interface ChatMensagem {
  id: string
  remetente_id: string
  remetente_nome: string
  conteudo: string
  tipo: string
  lida: boolean
  created_at: string
}

export interface Conversa {
  aluno_id: string
  aluno_nome: string
  ultima_mensagem: string
  nao_lidas: number
  updated_at: string
}

export interface Cobranca {
  id: string
  aluno_id: string
  aluno_nome?: string
  valor: number
  status: string
  vencimento: string
  descricao: string | null
  created_at: string
}

export interface CobrancaInput {
  aluno_id: string
  valor: number
  vencimento: string
  descricao?: string
}

export interface ResumoFinanceiro {
  receita_mes: number
  receita_mes_anterior: number
  total_cobrancas: number
  cobrancas_pagas: number
  cobrancas_pendentes: number
  cobrancas_atrasadas: number
}

export interface UploadUrlParams {
  filename: string
  content_type: string
  tipo: string
}

export interface UploadUrlResponse {
  upload_url: string
  file_key: string
}

export interface Aluno {
  id: string
  nome: string
  email: string
  telefone: string | null
  status: string
  created_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

// ── API Client ──

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),

  alunos: {
    list: (page = 1, perPage = 20) =>
      request<PaginatedResponse<Aluno>>('GET', `/api/v1/alunos?page=${page}&per_page=${perPage}`),
    get: (id: string) =>
      request<Aluno>('GET', `/api/v1/alunos/${id}`),
    create: (data: { nome: string; email: string; telefone?: string }) =>
      request<Aluno>('POST', '/api/v1/alunos', data),
    update: (id: string, data: Partial<{ nome: string; email: string; telefone: string; status: string }>) =>
      request<Aluno>('PUT', `/api/v1/alunos/${id}`, data),
  },

  exercicios: {
    list: (grupo?: string) =>
      request<Exercicio[]>('GET', `/api/v1/exercicios${grupo ? `?grupo_muscular=${encodeURIComponent(grupo)}` : ''}`),
    get: (id: string) =>
      request<Exercicio>('GET', `/api/v1/exercicios/${id}`),
    create: (data: ExercicioInput) =>
      request<Exercicio>('POST', '/api/v1/exercicios', data),
    update: (id: string, data: Partial<ExercicioInput>) =>
      request<Exercicio>('PUT', `/api/v1/exercicios/${id}`, data),
    delete: (id: string) =>
      request<{ ok: boolean }>('DELETE', `/api/v1/exercicios/${id}`),
  },

  fichas: {
    list: () =>
      request<Ficha[]>('GET', '/api/v1/fichas'),
    get: (id: string) =>
      request<Ficha>('GET', `/api/v1/fichas/${id}`),
    create: (data: FichaInput) =>
      request<Ficha>('POST', '/api/v1/fichas', data),
    update: (id: string, data: Partial<FichaInput>) =>
      request<Ficha>('PUT', `/api/v1/fichas/${id}`, data),
    delete: (id: string) =>
      request<{ ok: boolean }>('DELETE', `/api/v1/fichas/${id}`),
    atribuir: (fichaId: string, alunoId: string) =>
      request<{ ok: boolean }>('POST', `/api/v1/fichas/${fichaId}/atribuir`, { aluno_id: alunoId }),
  },

  biblioteca: {
    list: () =>
      request<Template[]>('GET', '/api/v1/biblioteca'),
  },

  calendario: {
    get: (alunoId: string) =>
      request<CalendarioData>('GET', `/api/v1/alunos/${alunoId}/calendario`),
    save: (alunoId: string, data: CalendarioData) =>
      request<CalendarioData>('PUT', `/api/v1/alunos/${alunoId}/calendario`, data),
  },

  treino: {
    hoje: (alunoId: string) =>
      request<TreinoHoje>('GET', `/api/v1/alunos/${alunoId}/treino-hoje`),
  },

  execucoes: {
    create: (data: ExecucaoInput) =>
      request<Execucao>('POST', '/api/v1/execucoes', data),
    list: (alunoId?: string, page = 1) =>
      request<PaginatedResponse<Execucao>>('GET', `/api/v1/execucoes?page=${page}${alunoId ? `&aluno_id=${alunoId}` : ''}`),
  },

  ranking: {
    list: () =>
      request<RankingEntry[]>('GET', '/api/v1/ranking'),
  },

  evolucao: {
    get: (alunoId: string, dias = 30) =>
      request<EvolucaoData>('GET', `/api/v1/evolucao/${alunoId}?dias=${dias}`),
  },

  chat: {
    mensagens: (alunoId: string, since?: string) =>
      request<ChatMensagem[]>('GET', `/api/v1/chat/${alunoId}/mensagens${since ? `?since=${encodeURIComponent(since)}` : ''}`),
    enviar: (alunoId: string, conteudo: string, tipo = 'texto') =>
      request<ChatMensagem>('POST', `/api/v1/chat/${alunoId}/mensagens`, { conteudo, tipo }),
    marcarLidas: (alunoId: string) =>
      request<{ ok: boolean }>('PUT', `/api/v1/chat/${alunoId}/mensagens/lidas`),
    conversas: () =>
      request<Conversa[]>('GET', '/api/v1/chat/conversas'),
  },

  media: {
    getUploadUrl: (params: UploadUrlParams) =>
      request<UploadUrlResponse>('POST', '/api/v1/media/upload-url', params),
    confirm: (fileKey: string) =>
      request<{ url: string }>('POST', '/api/v1/media/confirm', { file_key: fileKey }),
  },

  cobrancas: {
    list: (status?: string) =>
      request<Cobranca[]>('GET', `/api/v1/cobrancas${status ? `?status=${status}` : ''}`),
    get: (id: string) =>
      request<Cobranca>('GET', `/api/v1/cobrancas/${id}`),
    create: (data: CobrancaInput) =>
      request<Cobranca>('POST', '/api/v1/cobrancas', data),
    update: (id: string, data: Partial<CobrancaInput & { status: string }>) =>
      request<Cobranca>('PUT', `/api/v1/cobrancas/${id}`, data),
  },

  financeiro: {
    resumo: () =>
      request<ResumoFinanceiro>('GET', '/api/v1/financeiro/resumo'),
  },
}
