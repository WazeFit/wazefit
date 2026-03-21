/**
 * Rotas do módulo de nutrição.
 * CRUD completo de planos nutricionais, refeições e alimentos.
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc, isNull, sql } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { planosNutricionais, refeicoes, alimentosRefeicao, alunos } from '../db/schema'
import { generateId, now } from '../lib/id'
import { authMiddleware, expertOnly } from '../middleware/auth'

const nutricaoRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()
nutricaoRouter.use('*', authMiddleware)

const createPlanoSchema = z.object({
  aluno_id: z.string().uuid('ID do aluno inválido.'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  objetivo: z.string().optional(),
  calorias_diarias: z.number().int().min(0).optional(),
  proteina_g: z.number().min(0).optional(),
  carboidrato_g: z.number().min(0).optional(),
  gordura_g: z.number().min(0).optional(),
  observacoes: z.string().optional(),
})

const updatePlanoSchema = z.object({
  nome: z.string().min(2).optional(),
  objetivo: z.string().optional(),
  calorias_diarias: z.number().int().min(0).optional(),
  proteina_g: z.number().min(0).optional(),
  carboidrato_g: z.number().min(0).optional(),
  gordura_g: z.number().min(0).optional(),
  observacoes: z.string().optional(),
  ativo: z.boolean().optional(),
})

const listPlanosQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  aluno_id: z.string().uuid().optional(),
})

const createRefeicaoSchema = z.object({
  nome: z.string().min(1, 'Nome da refeição é obrigatório.'),
  horario: z.string().optional(),
  ordem: z.number().int().min(0).optional(),
})

const updateRefeicaoSchema = z.object({
  nome: z.string().min(1).optional(),
  horario: z.string().optional(),
  ordem: z.number().int().min(0).optional(),
})

const createAlimentoSchema = z.object({
  nome: z.string().min(1, 'Nome do alimento é obrigatório.'),
  quantidade: z.number().min(0),
  unidade: z.string().min(1),
  calorias: z.number().min(0).optional(),
  proteina_g: z.number().min(0).optional(),
  carboidrato_g: z.number().min(0).optional(),
  gordura_g: z.number().min(0).optional(),
  observacao: z.string().optional(),
})

const updateAlimentoSchema = z.object({
  nome: z.string().min(1).optional(),
  quantidade: z.number().min(0).optional(),
  unidade: z.string().min(1).optional(),
  calorias: z.number().min(0).optional(),
  proteina_g: z.number().min(0).optional(),
  carboidrato_g: z.number().min(0).optional(),
  gordura_g: z.number().min(0).optional(),
  observacao: z.string().optional(),
})

// POST /nutricao/planos
nutricaoRouter.post('/planos', expertOnly, zValidator('json', createPlanoSchema), async (c) => {
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const expertId = c.get('user_id')
  const db = createDB(c.env.DB)

  const aluno = await db.select({ id: alunos.id }).from(alunos)
    .where(and(eq(alunos.id, body.aluno_id), eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em))).get()
  if (!aluno) return c.json({ error: 'Aluno não encontrado.', code: 404 }, 404)

  const id = generateId()
  const timestamp = now()
  await db.insert(planosNutricionais).values({
    id, tenant_id: tenantId, aluno_id: body.aluno_id, expert_id: expertId,
    nome: body.nome, objetivo: body.objetivo ?? null, calorias_diarias: body.calorias_diarias ?? null,
    proteina_g: body.proteina_g ?? null, carboidrato_g: body.carboidrato_g ?? null,
    gordura_g: body.gordura_g ?? null, observacoes: body.observacoes ?? null,
    ativo: true, criado_em: timestamp, atualizado_em: timestamp,
  })
  return c.json({ id, nome: body.nome, aluno_id: body.aluno_id, ativo: true, criado_em: timestamp }, 201)
})

// GET /nutricao/planos
nutricaoRouter.get('/planos', zValidator('query', listPlanosQuery), async (c) => {
  const { page, limit, aluno_id } = c.req.valid('query')
  const tenantId = c.get('tenant_id')
  const role = c.get('role')
  const userId = c.get('user_id')
  const db = createDB(c.env.DB)
  const offset = (page - 1) * limit
  const conditions = [eq(planosNutricionais.tenant_id, tenantId), isNull(planosNutricionais.deletado_em)]
  // Aluno só vê seus próprios planos
  if (role === 'aluno') {
    conditions.push(eq(planosNutricionais.aluno_id, userId))
  } else if (aluno_id) {
    conditions.push(eq(planosNutricionais.aluno_id, aluno_id))
  }
  const where = and(...conditions)

  const countResult = await db.select({ count: sql<number>`COUNT(*)` }).from(planosNutricionais).where(where).get()
  const total = countResult?.count ?? 0
  const data = await db.select({
    id: planosNutricionais.id, aluno_id: planosNutricionais.aluno_id,
    expert_id: planosNutricionais.expert_id, nome: planosNutricionais.nome,
    objetivo: planosNutricionais.objetivo, calorias_diarias: planosNutricionais.calorias_diarias,
    ativo: planosNutricionais.ativo, criado_em: planosNutricionais.criado_em,
    atualizado_em: planosNutricionais.atualizado_em,
  }).from(planosNutricionais).where(where).orderBy(desc(planosNutricionais.criado_em)).limit(limit).offset(offset)
  return c.json({ data, meta: { page, limit, total, total_pages: Math.ceil(total / limit) } })
})

// GET /nutricao/planos/:id
nutricaoRouter.get('/planos/:id', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const plano = await db.select().from(planosNutricionais)
    .where(and(eq(planosNutricionais.id, id), eq(planosNutricionais.tenant_id, tenantId), isNull(planosNutricionais.deletado_em))).get()
  if (!plano) return c.json({ error: 'Plano nutricional não encontrado.', code: 404 }, 404)

  const refeicoesList = await db.select().from(refeicoes)
    .where(and(eq(refeicoes.plano_id, id), eq(refeicoes.tenant_id, tenantId))).orderBy(refeicoes.ordem)

  const refeicaoIds = refeicoesList.map((r) => r.id)
  let alimentosList: (typeof alimentosRefeicao.$inferSelect)[] = []
  if (refeicaoIds.length > 0) {
    alimentosList = await db.select().from(alimentosRefeicao).where(eq(alimentosRefeicao.tenant_id, tenantId))
  }

  const refeicoesFull = refeicoesList.map((ref) => ({
    ...ref, alimentos: alimentosList.filter((a) => a.refeicao_id === ref.id),
  }))
  return c.json({ ...plano, refeicoes: refeicoesFull })
})

// PUT /nutricao/planos/:id
nutricaoRouter.put('/planos/:id', expertOnly, zValidator('json', updatePlanoSchema), async (c) => {
  const { id } = c.req.param()
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const existing = await db.select({ id: planosNutricionais.id }).from(planosNutricionais)
    .where(and(eq(planosNutricionais.id, id), eq(planosNutricionais.tenant_id, tenantId), isNull(planosNutricionais.deletado_em))).get()
  if (!existing) return c.json({ error: 'Plano nutricional não encontrado.', code: 404 }, 404)
  await db.update(planosNutricionais).set({ ...body, atualizado_em: now() }).where(eq(planosNutricionais.id, id))
  const updated = await db.select().from(planosNutricionais).where(eq(planosNutricionais.id, id)).get()
  return c.json(updated)
})

// DELETE /nutricao/planos/:id
nutricaoRouter.delete('/planos/:id', expertOnly, async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const existing = await db.select({ id: planosNutricionais.id }).from(planosNutricionais)
    .where(and(eq(planosNutricionais.id, id), eq(planosNutricionais.tenant_id, tenantId), isNull(planosNutricionais.deletado_em))).get()
  if (!existing) return c.json({ error: 'Plano nutricional não encontrado.', code: 404 }, 404)
  await db.update(planosNutricionais).set({ deletado_em: now(), ativo: false }).where(eq(planosNutricionais.id, id))
  return c.json({ message: 'Plano nutricional removido.' })
})

// POST /nutricao/planos/:id/refeicoes
nutricaoRouter.post('/planos/:id/refeicoes', expertOnly, zValidator('json', createRefeicaoSchema), async (c) => {
  const { id: planoId } = c.req.param()
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const plano = await db.select({ id: planosNutricionais.id }).from(planosNutricionais)
    .where(and(eq(planosNutricionais.id, planoId), eq(planosNutricionais.tenant_id, tenantId), isNull(planosNutricionais.deletado_em))).get()
  if (!plano) return c.json({ error: 'Plano nutricional não encontrado.', code: 404 }, 404)

  const id = generateId()
  const timestamp = now()
  await db.insert(refeicoes).values({
    id, plano_id: planoId, tenant_id: tenantId,
    nome: body.nome, horario: body.horario ?? null, ordem: body.ordem ?? 0, criado_em: timestamp,
  })
  return c.json({ id, plano_id: planoId, nome: body.nome, ordem: body.ordem ?? 0, criado_em: timestamp }, 201)
})

// PUT /nutricao/refeicoes/:id
nutricaoRouter.put('/refeicoes/:id', expertOnly, zValidator('json', updateRefeicaoSchema), async (c) => {
  const { id } = c.req.param()
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const existing = await db.select({ id: refeicoes.id }).from(refeicoes)
    .where(and(eq(refeicoes.id, id), eq(refeicoes.tenant_id, tenantId))).get()
  if (!existing) return c.json({ error: 'Refeição não encontrada.', code: 404 }, 404)

  const updateData: Record<string, unknown> = {}
  if (body.nome !== undefined) updateData['nome'] = body.nome
  if (body.horario !== undefined) updateData['horario'] = body.horario
  if (body.ordem !== undefined) updateData['ordem'] = body.ordem
  await db.update(refeicoes).set(updateData).where(eq(refeicoes.id, id))
  const updated = await db.select().from(refeicoes).where(eq(refeicoes.id, id)).get()
  return c.json(updated)
})

// DELETE /nutricao/refeicoes/:id
nutricaoRouter.delete('/refeicoes/:id', expertOnly, async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const existing = await db.select({ id: refeicoes.id }).from(refeicoes)
    .where(and(eq(refeicoes.id, id), eq(refeicoes.tenant_id, tenantId))).get()
  if (!existing) return c.json({ error: 'Refeição não encontrada.', code: 404 }, 404)
  await db.delete(refeicoes).where(eq(refeicoes.id, id))
  return c.json({ message: 'Refeição removida.' })
})

// POST /nutricao/refeicoes/:id/alimentos
nutricaoRouter.post('/refeicoes/:id/alimentos', expertOnly, zValidator('json', createAlimentoSchema), async (c) => {
  const { id: refeicaoId } = c.req.param()
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const ref = await db.select({ id: refeicoes.id }).from(refeicoes)
    .where(and(eq(refeicoes.id, refeicaoId), eq(refeicoes.tenant_id, tenantId))).get()
  if (!ref) return c.json({ error: 'Refeição não encontrada.', code: 404 }, 404)

  const id = generateId()
  await db.insert(alimentosRefeicao).values({
    id, refeicao_id: refeicaoId, tenant_id: tenantId,
    nome: body.nome, quantidade: body.quantidade, unidade: body.unidade,
    calorias: body.calorias ?? null, proteina_g: body.proteina_g ?? null,
    carboidrato_g: body.carboidrato_g ?? null, gordura_g: body.gordura_g ?? null,
    observacao: body.observacao ?? null,
  })
  return c.json({ id, refeicao_id: refeicaoId, nome: body.nome, quantidade: body.quantidade, unidade: body.unidade }, 201)
})

// PUT /nutricao/alimentos/:id
nutricaoRouter.put('/alimentos/:id', expertOnly, zValidator('json', updateAlimentoSchema), async (c) => {
  const { id } = c.req.param()
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const existing = await db.select({ id: alimentosRefeicao.id }).from(alimentosRefeicao)
    .where(and(eq(alimentosRefeicao.id, id), eq(alimentosRefeicao.tenant_id, tenantId))).get()
  if (!existing) return c.json({ error: 'Alimento não encontrado.', code: 404 }, 404)

  const updateData: Record<string, unknown> = {}
  if (body.nome !== undefined) updateData['nome'] = body.nome
  if (body.quantidade !== undefined) updateData['quantidade'] = body.quantidade
  if (body.unidade !== undefined) updateData['unidade'] = body.unidade
  if (body.calorias !== undefined) updateData['calorias'] = body.calorias
  if (body.proteina_g !== undefined) updateData['proteina_g'] = body.proteina_g
  if (body.carboidrato_g !== undefined) updateData['carboidrato_g'] = body.carboidrato_g
  if (body.gordura_g !== undefined) updateData['gordura_g'] = body.gordura_g
  if (body.observacao !== undefined) updateData['observacao'] = body.observacao

  await db.update(alimentosRefeicao).set(updateData).where(eq(alimentosRefeicao.id, id))
  const updated = await db.select().from(alimentosRefeicao).where(eq(alimentosRefeicao.id, id)).get()
  return c.json(updated)
})

// DELETE /nutricao/alimentos/:id
nutricaoRouter.delete('/alimentos/:id', expertOnly, async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const existing = await db.select({ id: alimentosRefeicao.id }).from(alimentosRefeicao)
    .where(and(eq(alimentosRefeicao.id, id), eq(alimentosRefeicao.tenant_id, tenantId))).get()
  if (!existing) return c.json({ error: 'Alimento não encontrado.', code: 404 }, 404)
  await db.delete(alimentosRefeicao).where(eq(alimentosRefeicao.id, id))
  return c.json({ message: 'Alimento removido.' })
})

export { nutricaoRouter }