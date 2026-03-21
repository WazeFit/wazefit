/**
 * Rotas LLM — Geração por IA.
 * Enfileira jobs para o Worker LLM processar.
 *
 * POST /api/v1/llm/gerar-treino — Gerar ficha de treino com IA
 * POST /api/v1/llm/gerar-dieta  — Gerar plano nutricional com IA
 * GET  /api/v1/llm/jobs          — Listar jobs LLM do tenant
 * GET  /api/v1/llm/jobs/:id      — Status de um job específico
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc, isNull } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { llmJobs, alunos, briefings, briefingPerguntas } from '../db/schema'
import { generateId, now } from '../lib/id'
import { authMiddleware, expertOnly } from '../middleware/auth'

const llmRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

llmRouter.use('*', authMiddleware, expertOnly)

// ── Schemas de validação ──

const gerarTreinoSchema = z.object({
  aluno_id: z.string().uuid('ID do aluno inválido.'),
  briefing_id: z.string().uuid('ID do briefing inválido.').optional(),
  objetivo: z.string().optional(),
  dias_semana: z.number().int().min(1).max(7).optional(),
  nivel: z.enum(['iniciante', 'intermediario', 'avancado']).optional(),
  observacoes: z.string().optional(),
})

const gerarDietaSchema = z.object({
  aluno_id: z.string().uuid('ID do aluno inválido.'),
  briefing_id: z.string().uuid('ID do briefing inválido.').optional(),
  objetivo: z.string().optional(),
  restricoes: z.string().optional(),
  refeicoes_dia: z.number().int().min(1).max(10).optional(),
  calorias_alvo: z.number().int().min(500).max(10000).optional(),
  observacoes: z.string().optional(),
})

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  tipo: z.enum(['briefing', 'treino', 'dieta', 'avaliacao']).optional(),
})

// ═══════════════════════════════════════════════════════════════
// POST /llm/gerar-treino — Gerar ficha de treino com IA
// ═══════════════════════════════════════════════════════════════
llmRouter.post('/gerar-treino', zValidator('json', gerarTreinoSchema), async (c) => {
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const expertId = c.get('user_id')
  const db = createDB(c.env.DB)

  // Verificar aluno
  const aluno = await db
    .select({
      id: alunos.id,
      nome: alunos.nome,
      sexo: alunos.sexo,
      data_nasc: alunos.data_nasc,
      altura_cm: alunos.altura_cm,
      peso_kg: alunos.peso_kg,
      objetivo: alunos.objetivo,
    })
    .from(alunos)
    .where(
      and(eq(alunos.id, body.aluno_id), eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em)),
    )
    .get()

  if (!aluno) {
    return c.json({ error: 'Aluno não encontrado.', code: 404 }, 404)
  }

  // Buscar briefing se fornecido
  let briefingData = null
  if (body.briefing_id) {
    const briefing = await db
      .select()
      .from(briefings)
      .where(and(eq(briefings.id, body.briefing_id), eq(briefings.tenant_id, tenantId)))
      .get()

    if (briefing) {
      const perguntas = await db
        .select({ pergunta: briefingPerguntas.pergunta, resposta: briefingPerguntas.resposta })
        .from(briefingPerguntas)
        .where(eq(briefingPerguntas.briefing_id, body.briefing_id))
        .orderBy(briefingPerguntas.ordem)

      briefingData = { ...briefing, perguntas_respostas: perguntas }
    }
  }

  const jobId = generateId()
  const timestamp = now()

  await db.insert(llmJobs).values({
    id: jobId,
    tenant_id: tenantId,
    tipo: 'treino',
    input_json: JSON.stringify({
      aluno,
      briefing: briefingData,
      expert_id: expertId,
      parametros: {
        objetivo: body.objetivo,
        dias_semana: body.dias_semana,
        nivel: body.nivel,
        observacoes: body.observacoes,
      },
    }),
    status: 'pending',
    criado_em: timestamp,
  })

  try {
    await c.env.QUEUE_LLM.send({
      job_id: jobId,
      tipo: 'treino',
      tenant_id: tenantId,
    })
  } catch {
    await db
      .update(llmJobs)
      .set({ status: 'failed', erro: 'Falha ao enfileirar job.', completado_em: timestamp })
      .where(eq(llmJobs.id, jobId))

    return c.json({ error: 'Falha ao enfileirar processamento.', code: 500 }, 500)
  }

  return c.json(
    {
      job_id: jobId,
      tipo: 'treino',
      status: 'pending',
      message: 'Geração de treino enfileirada.',
    },
    201,
  )
})

// ═══════════════════════════════════════════════════════════════
// POST /llm/gerar-dieta — Gerar plano nutricional com IA
// ═══════════════════════════════════════════════════════════════
llmRouter.post('/gerar-dieta', zValidator('json', gerarDietaSchema), async (c) => {
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const expertId = c.get('user_id')
  const db = createDB(c.env.DB)

  // Verificar aluno
  const aluno = await db
    .select({
      id: alunos.id,
      nome: alunos.nome,
      sexo: alunos.sexo,
      data_nasc: alunos.data_nasc,
      altura_cm: alunos.altura_cm,
      peso_kg: alunos.peso_kg,
      objetivo: alunos.objetivo,
    })
    .from(alunos)
    .where(
      and(eq(alunos.id, body.aluno_id), eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em)),
    )
    .get()

  if (!aluno) {
    return c.json({ error: 'Aluno não encontrado.', code: 404 }, 404)
  }

  // Buscar briefing se fornecido
  let briefingData = null
  if (body.briefing_id) {
    const briefing = await db
      .select()
      .from(briefings)
      .where(and(eq(briefings.id, body.briefing_id), eq(briefings.tenant_id, tenantId)))
      .get()

    if (briefing) {
      const perguntas = await db
        .select({ pergunta: briefingPerguntas.pergunta, resposta: briefingPerguntas.resposta })
        .from(briefingPerguntas)
        .where(eq(briefingPerguntas.briefing_id, body.briefing_id))
        .orderBy(briefingPerguntas.ordem)

      briefingData = { ...briefing, perguntas_respostas: perguntas }
    }
  }

  const jobId = generateId()
  const timestamp = now()

  await db.insert(llmJobs).values({
    id: jobId,
    tenant_id: tenantId,
    tipo: 'dieta',
    input_json: JSON.stringify({
      aluno,
      briefing: briefingData,
      expert_id: expertId,
      parametros: {
        objetivo: body.objetivo,
        restricoes: body.restricoes,
        refeicoes_dia: body.refeicoes_dia,
        calorias_alvo: body.calorias_alvo,
        observacoes: body.observacoes,
      },
    }),
    status: 'pending',
    criado_em: timestamp,
  })

  try {
    await c.env.QUEUE_LLM.send({
      job_id: jobId,
      tipo: 'dieta',
      tenant_id: tenantId,
    })
  } catch {
    await db
      .update(llmJobs)
      .set({ status: 'failed', erro: 'Falha ao enfileirar job.', completado_em: timestamp })
      .where(eq(llmJobs.id, jobId))

    return c.json({ error: 'Falha ao enfileirar processamento.', code: 500 }, 500)
  }

  return c.json(
    {
      job_id: jobId,
      tipo: 'dieta',
      status: 'pending',
      message: 'Geração de dieta enfileirada.',
    },
    201,
  )
})

// ═══════════════════════════════════════════════════════════════
// GET /llm/jobs — Listar jobs LLM do tenant
// ═══════════════════════════════════════════════════════════════
llmRouter.get('/jobs', zValidator('query', listQuerySchema), async (c) => {
  const { page, limit, status, tipo } = c.req.valid('query')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const offset = (page - 1) * limit

  const conditions = [eq(llmJobs.tenant_id, tenantId)]
  if (status) {
    conditions.push(eq(llmJobs.status, status))
  }
  if (tipo) {
    conditions.push(eq(llmJobs.tipo, tipo))
  }

  const where = and(...conditions)

  const data = await db
    .select({
      id: llmJobs.id,
      tipo: llmJobs.tipo,
      status: llmJobs.status,
      tokens_input: llmJobs.tokens_input,
      tokens_output: llmJobs.tokens_output,
      custo_centavos: llmJobs.custo_centavos,
      erro: llmJobs.erro,
      criado_em: llmJobs.criado_em,
      completado_em: llmJobs.completado_em,
    })
    .from(llmJobs)
    .where(where)
    .orderBy(desc(llmJobs.criado_em))
    .limit(limit)
    .offset(offset)

  return c.json({ data })
})

// ═══════════════════════════════════════════════════════════════
// GET /llm/jobs/:id — Status de um job específico
// ═══════════════════════════════════════════════════════════════
llmRouter.get('/jobs/:id', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const job = await db
    .select()
    .from(llmJobs)
    .where(and(eq(llmJobs.id, id), eq(llmJobs.tenant_id, tenantId)))
    .get()

  if (!job) {
    return c.json({ error: 'Job não encontrado.', code: 404 }, 404)
  }

  return c.json(job)
})

export { llmRouter }
