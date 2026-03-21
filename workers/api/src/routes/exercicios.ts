/**
 * Rotas de gestão de exercícios.
 * CRUD completo com isolamento multi-tenant, busca por nome/grupo e paginação.
 *
 * POST   /api/v1/exercicios          — Criar exercício
 * GET    /api/v1/exercicios          — Listar (busca, filtro grupo_muscular, paginação)
 * GET    /api/v1/exercicios/:id      — Detalhe
 * PUT    /api/v1/exercicios/:id      — Atualizar
 * DELETE /api/v1/exercicios/:id      — Soft delete
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, like, desc, isNull, sql } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { exercicios } from '../db/schema'
import { generateId, now } from '../lib/id'
import { authMiddleware, expertOnly } from '../middleware/auth'

const exerciciosRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

exerciciosRouter.use('*', authMiddleware, expertOnly)

// ── Schemas de validação ──

const createExercicioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  grupo_muscular: z.string().min(1, 'Grupo muscular é obrigatório.'),
  equipamento: z.string().optional(),
  instrucoes: z.string().optional(),
  video_url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  dificuldade: z.enum(['iniciante', 'intermediario', 'avancado']).optional(),
})

const updateExercicioSchema = z.object({
  nome: z.string().min(2).optional(),
  grupo_muscular: z.string().min(1).optional(),
  equipamento: z.string().optional(),
  instrucoes: z.string().optional(),
  video_url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  dificuldade: z.enum(['iniciante', 'intermediario', 'avancado']).optional(),
})

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  busca: z.string().optional(),
  grupo_muscular: z.string().optional(),
})

// ═══════════════════════════════════════════════════════════════
// POST /exercicios — Criar exercício
// ═══════════════════════════════════════════════════════════════
exerciciosRouter.post('/', zValidator('json', createExercicioSchema), async (c) => {
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const id = generateId()
  const timestamp = now()

  await db.insert(exercicios).values({
    id,
    tenant_id: tenantId,
    nome: body.nome,
    grupo_muscular: body.grupo_muscular,
    equipamento: body.equipamento ?? null,
    instrucoes: body.instrucoes ?? null,
    video_url: body.video_url ?? null,
    thumbnail_url: body.thumbnail_url ?? null,
    dificuldade: body.dificuldade ?? 'intermediario',
    criado_em: timestamp,
    atualizado_em: timestamp,
  })

  return c.json(
    {
      id,
      nome: body.nome,
      grupo_muscular: body.grupo_muscular,
      equipamento: body.equipamento ?? null,
      dificuldade: body.dificuldade ?? 'intermediario',
      criado_em: timestamp,
    },
    201,
  )
})

// ═══════════════════════════════════════════════════════════════
// GET /exercicios — Listar com busca, filtro e paginação
// ═══════════════════════════════════════════════════════════════
exerciciosRouter.get('/', zValidator('query', listQuerySchema), async (c) => {
  const { page, limit, busca, grupo_muscular } = c.req.valid('query')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const offset = (page - 1) * limit

  const conditions = [eq(exercicios.tenant_id, tenantId), isNull(exercicios.deletado_em)]

  if (grupo_muscular) {
    conditions.push(eq(exercicios.grupo_muscular, grupo_muscular))
  }

  const where = and(...conditions)
  const whereWithSearch = busca ? and(where, like(exercicios.nome, `%${busca}%`)) : where

  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(exercicios)
    .where(whereWithSearch)
    .get()

  const total = countResult?.count ?? 0

  const data = await db
    .select({
      id: exercicios.id,
      nome: exercicios.nome,
      grupo_muscular: exercicios.grupo_muscular,
      equipamento: exercicios.equipamento,
      instrucoes: exercicios.instrucoes,
      video_url: exercicios.video_url,
      thumbnail_url: exercicios.thumbnail_url,
      dificuldade: exercicios.dificuldade,
      criado_em: exercicios.criado_em,
    })
    .from(exercicios)
    .where(whereWithSearch)
    .orderBy(desc(exercicios.criado_em))
    .limit(limit)
    .offset(offset)

  return c.json({
    data,
    meta: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  })
})

// ═══════════════════════════════════════════════════════════════
// GET /exercicios/:id — Detalhe
// ═══════════════════════════════════════════════════════════════
exerciciosRouter.get('/:id', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const exercicio = await db
    .select({
      id: exercicios.id,
      nome: exercicios.nome,
      grupo_muscular: exercicios.grupo_muscular,
      equipamento: exercicios.equipamento,
      instrucoes: exercicios.instrucoes,
      video_url: exercicios.video_url,
      thumbnail_url: exercicios.thumbnail_url,
      dificuldade: exercicios.dificuldade,
      criado_em: exercicios.criado_em,
      atualizado_em: exercicios.atualizado_em,
    })
    .from(exercicios)
    .where(
      and(eq(exercicios.id, id), eq(exercicios.tenant_id, tenantId), isNull(exercicios.deletado_em)),
    )
    .get()

  if (!exercicio) {
    return c.json({ error: 'Exercício não encontrado.', code: 404 }, 404)
  }

  return c.json(exercicio)
})

// ═══════════════════════════════════════════════════════════════
// PUT /exercicios/:id — Atualizar
// ═══════════════════════════════════════════════════════════════
exerciciosRouter.put('/:id', zValidator('json', updateExercicioSchema), async (c) => {
  const { id } = c.req.param()
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const existing = await db
    .select({ id: exercicios.id })
    .from(exercicios)
    .where(
      and(eq(exercicios.id, id), eq(exercicios.tenant_id, tenantId), isNull(exercicios.deletado_em)),
    )
    .get()

  if (!existing) {
    return c.json({ error: 'Exercício não encontrado.', code: 404 }, 404)
  }

  await db
    .update(exercicios)
    .set({
      ...body,
      atualizado_em: now(),
    })
    .where(eq(exercicios.id, id))

  const updated = await db
    .select({
      id: exercicios.id,
      nome: exercicios.nome,
      grupo_muscular: exercicios.grupo_muscular,
      equipamento: exercicios.equipamento,
      instrucoes: exercicios.instrucoes,
      video_url: exercicios.video_url,
      thumbnail_url: exercicios.thumbnail_url,
      dificuldade: exercicios.dificuldade,
      atualizado_em: exercicios.atualizado_em,
    })
    .from(exercicios)
    .where(eq(exercicios.id, id))
    .get()

  return c.json(updated)
})

// ═══════════════════════════════════════════════════════════════
// DELETE /exercicios/:id — Soft delete
// ═══════════════════════════════════════════════════════════════
exerciciosRouter.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const existing = await db
    .select({ id: exercicios.id })
    .from(exercicios)
    .where(
      and(eq(exercicios.id, id), eq(exercicios.tenant_id, tenantId), isNull(exercicios.deletado_em)),
    )
    .get()

  if (!existing) {
    return c.json({ error: 'Exercício não encontrado.', code: 404 }, 404)
  }

  await db
    .update(exercicios)
    .set({ deletado_em: now() })
    .where(eq(exercicios.id, id))

  return c.json({ message: 'Exercício removido.' })
})

export { exerciciosRouter }
