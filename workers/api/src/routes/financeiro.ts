/**
 * Rotas financeiras — cobranças e integração Stripe.
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc, isNull, sql, gte, lte } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { cobrancas, alunos } from '../db/schema'
import { generateId, now } from '../lib/id'
import { authMiddleware, expertOnly } from '../middleware/auth'

const financeiroRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

const createCobrancaSchema = z.object({
  aluno_id: z.string().uuid(),
  descricao: z.string().min(2),
  valor_centavos: z.number().int().min(1),
  vencimento: z.string().min(10),
  metodo_pagamento: z.string().optional(),
})
const updateCobrancaSchema = z.object({
  status: z.enum(['pendente', 'pago', 'vencido', 'cancelado']).optional(),
  pago_em: z.string().optional(),
  stripe_payment_id: z.string().optional(),
  stripe_link_url: z.string().url().optional(),
  metodo_pagamento: z.string().optional(),
  descricao: z.string().min(2).optional(),
  valor_centavos: z.number().int().min(1).optional(),
  vencimento: z.string().optional(),
})
const listQS = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  aluno_id: z.string().optional(),
  status: z.enum(['pendente', 'pago', 'vencido', 'cancelado']).optional(),
  vencimento_inicio: z.string().optional(),
  vencimento_fim: z.string().optional(),
})

financeiroRouter.post('/cobrancas', authMiddleware, expertOnly, zValidator('json', createCobrancaSchema), async (c) => {
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const aluno = await db.select({ id: alunos.id, nome: alunos.nome }).from(alunos)
    .where(and(eq(alunos.id, body.aluno_id), eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em))).get()
  if (!aluno) return c.json({ error: 'Aluno não encontrado.', code: 404 }, 404)
  const id = generateId()
  const ts = now()
  await db.insert(cobrancas).values({
    id, tenant_id: tenantId, aluno_id: body.aluno_id, descricao: body.descricao,
    valor_centavos: body.valor_centavos, status: 'pendente', vencimento: body.vencimento,
    metodo_pagamento: body.metodo_pagamento ?? null, criado_em: ts, atualizado_em: ts,
  })
  return c.json({ id, aluno_id: body.aluno_id, aluno_nome: aluno.nome, descricao: body.descricao, valor_centavos: body.valor_centavos, status: 'pendente', vencimento: body.vencimento, criado_em: ts }, 201)
})

financeiroRouter.get('/cobrancas', authMiddleware, expertOnly, zValidator('query', listQS), async (c) => {
  const { page, limit, aluno_id, status, vencimento_inicio, vencimento_fim } = c.req.valid('query')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const offset = (page - 1) * limit
  const conds = [eq(cobrancas.tenant_id, tenantId)]
  if (aluno_id) conds.push(eq(cobrancas.aluno_id, aluno_id))
  if (status) conds.push(eq(cobrancas.status, status))
  if (vencimento_inicio) conds.push(gte(cobrancas.vencimento, vencimento_inicio))
  if (vencimento_fim) conds.push(lte(cobrancas.vencimento, vencimento_fim))
  const where = and(...conds)
  const cnt = await db.select({ count: sql<number>`COUNT(*)` }).from(cobrancas).where(where).get()
  const total = cnt?.count ?? 0
  const data = await db.select({
    id: cobrancas.id, aluno_id: cobrancas.aluno_id, aluno_nome: alunos.nome,
    descricao: cobrancas.descricao, valor_centavos: cobrancas.valor_centavos,
    status: cobrancas.status, vencimento: cobrancas.vencimento, pago_em: cobrancas.pago_em,
    metodo_pagamento: cobrancas.metodo_pagamento, criado_em: cobrancas.criado_em, atualizado_em: cobrancas.atualizado_em,
  }).from(cobrancas).leftJoin(alunos, eq(cobrancas.aluno_id, alunos.id)).where(where)
    .orderBy(desc(cobrancas.vencimento)).limit(limit).offset(offset)
  return c.json({ data, meta: { page, limit, total, total_pages: Math.ceil(total / limit) } })
})

financeiroRouter.get('/cobrancas/:id', authMiddleware, expertOnly, async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const row = await db.select({
    id: cobrancas.id, aluno_id: cobrancas.aluno_id, aluno_nome: alunos.nome,
    descricao: cobrancas.descricao, valor_centavos: cobrancas.valor_centavos,
    status: cobrancas.status, vencimento: cobrancas.vencimento, pago_em: cobrancas.pago_em,
    stripe_payment_id: cobrancas.stripe_payment_id, stripe_link_url: cobrancas.stripe_link_url,
    metodo_pagamento: cobrancas.metodo_pagamento, criado_em: cobrancas.criado_em, atualizado_em: cobrancas.atualizado_em,
  }).from(cobrancas).leftJoin(alunos, eq(cobrancas.aluno_id, alunos.id))
    .where(and(eq(cobrancas.id, id), eq(cobrancas.tenant_id, tenantId))).get()
  if (!row) return c.json({ error: 'Cobrança não encontrada.', code: 404 }, 404)
  return c.json(row)
})

financeiroRouter.put('/cobrancas/:id', authMiddleware, expertOnly, zValidator('json', updateCobrancaSchema), async (c) => {
  const { id } = c.req.param()
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const existing = await db.select({ id: cobrancas.id }).from(cobrancas)
    .where(and(eq(cobrancas.id, id), eq(cobrancas.tenant_id, tenantId))).get()
  if (!existing) return c.json({ error: 'Cobrança não encontrada.', code: 404 }, 404)
  const upd: Record<string, unknown> = { ...body, atualizado_em: now() }
  if (body.status === 'pago' && !body.pago_em) upd.pago_em = now()
  await db.update(cobrancas).set(upd).where(eq(cobrancas.id, id))
  const updated = await db.select({
    id: cobrancas.id, aluno_id: cobrancas.aluno_id, descricao: cobrancas.descricao,
    valor_centavos: cobrancas.valor_centavos, status: cobrancas.status,
    vencimento: cobrancas.vencimento, pago_em: cobrancas.pago_em, atualizado_em: cobrancas.atualizado_em,
  }).from(cobrancas).where(eq(cobrancas.id, id)).get()
  return c.json(updated)
})

financeiroRouter.get('/financeiro/resumo', authMiddleware, expertOnly, async (c) => {
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const pendente = await db.select({ total: sql<number>`COALESCE(SUM(valor_centavos), 0)` })
    .from(cobrancas).where(and(eq(cobrancas.tenant_id, tenantId), eq(cobrancas.status, 'pendente'))).get()
  const pago = await db.select({ total: sql<number>`COALESCE(SUM(valor_centavos), 0)` })
    .from(cobrancas).where(and(eq(cobrancas.tenant_id, tenantId), eq(cobrancas.status, 'pago'))).get()
  const vencido = await db.select({ total: sql<number>`COALESCE(SUM(valor_centavos), 0)` })
    .from(cobrancas).where(and(eq(cobrancas.tenant_id, tenantId), eq(cobrancas.status, 'vencido'))).get()
  const porMes = await db.select({
    mes: sql<string>`strftime('%Y-%m', vencimento)`,
    total_pendente: sql<number>`COALESCE(SUM(CASE WHEN status = 'pendente' THEN valor_centavos ELSE 0 END), 0)`,
    total_pago: sql<number>`COALESCE(SUM(CASE WHEN status = 'pago' THEN valor_centavos ELSE 0 END), 0)`,
    total_vencido: sql<number>`COALESCE(SUM(CASE WHEN status = 'vencido' THEN valor_centavos ELSE 0 END), 0)`,
    quantidade: sql<number>`COUNT(*)`,
  }).from(cobrancas).where(eq(cobrancas.tenant_id, tenantId))
    .groupBy(sql`strftime('%Y-%m', vencimento)`)
    .orderBy(desc(sql`strftime('%Y-%m', vencimento)`)).limit(12)
  return c.json({
    resumo: { total_pendente_centavos: pendente?.total ?? 0, total_pago_centavos: pago?.total ?? 0, total_vencido_centavos: vencido?.total ?? 0 },
    por_mes: porMes,
  })
})

financeiroRouter.post('/webhooks/stripe', async (c) => {
  const db = createDB(c.env.DB)
  const sig = c.req.header('stripe-signature')
  if (!sig) return c.json({ error: 'Assinatura ausente.', code: 401 }, 401)

  const rawBody = await c.req.text()
  const secret = c.env.STRIPE_WEBHOOK_SECRET
  const parts = sig.split(',')
  const tPart = parts.find(p => p.startsWith('t='))
  const sPart = parts.find(p => p.startsWith('v1='))
  if (!tPart || !sPart) return c.json({ error: 'Assinatura inválida.', code: 401 }, 401)

  const ts = tPart.slice(2)
  const expectedSig = sPart.slice(3)
  const age = Math.floor(Date.now() / 1000) - parseInt(ts, 10)
  if (Math.abs(age) > 300) return c.json({ error: 'Webhook expirado.', code: 401 }, 401)

  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${ts}.${rawBody}`))
  const computed = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('')
  if (computed !== expectedSig) return c.json({ error: 'Assinatura inválida.', code: 401 }, 401)

  const event = JSON.parse(rawBody) as { type: string; data: { object: { id: string; metadata?: { cobranca_id?: string; tenant_id?: string } } } }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object
      const cobrancaId = pi.metadata?.cobranca_id
      if (cobrancaId) {
        await db.update(cobrancas).set({ status: 'pago', pago_em: now(), stripe_payment_id: pi.id, atualizado_em: now() }).where(eq(cobrancas.id, cobrancaId))
      }
      break
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object
      const cobrancaId = pi.metadata?.cobranca_id
      if (cobrancaId) {
        await db.update(cobrancas).set({ status: 'vencido', atualizado_em: now() }).where(eq(cobrancas.id, cobrancaId))
      }
      break
    }
  }

  return c.json({ received: true })
})

export { financeiroRouter }
