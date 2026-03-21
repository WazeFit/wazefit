/**
 * Rotas de briefing conversacional.
 * Fluxo: Expert cria → LLM gera perguntas → Aluno responde → Expert analisa
 *
 * POST   /api/v1/briefings              — Criar briefing para aluno
 * GET    /api/v1/briefings/:id          — Detalhe com perguntas
 * POST   /api/v1/briefings/:id/responder — Aluno responde pergunta
 * POST   /api/v1/briefings/:id/gerar    — Expert solicita geração de perguntas via LLM
 * GET    /api/v1/briefings/:id/status   — Status do processamento LLM
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { briefings, briefingPerguntas, alunos, llmJobs } from '../db/schema'
import { generateId, now } from '../lib/id'
import { authMiddleware, expertOnly } from '../middleware/auth'

const briefingRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

// Auth para todas as rotas
briefingRouter.use('*', authMiddleware)

// ── Schemas de validação ──

const createBriefingSchema = z.object({
  aluno_id: z.string().uuid('ID do aluno inválido.'),
})

const responderSchema = z.object({
  pergunta_id: z.string().uuid('ID da pergunta inválido.'),
  resposta: z.string().min(1, 'Resposta não pode ser vazia.'),
})

// ═══════════════════════════════════════════════════════════════
// POST /briefings — Criar briefing para aluno (expert only)
// ═══════════════════════════════════════════════════════════════
briefingRouter.post('/', expertOnly, zValidator('json', createBriefingSchema), async (c) => {
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  // Verificar se aluno existe no tenant
  const aluno = await db
    .select({ id: alunos.id })
    .from(alunos)
    .where(and(eq(alunos.id, body.aluno_id), eq(alunos.tenant_id, tenantId)))
    .get()

  if (!aluno) {
    return c.json({ error: 'Aluno não encontrado.', code: 404 }, 404)
  }

  const id = generateId()
  const timestamp = now()

  await db.insert(briefings).values({
    id,
    tenant_id: tenantId,
    aluno_id: body.aluno_id,
    perguntas: '[]',
    status: 'pendente',
    criado_em: timestamp,
    atualizado_em: timestamp,
  })

  return c.json(
    {
      id,
      aluno_id: body.aluno_id,
      status: 'pendente',
      criado_em: timestamp,
    },
    201,
  )
})

// ═══════════════════════════════════════════════════════════════
// GET /briefings/:id — Detalhe com perguntas
// ═══════════════════════════════════════════════════════════════
briefingRouter.get('/:id', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const briefing = await db
    .select()
    .from(briefings)
    .where(and(eq(briefings.id, id), eq(briefings.tenant_id, tenantId)))
    .get()

  if (!briefing) {
    return c.json({ error: 'Briefing não encontrado.', code: 404 }, 404)
  }

  const perguntas = await db
    .select()
    .from(briefingPerguntas)
    .where(and(eq(briefingPerguntas.briefing_id, id), eq(briefingPerguntas.tenant_id, tenantId)))
    .orderBy(briefingPerguntas.ordem)

  return c.json({
    ...briefing,
    perguntas_detalhadas: perguntas,
  })
})

// ═══════════════════════════════════════════════════════════════
// POST /briefings/:id/responder — Aluno responde pergunta
// ═══════════════════════════════════════════════════════════════
briefingRouter.post('/:id/responder', zValidator('json', responderSchema), async (c) => {
  const { id } = c.req.param()
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  // Verificar briefing
  const briefing = await db
    .select({ id: briefings.id, status: briefings.status })
    .from(briefings)
    .where(and(eq(briefings.id, id), eq(briefings.tenant_id, tenantId)))
    .get()

  if (!briefing) {
    return c.json({ error: 'Briefing não encontrado.', code: 404 }, 404)
  }

  if (briefing.status === 'completo') {
    return c.json({ error: 'Briefing já foi concluído.', code: 400 }, 400)
  }

  // Verificar pergunta
  const pergunta = await db
    .select({ id: briefingPerguntas.id })
    .from(briefingPerguntas)
    .where(
      and(
        eq(briefingPerguntas.id, body.pergunta_id),
        eq(briefingPerguntas.briefing_id, id),
        eq(briefingPerguntas.tenant_id, tenantId),
      ),
    )
    .get()

  if (!pergunta) {
    return c.json({ error: 'Pergunta não encontrada neste briefing.', code: 404 }, 404)
  }

  // Salvar resposta
  await db
    .update(briefingPerguntas)
    .set({ resposta: body.resposta })
    .where(eq(briefingPerguntas.id, body.pergunta_id))

  // Atualizar status do briefing para em_andamento
  if (briefing.status === 'pendente') {
    await db
      .update(briefings)
      .set({ status: 'em_andamento', atualizado_em: now() })
      .where(eq(briefings.id, id))
  }

  // Verificar se todas as perguntas foram respondidas
  const todasPerguntas = await db
    .select({
      id: briefingPerguntas.id,
      resposta: briefingPerguntas.resposta,
    })
    .from(briefingPerguntas)
    .where(eq(briefingPerguntas.briefing_id, id))

  const todasRespondidas = todasPerguntas.length > 0 && todasPerguntas.every((p) => p.resposta !== null)

  if (todasRespondidas) {
    await db
      .update(briefings)
      .set({ status: 'completo', atualizado_em: now() })
      .where(eq(briefings.id, id))
  }

  return c.json({
    message: 'Resposta salva.',
    briefing_completo: todasRespondidas,
  })
})

// ═══════════════════════════════════════════════════════════════
// POST /briefings/:id/gerar — Expert solicita geração de perguntas via LLM
// ═══════════════════════════════════════════════════════════════
briefingRouter.post('/:id/gerar', expertOnly, async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  // Verificar briefing
  const briefing = await db
    .select()
    .from(briefings)
    .where(and(eq(briefings.id, id), eq(briefings.tenant_id, tenantId)))
    .get()

  if (!briefing) {
    return c.json({ error: 'Briefing não encontrado.', code: 404 }, 404)
  }

  // Buscar dados do aluno para contexto
  const aluno = await db
    .select({
      id: alunos.id,
      nome: alunos.nome,
      sexo: alunos.sexo,
      idade: alunos.data_nasc,
      objetivo: alunos.objetivo,
      altura_cm: alunos.altura_cm,
      peso_kg: alunos.peso_kg,
    })
    .from(alunos)
    .where(eq(alunos.id, briefing.aluno_id))
    .get()

  // Criar job LLM
  const jobId = generateId()
  const timestamp = now()

  await db.insert(llmJobs).values({
    id: jobId,
    tenant_id: tenantId,
    tipo: 'briefing',
    input_json: JSON.stringify({
      briefing_id: id,
      aluno,
    }),
    status: 'pending',
    criado_em: timestamp,
  })

  // Atualizar status do briefing
  await db
    .update(briefings)
    .set({ status: 'processando', atualizado_em: timestamp })
    .where(eq(briefings.id, id))

  // Enqueue job
  try {
    await c.env.QUEUE_LLM.send({
      job_id: jobId,
      tipo: 'briefing',
      tenant_id: tenantId,
    })
  } catch {
    // Se queue falhar, marcar job como failed
    await db
      .update(llmJobs)
      .set({ status: 'failed', erro: 'Falha ao enfileirar job.', completado_em: timestamp })
      .where(eq(llmJobs.id, jobId))

    await db
      .update(briefings)
      .set({ status: 'pendente', atualizado_em: timestamp })
      .where(eq(briefings.id, id))

    return c.json({ error: 'Falha ao enfileirar processamento.', code: 500 }, 500)
  }

  return c.json({
    job_id: jobId,
    briefing_id: id,
    status: 'processando',
    message: 'Geração de perguntas enfileirada.',
  })
})

// ═══════════════════════════════════════════════════════════════
// GET /briefings/:id/status — Status do processamento LLM
// ═══════════════════════════════════════════════════════════════
briefingRouter.get('/:id/status', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const briefing = await db
    .select({ id: briefings.id, status: briefings.status, atualizado_em: briefings.atualizado_em })
    .from(briefings)
    .where(and(eq(briefings.id, id), eq(briefings.tenant_id, tenantId)))
    .get()

  if (!briefing) {
    return c.json({ error: 'Briefing não encontrado.', code: 404 }, 404)
  }

  // Buscar último job relacionado
  const lastJob = await db
    .select({
      id: llmJobs.id,
      status: llmJobs.status,
      erro: llmJobs.erro,
      criado_em: llmJobs.criado_em,
      completado_em: llmJobs.completado_em,
    })
    .from(llmJobs)
    .where(and(eq(llmJobs.tenant_id, tenantId), eq(llmJobs.tipo, 'briefing')))
    .orderBy(desc(llmJobs.criado_em))
    .limit(1)
    .get()

  return c.json({
    briefing_id: briefing.id,
    briefing_status: briefing.status,
    ultimo_job: lastJob ?? null,
  })
})

export { briefingRouter }
