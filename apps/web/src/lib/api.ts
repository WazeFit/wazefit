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

// ── Types — Sprint 3 ──

export interface BriefingPergunta {
  id: string
  texto: string
  resposta: string | null
  ordem: number
}

export interface Briefing {
  id: string
  aluno_id: string
  aluno_nome: string
  status: 'pendente' | 'gerando' | 'aguardando_respostas' | 'completo' | 'erro'
  total_perguntas: number
  respostas_count: number
  created_at: string
}

export interface BriefingDetail {
  id: string
  aluno_id: string
  aluno_nome: string
  status: 'pendente' | 'gerando' | 'aguardando_respostas' | 'completo' | 'erro'
  perguntas: BriefingPergunta[]
  analise: string | null
  created_at: string
  updated_at: string
}

export interface GerarTreinoParams {
  aluno_id: string
  objetivo: string
  nivel: string
  dias_semana: number
  observacoes?: string
}

export interface GerarDietaParams {
  aluno_id: string
  objetivo: string
  restricoes?: string
  calorias_alvo?: number
  observacoes?: string
}

export interface LLMJob {
  id: string
  tipo: 'treino' | 'dieta' | 'briefing'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  aluno_id: string
  aluno_nome?: string
  resultado: Record<string, unknown> | null
  erro: string | null
  tokens_usados: number | null
  custo_estimado: number | null
  created_at: string
  updated_at: string
}

export interface Alimento {
  id: string
  nome: string
  quantidade: number
  unidade: string
  calorias: number
  proteina: number
  carboidrato: number
  gordura: number
}

export interface AlimentoInput {
  nome: string
  quantidade: number
  unidade: string
  calorias: number
  proteina: number
  carboidrato: number
  gordura: number
}

export interface Refeicao {
  id: string
  nome: string
  horario: string
  ordem: number
  alimentos: Alimento[]
}

export interface RefeicaoInput {
  nome: string
  horario?: string
  ordem?: number
}

export interface PlanoNutricional {
  id: string
  aluno_id: string
  aluno_nome?: string
  nome: string
  objetivo: string
  ativo: boolean
  calorias_alvo: number
  proteina_alvo: number
  carboidrato_alvo: number
  gordura_alvo: number
  refeicoes: Refeicao[]
  created_at: string
  updated_at: string
}

export interface PlanoNutricionalInput {
  aluno_id: string
  nome: string
  objetivo: string
  calorias_alvo: number
  proteina_alvo: number
  carboidrato_alvo: number
  gordura_alvo: number
}

export interface MedidaCorporal {
  local: string
  valor: number
  unidade: string
}

export interface AvaliacaoAnamnese {
  historico_medico: string
  lesoes: string
  medicamentos: string
  objetivos: string
  nivel_atividade: string
  observacoes: string
}

export interface AvaliacaoFisica {
  peso: number
  altura: number
  imc: number
  medidas: MedidaCorporal[]
}

export interface AvaliacaoBioimpedancia {
  gordura_percentual: number
  massa_magra: number
  agua_corporal: number
  taxa_metabolica: number
  idade_metabolica: number
  gordura_visceral: number
}

export type AvaliacaoTipo = 'anamnese' | 'fisica' | 'bioimpedancia'

export interface Avaliacao {
  id: string
  aluno_id: string
  aluno_nome?: string
  tipo: AvaliacaoTipo
  dados: AvaliacaoAnamnese | AvaliacaoFisica | AvaliacaoBioimpedancia
  observacoes: string | null
  created_at: string
}

export interface AvaliacaoInput {
  aluno_id: string
  tipo: AvaliacaoTipo
  dados: AvaliacaoAnamnese | AvaliacaoFisica | AvaliacaoBioimpedancia
  observacoes?: string
}

export interface TenantConfig {
  id: string
  nome: string
  slug: string
  plano: string
  cor_primaria: string
  cor_secundaria: string
  logo_url: string | null
  favicon_url: string | null
  created_at: string
  updated_at: string
}

export interface TenantBranding {
  nome: string
  cor_primaria: string
  cor_secundaria: string
  logo_url: string | null
  favicon_url: string | null
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

  // ── Sprint 3 ──

