/**
 * WF-405 — Admin Panel (Global)
 * 
 * GET  /api/v1/admin/tenants       — Listar tenants com stats
 * GET  /api/v1/admin/tenants/:id   — Detalhe do tenant
 * PUT  /api/v1/admin/tenants/:id   — Atualizar tenant (plano, status, limits)
 * GET  /api/v1/admin/stats         — Stats globais
 * GET  /api/v1/admin/logs          — Audit log (paginated)
 * POST /api/v1/admin/logs          — Criar audit entry
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, sql, desc, isNull } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { tenants, alunos, experts, execucoes, cobrancas, adminLogs } from '../db/schema'
import { generateId, now } from '../lib/id'
import { adminOnly } from '../middleware/auth'

const adminRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

adminRouter.use('*', adminOnly)

// ── Schemas ──

const updateTenantSchema = z.object({
  plano: z.enum(['trial', 'starter', 'pro', 'enterprise']).optional(),
  max_alunos: z.number().int().min(1).optional(),
  ativo: z.boolean().optional(),
})

const createLogSchema = z.object({
  admin_id: z.string(),
  acao: z.string(),
  entidade: z.string(),
  entidade_id: z.string(),
  detalhes_json: z.string().optional(),
  ip: z.string().optional(),
})

// ═══════════════════════════════════════════════════════════════
// GET /admin/tenants — Listar tenants com stats
// ═══════════════════════════════════════════════════════════════
adminRouter.get('/tenants', async (c) => {
  const db = createDB(c.env.DB)

  const tenantsData = await db
    .select({
      id: tenants.id,
      nome: tenants.nome,
      slug: tenants.slug,
      email: tenants.email,
      plano: tenants.plano,
      max_alunos: tenants.max_alunos,
      ativo: tenants.ativo,
      criado_em: tenants.criado_em,
    })
    .from(tenants)
    .where(isNull(tenants.deletado_em))
    .orderBy(desc(tenants.criado_em))

  // Buscar stats para cada tenant (alunos count, último login expert)
  const tenantsWithStats = await Promise.all(
    tenantsData.map(async (tenant) => {
      const alunosCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(alunos)
        .where(eq(alunos.tenant_id, tenant.id))
        .get()

      const lastExpertLogin = await db
        .select({ ultimo_login: experts.ultimo_login })
        .from(experts)
        .where(eq(experts.tenant_id, tenant.id))
        .orderBy(desc(experts.ultimo_login))
        .limit(1)
        .get()

      return {
        ...tenant,
        stats: {
          alunos_count: alunosCount?.count ?? 0,
          last_login: lastExpertLogin?.ultimo_login ?? null,
        },
      }
    }),
  )

  return c.json({ data: tenantsWithStats })
})

// ═══════════════════════════════════════════════════════════════
// GET /admin/tenants/:id — Detalhe do tenant
// ═══════════════════════════════════════════════════════════════
adminRouter.get('/tenants/:id', async (c) => {
  const { id } = c.req.param()
  const db = createDB(c.env.DB)

  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, id))
    .get()

  if (!tenant) {
    return c.json({ error: 'Tenant não encontrado.', code: 404 }, 404)
  }

  // Stats detalhados
  const alunosCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(alunos)
    .where(eq(alunos.tenant_id, id))
    .get()

  const expertsCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(experts)
    .where(eq(experts.tenant_id, id))
    .get()

  const execucoesCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(execucoes)
    .where(eq(execucoes.tenant_id, id))
    .get()

  const receitaMes = await db
    .select({ total: sql<number>`COALESCE(SUM(valor_centavos), 0)` })
    .from(cobrancas)
    .where(
      sql`${cobrancas.tenant_id} = ${id} AND ${cobrancas.status} = 'pago' AND strftime('%Y-%m', ${cobrancas.pago_em}) = strftime('%Y-%m', 'now')`,
    )
    .get()

  return c.json({
    ...tenant,
    stats: {
      alunos_count: alunosCount?.count ?? 0,
      experts_count: expertsCount?.count ?? 0,
      execucoes_count: execucoesCount?.count ?? 0,
      receita_mes_centavos: receitaMes?.total ?? 0,
    },
  })
})

// ═══════════════════════════════════════════════════════════════
// PUT /admin/tenants/:id — Atualizar tenant
// ═══════════════════════════════════════════════════════════════
adminRouter.put('/tenants/:id', zValidator('json', updateTenantSchema), async (c) => {
  const { id } = c.req.param()
  const body = c.req.valid('json')
  const db = createDB(c.env.DB)

  const existing = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.id, id))
    .get()

  if (!existing) {
    return c.json({ error: 'Tenant não encontrado.', code: 404 }, 404)
  }

  await db
    .update(tenants)
    .set({
      ...body,
      atualizado_em: now(),
    })
    .where(eq(tenants.id, id))

  const updated = await db.select().from(tenants).where(eq(tenants.id, id)).get()

  return c.json(updated)
})

// ═══════════════════════════════════════════════════════════════
// GET /admin/stats — Stats globais
// ═══════════════════════════════════════════════════════════════
adminRouter.get('/stats', async (c) => {
  const db = createDB(c.env.DB)

  const totalTenants = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tenants)
    .where(isNull(tenants.deletado_em))
    .get()

  const totalAlunos = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(alunos)
    .where(isNull(alunos.deletado_em))
    .get()

  const totalExecucoes = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(execucoes)
    .get()

  const receitaMes = await db
    .select({ total: sql<number>`COALESCE(SUM(valor_centavos), 0)` })
    .from(cobrancas)
    .where(
      sql`${cobrancas.status} = 'pago' AND strftime('%Y-%m', ${cobrancas.pago_em}) = strftime('%Y-%m', 'now')`,
    )
    .get()

  const tenantsAtivos = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tenants)
    .where(eq(tenants.ativo, true))
    .get()

  return c.json({
    total_tenants: totalTenants?.count ?? 0,
    tenants_ativos: tenantsAtivos?.count ?? 0,
    total_alunos: totalAlunos?.count ?? 0,
    total_execucoes: totalExecucoes?.count ?? 0,
    receita_mes_centavos: receitaMes?.total ?? 0,
  })
})

// ═══════════════════════════════════════════════════════════════
// GET /admin/logs — Audit log (paginated)
// ═══════════════════════════════════════════════════════════════
adminRouter.get('/logs', async (c) => {
  const db = createDB(c.env.DB)
  const page = Math.max(Number(c.req.query('page')) || 1, 1)
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)
  const offset = (page - 1) * limit

  const logs = await db
    .select({
      id: adminLogs.id,
      admin_id: adminLogs.admin_id,
      acao: adminLogs.acao,
      entidade: adminLogs.entidade,
      entidade_id: adminLogs.entidade_id,
      detalhes_json: adminLogs.detalhes_json,
      ip: adminLogs.ip,
      criado_em: adminLogs.criado_em,
    })
    .from(adminLogs)
    .orderBy(desc(adminLogs.criado_em))
    .limit(limit)
    .offset(offset)

  const total = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(adminLogs)
    .get()

  return c.json({
    data: logs,
    meta: {
      page,
      limit,
      total: total?.count ?? 0,
      total_pages: Math.ceil((total?.count ?? 0) / limit),
    },
  })
})

// ═══════════════════════════════════════════════════════════════
// POST /admin/logs — Criar audit entry
// ═══════════════════════════════════════════════════════════════
adminRouter.post('/logs', zValidator('json', createLogSchema), async (c) => {
  const body = c.req.valid('json')
  const db = createDB(c.env.DB)

  const id = generateId()

  await db.insert(adminLogs).values({
    id,
    admin_id: body.admin_id,
    acao: body.acao,
    entidade: body.entidade,
    entidade_id: body.entidade_id,
    detalhes_json: body.detalhes_json ?? null,
    ip: body.ip ?? null,
    criado_em: now(),
  })

  return c.json({ id, message: 'Log criado.' }, 201)
})

export { adminRouter }
