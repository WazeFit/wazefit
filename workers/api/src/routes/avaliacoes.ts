/**
 * Rotas de avaliações (anamnese, física, bioimpedância).
 *
 * POST   /api/v1/avaliacoes      — Criar avaliação
 * GET    /api/v1/avaliacoes      — Listar (filtro: aluno_id, tipo)
 * GET    /api/v1/avaliacoes/:id  — Detalhe
 * PUT    /api/v1/avaliacoes/:id  — Atualizar
 * DELETE /api/v1/avaliacoes/:id  — Soft delete
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc, isNull, sql } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { avaliacoes, alunos } from '../db/schema'
import { generateId, now } from '../lib/id'
import { authMiddleware, expertOnly } from '../middleware/auth'

const avaliacoesRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()
avaliacoesRouter.use('*', authMiddleware)

const createAvaliacaoSchema = z.object({
  aluno_id: z.string().uuid('ID do aluno inválido.'),
  tipo: z.enum(['anamnese', 'fisica', 'bioimpedancia'], { required_error: 'Tipo é obrigatório.' }),
  data: z.string().min(1, 'Data é obrigatória.'),
  dados_json: z.record(z.unknown()).default({}),
  observacoes: z.string().optional(),
})

const updateAvaliacaoSchema = z.object({
  tipo: z.enum(['anamnese', 'fisica', 'bioimpedancia']).optional(),
  data: z.string().min(1).optional(),
  dados_json: z.record(z.unknown()).optional(),
  observacoes: z.string().optional(),
})

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  aluno_id: z.string().uuid().optional(),
  tipo: z.enum(['anamnese', 'fisica', 'bioimpedancia']).optional(),
})

// POST /avaliacoes
avaliacoesRouter.post('/', expertOnly, zValidator('json', createAvaliacaoSchema), async (c) => {
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const expertId = c.get('user_id')
  const db = createDB(c.env.DB)

  const aluno = await db.select({ id: alunos.id }).from(alunos)
    .where(and(eq(alunos.id, body.aluno_id), eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em))).get()
  if (!aluno) return c.json({ error: 'Aluno não encontrado.', code: 404 }, 404)

  const id = generateId()
  const timestamp = now()
  await db.insert(avaliacoes).values({
    id, tenant_id: tenantId, aluno_id: body.aluno_id, expert_id: expertId,
    tipo: body.tipo, data: body.data, dados_json: JSON.stringify(body.dados_json),
    observacoes: body.observacoes ?? null, criado_em: timestamp, atualizado_em: timestamp,
  })

  return c.json({ id, aluno_id: body.aluno_id, tipo: body.tipo, data: body.data, criado_em: timestamp }, 201)
})

// GET /avaliacoes
avaliacoesRouter.get('/', zValidator('query', listQuery), async (c) => {
  const { page, limit, aluno_id, tipo } = c.req.valid('query')
  const tenantId = c.get('tenant_id')
  const role = c.get('role')
  const userId = c.get('user_id')
  const db = createDB(c.env.DB)
  const offset = (page - 1) * limit

  const conditions = [eq(avaliacoes.tenant_id, tenantId), isNull(avaliacoes.deletado_em)]
  // Aluno só vê suas próprias avaliações
  if (role === 'aluno') {
    conditions.push(eq(avaliacoes.aluno_id, userId))
  } else if (aluno_id) {
    conditions.push(eq(avaliacoes.aluno_id, aluno_id))
  }
  if (tipo) conditions.push(eq(avaliacoes.tipo, tipo))
  const where = and(...conditions)

  const countResult = await db.select({ count: sql<number>`COUNT(*)` }).from(avaliacoes).where(where).get()
  const total = countResult?.count ?? 0

  const data = await db.select({
    id: avaliacoes.id, aluno_id: avaliacoes.aluno_id, expert_id: avaliacoes.expert_id,
    tipo: avaliacoes.tipo, data: avaliacoes.data, observacoes: avaliacoes.observacoes,
    criado_em: avaliacoes.criado_em, atualizado_em: avaliacoes.atualizado_em,
  }).from(avaliacoes).where(where).orderBy(desc(avaliacoes.criado_em)).limit(limit).offset(offset)

  return c.json({ data, meta: { page, limit, total, total_pages: Math.ceil(total / limit) } })
})

// GET /avaliacoes/:id
avaliacoesRouter.get('/:id', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const avaliacao = await db.select().from(avaliacoes)
    .where(and(eq(avaliacoes.id, id), eq(avaliacoes.tenant_id, tenantId), isNull(avaliacoes.deletado_em))).get()
  if (!avaliacao) return c.json({ error: 'Avaliação não encontrada.', code: 404 }, 404)

  return c.json({
    ...avaliacao,
    dados_json: JSON.parse(avaliacao.dados_json),
  })
})

// PUT /avaliacoes/:id
avaliacoesRouter.put('/:id', expertOnly, zValidator('json', updateAvaliacaoSchema), async (c) => {
  const { id } = c.req.param()
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const existing = await db.select({ id: avaliacoes.id }).from(avaliacoes)
    .where(and(eq(avaliacoes.id, id), eq(avaliacoes.tenant_id, tenantId), isNull(avaliacoes.deletado_em))).get()
  if (!existing) return c.json({ error: 'Avaliação não encontrada.', code: 404 }, 404)

  const updateData: Record<string, unknown> = { atualizado_em: now() }
  if (body.tipo !== undefined) updateData['tipo'] = body.tipo
  if (body.data !== undefined) updateData['data'] = body.data
  if (body.dados_json !== undefined) updateData['dados_json'] = JSON.stringify(body.dados_json)
  if (body.observacoes !== undefined) updateData['observacoes'] = body.observacoes

  await db.update(avaliacoes).set(updateData).where(eq(avaliacoes.id, id))
  const updated = await db.select().from(avaliacoes).where(eq(avaliacoes.id, id)).get()
  if (!updated) return c.json({ error: 'Erro ao atualizar.', code: 500 }, 500)

  return c.json({ ...updated, dados_json: JSON.parse(updated.dados_json) })
})

// DELETE /avaliacoes/:id
avaliacoesRouter.delete('/:id', expertOnly, async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const existing = await db.select({ id: avaliacoes.id }).from(avaliacoes)
    .where(and(eq(avaliacoes.id, id), eq(avaliacoes.tenant_id, tenantId), isNull(avaliacoes.deletado_em))).get()
  if (!existing) return c.json({ error: 'Avaliação não encontrada.', code: 404 }, 404)

  await db.update(avaliacoes).set({ deletado_em: now() }).where(eq(avaliacoes.id, id))
  return c.json({ message: 'Avaliação removida.' })
})

export { avaliacoesRouter }