  briefings: {
    list: (alunoId?: string) =>
      request<Briefing[]>('GET', `/api/v1/briefings${alunoId ? `?aluno_id=${alunoId}` : ''}`),
    create: (alunoId: string) =>
      request<BriefingDetail>('POST', '/api/v1/briefings', { aluno_id: alunoId }),
    get: (id: string) =>
      request<BriefingDetail>('GET', `/api/v1/briefings/${id}`),
    responder: (id: string, perguntaId: string, resposta: string) =>
      request<void>('POST', `/api/v1/briefings/${id}/respostas`, { pergunta_id: perguntaId, resposta }),
    gerar: (id: string) =>
      request<{ job_id: string }>('POST', `/api/v1/briefings/${id}/gerar`),
    status: (id: string) =>
      request<{ status: string }>('GET', `/api/v1/briefings/${id}/status`),
  },

  llm: {
    gerarTreino: (params: GerarTreinoParams) =>
      request<{ job_id: string }>('POST', '/api/v1/llm/gerar-treino', params),
    gerarDieta: (params: GerarDietaParams) =>
      request<{ job_id: string }>('POST', '/api/v1/llm/gerar-dieta', params),
    jobs: () =>
      request<LLMJob[]>('GET', '/api/v1/llm/jobs'),
    job: (id: string) =>
      request<LLMJob>('GET', `/api/v1/llm/jobs/${id}`),
  },

  nutricao: {
    planos: {
      list: (alunoId?: string) =>
        request<PlanoNutricional[]>('GET', `/api/v1/nutricao/planos${alunoId ? `?aluno_id=${alunoId}` : ''}`),
      get: (id: string) =>
        request<PlanoNutricional>('GET', `/api/v1/nutricao/planos/${id}`),
      create: (data: PlanoNutricionalInput) =>
        request<PlanoNutricional>('POST', '/api/v1/nutricao/planos', data),
      update: (id: string, data: Partial<PlanoNutricionalInput>) =>
        request<PlanoNutricional>('PUT', `/api/v1/nutricao/planos/${id}`, data),
      delete: (id: string) =>
        request<{ ok: boolean }>('DELETE', `/api/v1/nutricao/planos/${id}`),
    },
    refeicoes: {
      create: (planoId: string, data: RefeicaoInput) =>
        request<Refeicao>('POST', `/api/v1/nutricao/planos/${planoId}/refeicoes`, data),
      update: (planoId: string, id: string, data: Partial<RefeicaoInput>) =>
        request<Refeicao>('PUT', `/api/v1/nutricao/planos/${planoId}/refeicoes/${id}`, data),
      delete: (planoId: string, id: string) =>
        request<{ ok: boolean }>('DELETE', `/api/v1/nutricao/planos/${planoId}/refeicoes/${id}`),
    },
    alimentos: {
      create: (planoId: string, refeicaoId: string, data: AlimentoInput) =>
        request<Alimento>('POST', `/api/v1/nutricao/planos/${planoId}/refeicoes/${refeicaoId}/alimentos`, data),
      update: (planoId: string, refeicaoId: string, id: string, data: Partial<AlimentoInput>) =>
        request<Alimento>('PUT', `/api/v1/nutricao/planos/${planoId}/refeicoes/${refeicaoId}/alimentos/${id}`, data),
      delete: (planoId: string, refeicaoId: string, id: string) =>
        request<{ ok: boolean }>('DELETE', `/api/v1/nutricao/planos/${planoId}/refeicoes/${refeicaoId}/alimentos/${id}`),
    },
    meuPlano: () =>
      request<PlanoNutricional | null>('GET', '/api/v1/nutricao/meu-plano'),
  },

  avaliacoes: {
    list: (alunoId?: string, tipo?: AvaliacaoTipo) => {
      const params = new URLSearchParams()
      if (alunoId) params.set('aluno_id', alunoId)
      if (tipo) params.set('tipo', tipo)
      const qs = params.toString()
      return request<Avaliacao[]>('GET', `/api/v1/avaliacoes${qs ? `?${qs}` : ''}`)
    },
    get: (id: string) =>
      request<Avaliacao>('GET', `/api/v1/avaliacoes/${id}`),
    create: (data: AvaliacaoInput) =>
      request<Avaliacao>('POST', '/api/v1/avaliacoes', data),
    update: (id: string, data: Partial<AvaliacaoInput>) =>
      request<Avaliacao>('PUT', `/api/v1/avaliacoes/${id}`, data),
    delete: (id: string) =>
      request<{ ok: boolean }>('DELETE', `/api/v1/avaliacoes/${id}`),
  },

  tenant: {
    config: () =>
      request<TenantConfig>('GET', '/api/v1/tenant/config'),
    updateConfig: (data: Partial<TenantConfig>) =>
      request<TenantConfig>('PUT', '/api/v1/tenant/config', data),
    branding: () =>
      request<TenantBranding>('GET', '/api/v1/tenant/branding'),
  },
}
