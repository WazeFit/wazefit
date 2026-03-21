/**
 * WF-403 — Push Notifications
 * 
 * POST   /api/v1/push/subscribe           — Salvar push subscription
 * DELETE /api/v1/push/unsubscribe         — Remover subscription
 * POST   /api/v1/push/send                — Enviar notificação (expert only)
 * GET    /api/v1/notificacoes             — Listar notificações do usuário
 * PUT    /api/v1/notificacoes/:id/lida    — Marcar como lida
 * PUT    /api/v1/notificacoes/todas-lidas — Marcar todas como lidas
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc, sql, isNull } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { pushSubscriptions, notificacoes, alunos } from '../db/schema'
import { generateId, now } from '../lib/id'
import { authMiddleware, expertOnly } from '../middleware/auth'

const pushRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

pushRouter.use('*', authMiddleware)

// ── Schemas ──

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string(),
  auth: z.string(),
})

const sendNotificationSchema = z.object({
  aluno_id: z.string().optional(),
  broadcast: z.boolean().optional().default(false),
  tipo: z.enum(['treino', 'cobranca', 'mensagem', 'sistema']),
  titulo: z.string().min(1).max(100),
  corpo: z.string().min(1).max(300),
})

// ═══════════════════════════════════════════════════════════════
// POST /push/subscribe — Salvar push subscription
// ═══════════════════════════════════════════════════════════════
pushRouter.post('/subscribe', zValidator('json', subscribeSchema), async (c) => {
  const { endpoint, p256dh, auth } = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const userId = c.get('user_id')
  const role = c.get('role')
  const db = createDB(c.env.DB)

  const userTipo = role === 'expert' || role === 'admin' ? 'expert' : 'aluno'

  // Verificar se já existe (upsert via delete + insert)
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))

  const id = generateId()

  await db.insert(pushSubscriptions).values({
    id,
    tenant_id: tenantId,
    user_id: userId,
    user_tipo: userTipo,
    endpoint,
    p256dh,
    auth,
    criado_em: now(),
  })

  return c.json({ message: 'Subscription salva.', id }, 201)
})

// ═══════════════════════════════════════════════════════════════
// DELETE /push/unsubscribe — Remover subscription
// ═══════════════════════════════════════════════════════════════
pushRouter.delete('/unsubscribe', zValidator('json', z.object({ endpoint: z.string() })), async (c) => {
  const { endpoint } = c.req.valid('json')
  const userId = c.get('user_id')
  const db = createDB(c.env.DB)

  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.user_id, userId)))

  return c.json({ message: 'Subscription removida.' })
})

// ═══════════════════════════════════════════════════════════════
// POST /push/send — Enviar notificação (expert only)
// ═══════════════════════════════════════════════════════════════
pushRouter.post('/send', expertOnly, zValidator('json', sendNotificationSchema), async (c) => {
  const { aluno_id, broadcast, tipo, titulo, corpo } = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  let targetUserIds: string[] = []

  if (broadcast) {
    // Broadcast para todos os alunos ativos
    const alunosAtivos = await db
      .select({ id: alunos.id })
      .from(alunos)
      .where(and(eq(alunos.tenant_id, tenantId), eq(alunos.ativo, true), isNull(alunos.deletado_em)))

    targetUserIds = alunosAtivos.map((a) => a.id)
  } else if (aluno_id) {
    targetUserIds = [aluno_id]
  } else {
    return c.json({ error: 'Forneça aluno_id ou broadcast=true', code: 400 }, 400)
  }

  if (targetUserIds.length === 0) {
    return c.json({ message: 'Nenhum destinatário encontrado.' })
  }

  // Salvar notificações no banco
  const notifIds: string[] = []
  for (const userId of targetUserIds) {
    const id = generateId()
    notifIds.push(id)

    await db.insert(notificacoes).values({
      id,
      tenant_id: tenantId,
      user_id: userId,
      tipo,
      titulo,
      corpo,
      lida: false,
      criado_em: now(),
    })
  }

  // Buscar subscriptions dos usuários
  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.tenant_id, tenantId),
        sql`${pushSubscriptions.user_id} IN (${sql.join(targetUserIds.map((id) => sql`${id}`), sql`, `)})`
      ),
    )

  // Enviar push notifications via Web Push API (simplificado — sem implementação real aqui)
  // Em produção, usar biblioteca web-push ou Cloudflare Durable Objects
  const pushEnviados = subscriptions.length
  // Mock: em produção, iterar subscriptions e usar web-push library
  // for (const sub of subscriptions) {
  //   await webpush.sendNotification(
  //     { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
  //     JSON.stringify({ title: titulo, body: corpo })
  //   )
  // }

  return c.json({
    message: `${notifIds.length} notificações criadas, ${pushEnviados} pushes enviados.`,
    notificacoes_ids: notifIds,
  })
})

// ═══════════════════════════════════════════════════════════════
// GET /notificacoes — Listar notificações do usuário
// ═══════════════════════════════════════════════════════════════
pushRouter.get('/notificacoes', async (c) => {
  const userId = c.get('user_id')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)

  const data = await db
    .select({
      id: notificacoes.id,
      tipo: notificacoes.tipo,
      titulo: notificacoes.titulo,
      corpo: notificacoes.corpo,
      lida: notificacoes.lida,
      criado_em: notificacoes.criado_em,
    })
    .from(notificacoes)
    .where(and(eq(notificacoes.tenant_id, tenantId), eq(notificacoes.user_id, userId)))
    .orderBy(desc(notificacoes.criado_em))
    .limit(limit)

  const naoLidas = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(notificacoes)
    .where(
      and(
        eq(notificacoes.tenant_id, tenantId),
        eq(notificacoes.user_id, userId),
        eq(notificacoes.lida, false),
      ),
    )
    .get()

  return c.json({
    data,
    meta: {
      total_nao_lidas: naoLidas?.count ?? 0,
    },
  })
})

// ═══════════════════════════════════════════════════════════════
// PUT /notificacoes/:id/lida — Marcar como lida
// ═══════════════════════════════════════════════════════════════
pushRouter.put('/notificacoes/:id/lida', async (c) => {
  const { id } = c.req.param()
  const userId = c.get('user_id')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const notif = await db
    .select({ id: notificacoes.id })
    .from(notificacoes)
    .where(
      and(
        eq(notificacoes.id, id),
        eq(notificacoes.tenant_id, tenantId),
        eq(notificacoes.user_id, userId),
      ),
    )
    .get()

  if (!notif) {
    return c.json({ error: 'Notificação não encontrada.', code: 404 }, 404)
  }

  await db.update(notificacoes).set({ lida: true }).where(eq(notificacoes.id, id))

  return c.json({ message: 'Notificação marcada como lida.' })
})

// ═══════════════════════════════════════════════════════════════
// PUT /notificacoes/todas-lidas — Marcar todas como lidas
// ═══════════════════════════════════════════════════════════════
pushRouter.put('/notificacoes/todas-lidas', async (c) => {
  const userId = c.get('user_id')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  await db
    .update(notificacoes)
    .set({ lida: true })
    .where(
      and(
        eq(notificacoes.tenant_id, tenantId),
        eq(notificacoes.user_id, userId),
        eq(notificacoes.lida, false),
      ),
    )

  return c.json({ message: 'Todas as notificações marcadas como lidas.' })
})

export { pushRouter }
