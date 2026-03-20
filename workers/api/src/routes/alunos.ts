/**
 * Rotas de gestão de alunos.
 * CRUD completo com isolamento multi-tenant, busca, paginação e convite.
 *
 * POST   /api/v1/alunos          — Criar aluno
 * GET    /api/v1/alunos          — Listar (busca, filtro grupo, paginação)
 * GET    /api/v1/alunos/:id      — Detalhe
 * PUT    /api/v1/alunos/:id      — Atualizar
 * DELETE /api/v1/alunos/:id      — Soft delete
 * POST   /api/v1/alunos/:id/convite — Reenviar convite por email
 * GET    /api/v1/alunos/ranking  — Top 50 por pontos
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, like, desc, isNull, sql } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { alunos, tenants } from '../db/schema'
import { hashPassword } from '../lib/crypto'
import { generateId, now } from '../lib/id'
import { authMiddleware, expertOnly } from '../middleware/auth'

const alunosRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

// Todas as rotas requerem autenticação + role expert
alunosRouter.use('*', authMiddleware, expertOnly)

// ── Schemas de validação ──

const createAlunoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('Email inválido.'),
  senha: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres.')
    .optional()
    .default('WazeFit@2026'),
  telefone: z.string().optional(),
  data_nasc: z.string().optional(),
  sexo: z.enum(['M', 'F', 'outro']).optional(),
  altura_cm: z.number().int().min(100).max(250).optional(),
  peso_kg: z.number().min(20).max(300).optional(),
  objetivo: z.string().optional(),
  grupo: z.string().optional(),
})

const updateAlunoSchema = z.object({
  nome: z.string().min(2).optional(),
  telefone: z.string().optional(),
  data_nasc: z.string().optional(),
  sexo: z.enum(['M', 'F', 'outro']).optional(),
  altura_cm: z.number().int().min(100).max(250).optional(),
  peso_kg: z.number().min(20).max(300).optional(),
  objetivo: z.string().optional(),
  grupo: z.string().optional(),
  ativo: z.boolean().optional(),
})

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  busca: z.string().optional(),
  grupo: z.string().optional(),
  ativo: z.coerce.boolean().optional(),
})

// ═══════════════════════════════════════════════════════════════
// POST /alunos — Criar aluno
// ═══════════════════════════════════════════════════════════════
alunosRouter.post('/', zValidator('json', createAlunoSchema), async (c) => {
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const expertId = c.get('user_id')
  const db = createDB(c.env.DB)

  // Verificar limite de alunos do plano
  const tenant = await db.select().from(tenants).where(eq(tenants.id, tenantId)).get()
  if (!tenant) {
    return c.json({ error: 'Tenant não encontrado.', code: 404 }, 404)
  }

  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(alunos)
    .where(and(eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em)))
    .get()

  const currentCount = countResult?.count ?? 0
  if (currentCount >= tenant.max_alunos) {
    return c.json(
      {
        error: `Limite de ${tenant.max_alunos} alunos atingido. Faça upgrade do plano.`,
        code: 403,
      },
      403,
    )
  }

  // Verificar email duplicado no tenant
  const existing = await db
    .select({ id: alunos.id })
    .from(alunos)
    .where(
      and(eq(alunos.email, body.email), eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em)),
    )
    .get()

  if (existing) {
    return c.json({ error: 'Email já cadastrado neste tenant.', code: 409 }, 409)
  }

  const id = generateId()
  const senhaHash = await hashPassword(body.senha)
  const timestamp = now()

  await db.insert(alunos).values({
    id,
    tenant_id: tenantId,
    expert_id: expertId,
    nome: body.nome,
    email: body.email,
    senha_hash: senhaHash,
    telefone: body.telefone ?? null,
    data_nasc: body.data_nasc ?? null,
    sexo: body.sexo ?? null,
    altura_cm: body.altura_cm ?? null,
    peso_kg: body.peso_kg ?? null,
    objetivo: body.objetivo ?? null,
    grupo: body.grupo ?? 'geral',
    pontos: 0,
    ativo: true,
    criado_em: timestamp,
    atualizado_em: timestamp,
  })

  // Enviar convite por email (via Queue — implementado na task #17)
  try {
    await c.env.QUEUE_EMAILS.send({
      type: 'convite_aluno',
      to: body.email,
      data: {
        nome_aluno: body.nome,
        nome_tenant: tenant.nome,
        senha_temporaria: body.senha,
      },
    })
  } catch {
    // Queue pode não estar disponível em dev — não bloquear criação
    console.warn('Falha ao enfileirar email de convite')
  }

  return c.json(
    {
      id,
      nome: body.nome,
      email: body.email,
      telefone: body.telefone ?? null,
      grupo: body.grupo ?? 'geral',
      pontos: 0,
      ativo: true,
      criado_em: timestamp,
    },
    201,
  )
})

// ═══════════════════════════════════════════════════════════════
// GET /alunos — Listar com busca, filtro e paginação
// ═══════════════════════════════════════════════════════════════
alunosRouter.get('/', zValidator('query', listQuerySchema), async (c) => {
  const { page, limit, busca, grupo, ativo } = c.req.valid('query')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const offset = (page - 1) * limit

  // Construir condições dinamicamente
  const conditions = [eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em)]

  if (typeof ativo === 'boolean') {
    conditions.push(eq(alunos.ativo, ativo))
  }
  if (grupo) {
    conditions.push(eq(alunos.grupo, grupo))
  }

  const where = and(...conditions)

  // Se busca, filtrar por nome (LIKE)
  const whereWithSearch = busca
    ? and(where, like(alunos.nome, `%${busca}%`))
    : where

  // Count total
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(alunos)
    .where(whereWithSearch)
    .get()

  const total = countResult?.count ?? 0

  // Buscar dados
  const data = await db
    .select({
      id: alunos.id,
      nome: alunos.nome,
      email: alunos.email,
      telefone: alunos.telefone,
      avatar_url: alunos.avatar_url,
      grupo: alunos.grupo,
      pontos: alunos.pontos,
      ativo: alunos.ativo,
      objetivo: alunos.objetivo,
      ultimo_login: alunos.ultimo_login,
      criado_em: alunos.criado_em,
    })
    .from(alunos)
    .where(whereWithSearch)
    .orderBy(desc(alunos.criado_em))
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
// GET /alunos/ranking — Top 50 por pontos
// ═══════════════════════════════════════════════════════════════
alunosRouter.get('/ranking', async (c) => {
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const ranking = await db
    .select({
      id: alunos.id,
      nome: alunos.nome,
      avatar_url: alunos.avatar_url,
      pontos: alunos.pontos,
      grupo: alunos.grupo,
    })
    .from(alunos)
    .where(
      and(eq(alunos.tenant_id, tenantId), eq(alunos.ativo, true), isNull(alunos.deletado_em)),
    )
    .orderBy(desc(alunos.pontos))
    .limit(50)

  return c.json({
    data: ranking.map((a, i) => ({ ...a, posicao: i + 1 })),
  })
})

// ═══════════════════════════════════════════════════════════════
// GET /alunos/:id — Detalhe
// ═══════════════════════════════════════════════════════════════
alunosRouter.get('/:id', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const aluno = await db
    .select({
      id: alunos.id,
      nome: alunos.nome,
      email: alunos.email,
      telefone: alunos.telefone,
      avatar_url: alunos.avatar_url,
      data_nasc: alunos.data_nasc,
      sexo: alunos.sexo,
      altura_cm: alunos.altura_cm,
      peso_kg: alunos.peso_kg,
      objetivo: alunos.objetivo,
      grupo: alunos.grupo,
      pontos: alunos.pontos,
      ativo: alunos.ativo,
      ultimo_login: alunos.ultimo_login,
      criado_em: alunos.criado_em,
      atualizado_em: alunos.atualizado_em,
    })
    .from(alunos)
    .where(
      and(eq(alunos.id, id), eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em)),
    )
    .get()

  if (!aluno) {
    return c.json({ error: 'Aluno não encontrado.', code: 404 }, 404)
  }

  return c.json(aluno)
})

// ═══════════════════════════════════════════════════════════════
// PUT /alunos/:id — Atualizar
// ═══════════════════════════════════════════════════════════════
alunosRouter.put('/:id', zValidator('json', updateAlunoSchema), async (c) => {
  const { id } = c.req.param()
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  // Verificar existência
  const existing = await db
    .select({ id: alunos.id })
    .from(alunos)
    .where(
      and(eq(alunos.id, id), eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em)),
    )
    .get()

  if (!existing) {
    return c.json({ error: 'Aluno não encontrado.', code: 404 }, 404)
  }

  await db
    .update(alunos)
    .set({
      ...body,
      atualizado_em: now(),
    })
    .where(eq(alunos.id, id))

  // Retornar atualizado
  const updated = await db
    .select({
      id: alunos.id,
      nome: alunos.nome,
      email: alunos.email,
      telefone: alunos.telefone,
      grupo: alunos.grupo,
      pontos: alunos.pontos,
      ativo: alunos.ativo,
      atualizado_em: alunos.atualizado_em,
    })
    .from(alunos)
    .where(eq(alunos.id, id))
    .get()

  return c.json(updated)
})

// ═══════════════════════════════════════════════════════════════
// DELETE /alunos/:id — Soft delete
// ═══════════════════════════════════════════════════════════════
alunosRouter.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const existing = await db
    .select({ id: alunos.id })
    .from(alunos)
    .where(
      and(eq(alunos.id, id), eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em)),
    )
    .get()

  if (!existing) {
    return c.json({ error: 'Aluno não encontrado.', code: 404 }, 404)
  }

  await db
    .update(alunos)
    .set({ deletado_em: now(), ativo: false })
    .where(eq(alunos.id, id))

  return c.json({ message: 'Aluno removido.' })
})

// ═══════════════════════════════════════════════════════════════
// POST /alunos/:id/convite — Reenviar convite por email
// ═══════════════════════════════════════════════════════════════
alunosRouter.post('/:id/convite', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const aluno = await db
    .select({ id: alunos.id, nome: alunos.nome, email: alunos.email })
    .from(alunos)
    .where(
      and(eq(alunos.id, id), eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em)),
    )
    .get()

  if (!aluno) {
    return c.json({ error: 'Aluno não encontrado.', code: 404 }, 404)
  }

  const tenant = await db.select().from(tenants).where(eq(tenants.id, tenantId)).get()

  // Gerar senha temporária
  const tempPassword = `WF${Date.now().toString(36).slice(-6)}!`
  const senhaHash = await hashPassword(tempPassword)

  await db.update(alunos).set({ senha_hash: senhaHash, atualizado_em: now() }).where(eq(alunos.id, id))

  try {
    await c.env.QUEUE_EMAILS.send({
      type: 'convite_aluno',
      to: aluno.email,
      data: {
        nome_aluno: aluno.nome,
        nome_tenant: tenant?.nome ?? 'WazeFit',
        senha_temporaria: tempPassword,
      },
    })
  } catch {
    console.warn('Falha ao enfileirar email de convite')
  }

  return c.json({ message: 'Convite reenviado.' })
})

export { alunosRouter }