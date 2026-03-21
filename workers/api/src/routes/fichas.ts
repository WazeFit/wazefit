/**
 * Rotas de gestão de fichas de treino.
 * CRUD + atribuição a aluno + biblioteca de templates.
 *
 * POST   /api/v1/fichas              — Criar ficha
 * GET    /api/v1/fichas              — Listar (filtro: aluno_id, is_template, tipo)
 * GET    /api/v1/fichas/:id          — Detalhe
 * PUT    /api/v1/fichas/:id          — Atualizar
 * DELETE /api/v1/fichas/:id          — Soft delete
 * POST   /api/v1/fichas/:id/atribuir — Atribuir ficha a aluno (clona se template)
 * GET    /api/v1/biblioteca          — Listar templates do expert
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc, isNull, sql } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { fichas, alunos } from '../db/schema'
import { generateId, now } from '../lib/id'
import { authMiddleware, expertOnly } from '../middleware/auth'

const fichasRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

fichasRouter.use('*', authMiddleware, expertOnly)

// ── Schemas de validação ──

const createFichaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  tipo: z.enum(['A', 'B', 'C', 'D', 'E']).default('A'),
  objetivo: z.string().optional(),
  exercicios_json: z.string().default('[]'),
  aluno_id: z.string().uuid().optional(),
  is_template: z.boolean().default(false),
  validade: z.string().optional(),
})

const updateFichaSchema = z.object({
  nome: z.string().min(2).optional(),
  tipo: z.enum(['A', 'B', 'C', 'D', 'E']).optional(),
  objetivo: z.string().optional(),
  exercicios_json: z.string().optional(),
  ativa: z.boolean().optional(),
  validade: z.string().optional(),
})

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  aluno_id: z.string().optional(),
  is_template: z.coerce.boolean().optional(),
  tipo: z.enum(['A', 'B', 'C', 'D', 'E']).optional(),
})

const atribuirSchema = z.object({
  aluno_id: z.string().uuid('ID do aluno inválido.'),
})

// ═══════════════════════════════════════════════════════════════
// POST /fichas — Criar ficha
// ═══════════════════════════════════════════════════════════════
fichasRouter.post('/', zValidator('json', createFichaSchema), async (c) => {
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const expertId = c.get('user_id')
  const db = createDB(c.env.DB)

  // Se aluno_id fornecido, verificar se pertence ao tenant
  if (body.aluno_id) {
    const aluno = await db
      .select({ id: alunos.id })
      .from(alunos)
      .where(
        and(eq(alunos.id, body.aluno_id), eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em)),
      )
      .get()

    if (!aluno) {
      return c.json({ error: 'Aluno não encontrado.', code: 404 }, 404)
    }
  }

  const id = generateId()
  const timestamp = now()

  await db.insert(fichas).values({
    id,
    tenant_id: tenantId,
    expert_id: expertId,
    aluno_id: body.aluno_id ?? null,
    nome: body.nome,
    tipo: body.tipo,
    objetivo: body.objetivo ?? null,
    exercicios_json: body.exercicios_json,
    is_template: body.is_template,
    ativa: true,
    validade: body.validade ?? null,
    criado_em: timestamp,
    atualizado_em: timestamp,
  })

  return c.json(
    {
      id,
      nome: body.nome,
      tipo: body.tipo,
      aluno_id: body.aluno_id ?? null,
      is_template: body.is_template,
      criado_em: timestamp,
    },
    201,
  )
})

// ═══════════════════════════════════════════════════════════════
// GET /fichas — Listar com filtros e paginação
// ═══════════════════════════════════════════════════════════════
fichasRouter.get('/', zValidator('query', listQuerySchema), async (c) => {
  const { page, limit, aluno_id, is_template, tipo } = c.req.valid('query')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const offset = (page - 1) * limit

  const conditions = [eq(fichas.tenant_id, tenantId), isNull(fichas.deletado_em)]

  if (aluno_id) {
    conditions.push(eq(fichas.aluno_id, aluno_id))
  }
  if (typeof is_template === 'boolean') {
    conditions.push(eq(fichas.is_template, is_template))
  }
  if (tipo) {
    conditions.push(eq(fichas.tipo, tipo))
  }

  const where = and(...conditions)

  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(fichas)
    .where(where)
    .get()

  const total = countResult?.count ?? 0

  const data = await db
    .select({
      id: fichas.id,
      nome: fichas.nome,
      tipo: fichas.tipo,
      objetivo: fichas.objetivo,
      exercicios_json: fichas.exercicios_json,
      aluno_id: fichas.aluno_id,
      expert_id: fichas.expert_id,
      is_template: fichas.is_template,
      ativa: fichas.ativa,
      validade: fichas.validade,
      criado_em: fichas.criado_em,
      atualizado_em: fichas.atualizado_em,
    })
    .from(fichas)
    .where(where)
    .orderBy(desc(fichas.criado_em))
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
// GET /biblioteca — Listar templates do expert (standalone route)
// ═══════════════════════════════════════════════════════════════
const bibliotecaRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()
bibliotecaRouter.use('*', authMiddleware, expertOnly)

bibliotecaRouter.get('/', async (c) => {
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const templates = await db
    .select({
      id: fichas.id,
      nome: fichas.nome,
      tipo: fichas.tipo,
      objetivo: fichas.objetivo,
      exercicios_json: fichas.exercicios_json,
      expert_id: fichas.expert_id,
      criado_em: fichas.criado_em,
    })
    .from(fichas)
    .where(
      and(
        eq(fichas.tenant_id, tenantId),
        eq(fichas.is_template, true),
        isNull(fichas.deletado_em),
      ),
    )
    .orderBy(desc(fichas.criado_em))

  return c.json({ data: templates })
})

// ═══════════════════════════════════════════════════════════════
// GET /fichas/:id — Detalhe
// ═══════════════════════════════════════════════════════════════
fichasRouter.get('/:id', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const ficha = await db
    .select({
      id: fichas.id,
      nome: fichas.nome,
      tipo: fichas.tipo,
      objetivo: fichas.objetivo,
      exercicios_json: fichas.exercicios_json,
      aluno_id: fichas.aluno_id,
      expert_id: fichas.expert_id,
      is_template: fichas.is_template,
      ativa: fichas.ativa,
      validade: fichas.validade,
      criado_em: fichas.criado_em,
      atualizado_em: fichas.atualizado_em,
    })
    .from(fichas)
    .where(
      and(eq(fichas.id, id), eq(fichas.tenant_id, tenantId), isNull(fichas.deletado_em)),
    )
    .get()

  if (!ficha) {
    return c.json({ error: 'Ficha não encontrada.', code: 404 }, 404)
  }

  return c.json(ficha)
})

// ═══════════════════════════════════════════════════════════════
// PUT /fichas/:id — Atualizar
// ═══════════════════════════════════════════════════════════════
fichasRouter.put('/:id', zValidator('json', updateFichaSchema), async (c) => {
  const { id } = c.req.param()
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const existing = await db
    .select({ id: fichas.id })
    .from(fichas)
    .where(
      and(eq(fichas.id, id), eq(fichas.tenant_id, tenantId), isNull(fichas.deletado_em)),
    )
    .get()

  if (!existing) {
    return c.json({ error: 'Ficha não encontrada.', code: 404 }, 404)
  }

  await db
    .update(fichas)
    .set({
      ...body,
      atualizado_em: now(),
    })
    .where(eq(fichas.id, id))

  const updated = await db
    .select({
      id: fichas.id,
      nome: fichas.nome,
      tipo: fichas.tipo,
      objetivo: fichas.objetivo,
      exercicios_json: fichas.exercicios_json,
      aluno_id: fichas.aluno_id,
      is_template: fichas.is_template,
      ativa: fichas.ativa,
      validade: fichas.validade,
      atualizado_em: fichas.atualizado_em,
    })
    .from(fichas)
    .where(eq(fichas.id, id))
    .get()

  return c.json(updated)
})

// ═══════════════════════════════════════════════════════════════
// DELETE /fichas/:id — Soft delete
// ═══════════════════════════════════════════════════════════════
fichasRouter.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const existing = await db
    .select({ id: fichas.id })
    .from(fichas)
    .where(
      and(eq(fichas.id, id), eq(fichas.tenant_id, tenantId), isNull(fichas.deletado_em)),
    )
    .get()

  if (!existing) {
    return c.json({ error: 'Ficha não encontrada.', code: 404 }, 404)
  }

  await db
    .update(fichas)
    .set({ deletado_em: now(), ativa: false })
    .where(eq(fichas.id, id))

  return c.json({ message: 'Ficha removida.' })
})

// ═══════════════════════════════════════════════════════════════
// POST /fichas/:id/atribuir — Atribuir ficha a aluno
// ═══════════════════════════════════════════════════════════════
fichasRouter.post('/:id/atribuir', zValidator('json', atribuirSchema), async (c) => {
  const { id } = c.req.param()
  const { aluno_id } = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const expertId = c.get('user_id')
  const db = createDB(c.env.DB)

  // Verificar ficha existe
  const ficha = await db
    .select()
    .from(fichas)
    .where(
      and(eq(fichas.id, id), eq(fichas.tenant_id, tenantId), isNull(fichas.deletado_em)),
    )
    .get()

  if (!ficha) {
    return c.json({ error: 'Ficha não encontrada.', code: 404 }, 404)
  }

  // Verificar aluno existe no tenant
  const aluno = await db
    .select({ id: alunos.id })
    .from(alunos)
    .where(
      and(eq(alunos.id, aluno_id), eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em)),
    )
    .get()

  if (!aluno) {
    return c.json({ error: 'Aluno não encontrado.', code: 404 }, 404)
  }

  const timestamp = now()

  if (ficha.is_template) {
    // Clonar template como ficha do aluno
    const newId = generateId()
    await db.insert(fichas).values({
      id: newId,
      tenant_id: tenantId,
      expert_id: expertId,
      aluno_id,
      nome: ficha.nome,
      tipo: ficha.tipo,
      objetivo: ficha.objetivo,
      exercicios_json: ficha.exercicios_json,
      is_template: false,
      ativa: true,
      validade: ficha.validade,
      criado_em: timestamp,
      atualizado_em: timestamp,
    })

    return c.json(
      {
        id: newId,
        nome: ficha.nome,
        tipo: ficha.tipo,
        aluno_id,
        is_template: false,
        clonado_de: id,
        criado_em: timestamp,
      },
      201,
    )
  }

  // Ficha não-template: atribuir diretamente ao aluno
  await db
    .update(fichas)
    .set({ aluno_id, atualizado_em: timestamp })
    .where(eq(fichas.id, id))

  return c.json({
    id,
    nome: ficha.nome,
    tipo: ficha.tipo,
    aluno_id,
    is_template: false,
    atualizado_em: timestamp,
  })
})

export { fichasRouter, bibliotecaRouter }