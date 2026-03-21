/**
 * WF-404 — Periodização Inteligente (IA)
 * 
 * POST   /api/v1/periodizacao              — Criar periodização (expert only)
 * GET    /api/v1/periodizacao              — Listar periodizações (filtro aluno_id)
 * GET    /api/v1/periodizacao/:id          — Detalhe
 * PUT    /api/v1/periodizacao/:id          — Atualizar
 * DELETE /api/v1/periodizacao/:id          — Soft delete
 * POST   /api/v1/periodizacao/:id/gerar-ia — Gerar via LLM (queue job)
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, isNull, desc } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { periodizacoes, llmJobs, alunos } from '../db/schema'
import { generateId, now } from '../lib/id'
import { authMiddleware, expertOnly } from '../middleware/auth'

const periodizacaoRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

periodizacaoRouter.use('*', authMiddleware, expertOnly)

// ── Schemas ──

const createPeriodizacaoSchema = z.object({
  aluno_id: z.string(),
  tipo: z.enum(['linear', 'ondulada', 'bloco', 'dup']),
  duracao_semanas: z.number().int().min(4).max(52),
  objetivo: z.string().optional(),
  gerar_ia: z.boolean().optional().default(false),
})

const updatePeriodizacaoSchema = z.object({
  tipo: z.enum(['linear', 'ondulada', 'bloco', 'dup']).optional(),
  duracao_semanas: z.number().int().min(4).max(52).optional(),
  fase_atual: z.number().int().min(1).optional(),
  config_json: z.string().optional(),
})

// ═══════════════════════════════════════════════════════════════
// POST /periodizacao — Criar periodização
// ═══════════════════════════════════════════════════════════════
periodizacaoRouter.post('/', zValidator('json', createPeriodizacaoSchema), async (c) => {
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const expertId = c.get('user_id')
  const db = createDB(c.env.DB)

  // Verificar se aluno existe
  const aluno = await db
    .select({ id: alunos.id })
    .from(alunos)
    .where(
      and(
        eq(alunos.id, body.aluno_id),
        eq(alunos.tenant_id, tenantId),
        isNull(alunos.deletado_em),
      ),
    )
    .get()

  if (!aluno) {
    return c.json({ error: 'Aluno não encontrado.', code: 404 }, 404)
  }

  const id = generateId()
  const timestamp = now()

  const configBase = {
    objetivo: body.objetivo ?? 'Hipertrofia',
    fases: [] as Array<{ semana: number; intensidade: string; volume: string }>,
  }

  await db.insert(periodizacoes).values({
    id,
    tenant_id: tenantId,
    aluno_id: body.aluno_id,
    expert_id: expertId,
    tipo: body.tipo,
    duracao_semanas: body.duracao_semanas,
    fase_atual: 1,
    config_json: JSON.stringify(configBase),
    gerado_por_ia: body.gerar_ia,
    criado_em: timestamp,
    atualizado_em: timestamp,
  })

  // Se gerar_ia, criar LLM job
  let llmJobId: string | null = null
  if (body.gerar_ia) {
    llmJobId = generateId()
    await db.insert(llmJobs).values({
      id: llmJobId,
      tenant_id: tenantId,
      tipo: 'treino',
      input_json: JSON.stringify({
        periodizacao_id: id,
        aluno_id: body.aluno_id,
        tipo: body.tipo,
        duracao_semanas: body.duracao_semanas,
        objetivo: body.objetivo,
      }),
      status: 'pending',
      criado_em: timestamp,
    })
  }

  return c.json(
    {
      id,
      aluno_id: body.aluno_id,
      tipo: body.tipo,
      duracao_semanas: body.duracao_semanas,
      fase_atual: 1,
      gerado_por_ia: body.gerar_ia,
      llm_job_id: llmJobId,
      message: body.gerar_ia
        ? 'Periodização criada. Geração IA em andamento.'
        : 'Periodização criada.',
    },
    201,
  )
})

// ═══════════════════════════════════════════════════════════════
// GET /periodizacao — Listar periodizações
// ═══════════════════════════════════════════════════════════════
periodizacaoRouter.get('/', async (c) => {
  const tenantId = c.get('tenant_id')
  const alunoId = c.req.query('aluno_id')
  const db = createDB(c.env.DB)

  const conditions = [eq(periodizacoes.tenant_id, tenantId), isNull(periodizacoes.deletado_em)]
  if (alunoId) {
    conditions.push(eq(periodizacoes.aluno_id, alunoId))
  }

  const data = await db
    .select({
      id: periodizacoes.id,
      aluno_id: periodizacoes.aluno_id,
      expert_id: periodizacoes.expert_id,
      tipo: periodizacoes.tipo,
      duracao_semanas: periodizacoes.duracao_semanas,
      fase_atual: periodizacoes.fase_atual,
      gerado_por_ia: periodizacoes.gerado_por_ia,
      criado_em: periodizacoes.criado_em,
      atualizado_em: periodizacoes.atualizado_em,
    })
    .from(periodizacoes)
    .where(and(...conditions))
    .orderBy(desc(periodizacoes.criado_em))

  return c.json({ data })
})

// ═══════════════════════════════════════════════════════════════
// GET /periodizacao/:id — Detalhe
// ═══════════════════════════════════════════════════════════════
periodizacaoRouter.get('/:id', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const data = await db
    .select()
    .from(periodizacoes)
    .where(
      and(eq(periodizacoes.id, id), eq(periodizacoes.tenant_id, tenantId), isNull(periodizacoes.deletado_em)),
    )
    .get()

  if (!data) {
    return c.json({ error: 'Periodização não encontrada.', code: 404 }, 404)
  }

  return c.json({
    ...data,
    config: JSON.parse(data.config_json),
  })
})

// ═══════════════════════════════════════════════════════════════
// PUT /periodizacao/:id — Atualizar
// ═══════════════════════════════════════════════════════════════
periodizacaoRouter.put('/:id', zValidator('json', updatePeriodizacaoSchema), async (c) => {
  const { id } = c.req.param()
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const existing = await db
    .select({ id: periodizacoes.id })
    .from(periodizacoes)
    .where(
      and(eq(periodizacoes.id, id), eq(periodizacoes.tenant_id, tenantId), isNull(periodizacoes.deletado_em)),
    )
    .get()

  if (!existing) {
    return c.json({ error: 'Periodização não encontrada.', code: 404 }, 404)
  }

  await db
    .update(periodizacoes)
    .set({
      ...body,
      atualizado_em: now(),
    })
    .where(eq(periodizacoes.id, id))

  const updated = await db.select().from(periodizacoes).where(eq(periodizacoes.id, id)).get()

  return c.json({
    ...updated,
    config: updated ? JSON.parse(updated.config_json) : {},
  })
})

// ═══════════════════════════════════════════════════════════════
// DELETE /periodizacao/:id — Soft delete
// ═══════════════════════════════════════════════════════════════
periodizacaoRouter.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const existing = await db
    .select({ id: periodizacoes.id })
    .from(periodizacoes)
    .where(
      and(eq(periodizacoes.id, id), eq(periodizacoes.tenant_id, tenantId), isNull(periodizacoes.deletado_em)),
    )
    .get()

  if (!existing) {
    return c.json({ error: 'Periodização não encontrada.', code: 404 }, 404)
  }

  await db
    .update(periodizacoes)
    .set({ deletado_em: now() })
    .where(eq(periodizacoes.id, id))

  return c.json({ message: 'Periodização removida.' })
})

// ═══════════════════════════════════════════════════════════════
// POST /periodizacao/:id/gerar-ia — Gerar via LLM
// ═══════════════════════════════════════════════════════════════
periodizacaoRouter.post('/:id/gerar-ia', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const periodizacao = await db
    .select()
    .from(periodizacoes)
    .where(
      and(eq(periodizacoes.id, id), eq(periodizacoes.tenant_id, tenantId), isNull(periodizacoes.deletado_em)),
    )
    .get()

  if (!periodizacao) {
    return c.json({ error: 'Periodização não encontrada.', code: 404 }, 404)
  }

  // Criar LLM job
  const jobId = generateId()
  await db.insert(llmJobs).values({
    id: jobId,
    tenant_id: tenantId,
    tipo: 'treino',
    input_json: JSON.stringify({
      periodizacao_id: id,
      aluno_id: periodizacao.aluno_id,
      tipo: periodizacao.tipo,
      duracao_semanas: periodizacao.duracao_semanas,
      config_atual: JSON.parse(periodizacao.config_json),
    }),
    status: 'pending',
    criado_em: now(),
  })

  // Marcar periodização como gerada por IA
  await db
    .update(periodizacoes)
    .set({ gerado_por_ia: true, atualizado_em: now() })
    .where(eq(periodizacoes.id, id))

  return c.json({
    message: 'Job de geração IA criado.',
    llm_job_id: jobId,
  })
})

export { periodizacaoRouter }
