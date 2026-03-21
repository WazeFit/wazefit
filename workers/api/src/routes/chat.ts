/**
 * Rotas de chat entre expert e aluno.
 * Mensagens em tempo real com histórico e controle de leitura.
 *
 * POST /api/v1/chat/:aluno_id/mensagens       — Enviar mensagem
 * GET  /api/v1/chat/:aluno_id/mensagens       — Listar mensagens
 * PUT  /api/v1/chat/:aluno_id/mensagens/lidas — Marcar como lidas
 * GET  /api/v1/chat/conversas                 — Listar conversas do expert
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc, isNull, sql, gt, or } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { mensagens, alunos, experts } from '../db/schema'
import { generateId, now } from '../lib/id'
import { authMiddleware } from '../middleware/auth'

const chatRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

chatRouter.use('*', authMiddleware)

// ── Schemas de validação ──

const sendMessageSchema = z.object({
  conteudo: z.string().min(1, 'Conteúdo é obrigatório.'),
  tipo: z.enum(['texto', 'imagem', 'video', 'arquivo', 'audio']).default('texto'),
  arquivo_url: z.string().url().optional(),
})

const listQuerySchema = z.object({
  since: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

// ═══════════════════════════════════════════════════════════════
// GET /chat/conversas — Listar conversas do expert com última mensagem
// ═══════════════════════════════════════════════════════════════
chatRouter.get('/conversas', async (c) => {
  const tenantId = c.get('tenant_id')
  const userId = c.get('user_id')
  const role = c.get('role')
  const db = createDB(c.env.DB)

  if (role !== 'expert' && role !== 'admin') {
    return c.json({ error: 'Acesso restrito a profissionais.', code: 403 }, 403)
  }

  // Buscar todos alunos do tenant com última mensagem
  const alunosList = await db
    .select({
      id: alunos.id,
      nome: alunos.nome,
      avatar_url: alunos.avatar_url,
      ativo: alunos.ativo,
    })
    .from(alunos)
    .where(
      and(eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em)),
    )
    .orderBy(alunos.nome)

  // Para cada aluno, buscar última mensagem e contagem de não lidas
  const conversas = []
  for (const aluno of alunosList) {
    const ultimaMensagem = await db
      .select({
        id: mensagens.id,
        conteudo: mensagens.conteudo,
        tipo: mensagens.tipo,
        remetente_tipo: mensagens.remetente_tipo,
        lida: mensagens.lida,
        criado_em: mensagens.criado_em,
      })
      .from(mensagens)
      .where(
        and(
          eq(mensagens.tenant_id, tenantId),
          or(
            and(eq(mensagens.remetente_id, userId), eq(mensagens.destinatario_id, aluno.id)),
            and(eq(mensagens.remetente_id, aluno.id), eq(mensagens.destinatario_id, userId)),
          ),
        ),
      )
      .orderBy(desc(mensagens.criado_em))
      .limit(1)
      .get()

    const naoLidasResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(mensagens)
      .where(
        and(
          eq(mensagens.tenant_id, tenantId),
          eq(mensagens.remetente_id, aluno.id),
          eq(mensagens.destinatario_id, userId),
          eq(mensagens.lida, false),
        ),
      )
      .get()

    if (ultimaMensagem) {
      conversas.push({
        aluno_id: aluno.id,
        aluno_nome: aluno.nome,
        aluno_avatar: aluno.avatar_url,
        aluno_ativo: aluno.ativo,
        ultima_mensagem: ultimaMensagem,
        nao_lidas: naoLidasResult?.count ?? 0,
      })
    }
  }

  // Ordenar por última mensagem (mais recente primeiro)
  conversas.sort((a, b) => {
    const dateA = a.ultima_mensagem?.criado_em ?? ''
    const dateB = b.ultima_mensagem?.criado_em ?? ''
    return dateB.localeCompare(dateA)
  })

  return c.json({ data: conversas })
})

// ═══════════════════════════════════════════════════════════════
// POST /chat/:aluno_id/mensagens — Enviar mensagem
// ═══════════════════════════════════════════════════════════════
chatRouter.post('/:aluno_id/mensagens', zValidator('json', sendMessageSchema), async (c) => {
  const { aluno_id } = c.req.param()
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const userId = c.get('user_id')
  const role = c.get('role')
  const db = createDB(c.env.DB)

  // Verificar aluno pertence ao tenant
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

  // Determinar remetente e destinatário
  const isExpert = role === 'expert' || role === 'admin'
  let destinatarioId: string
  if (isExpert) {
    destinatarioId = aluno_id
  } else {
    // Aluno envia para o expert do tenant
    const expert = await db.select({ id: experts.id }).from(experts)
      .where(eq(experts.tenant_id, tenantId)).get()
    destinatarioId = expert?.id ?? aluno_id
  }
  const remetenteId = userId
  const remetenteTipo = isExpert ? 'expert' : 'aluno'

  const id = generateId()
  const timestamp = now()

  await db.insert(mensagens).values({
    id,
    tenant_id: tenantId,
    remetente_id: remetenteId,
    destinatario_id: destinatarioId,
    remetente_tipo: remetenteTipo,
    conteudo: body.conteudo,
    tipo: body.tipo,
    arquivo_url: body.arquivo_url ?? null,
    lida: false,
    criado_em: timestamp,
  })

  return c.json(
    {
      id,
      remetente_id: remetenteId,
      destinatario_id: destinatarioId,
      remetente_tipo: remetenteTipo,
      conteudo: body.conteudo,
      tipo: body.tipo,
      arquivo_url: body.arquivo_url ?? null,
      lida: false,
      criado_em: timestamp,
    },
    201,
  )
})

// ═══════════════════════════════════════════════════════════════
// GET /chat/:aluno_id/mensagens — Listar mensagens
// ═══════════════════════════════════════════════════════════════
chatRouter.get('/:aluno_id/mensagens', zValidator('query', listQuerySchema), async (c) => {
  const { aluno_id } = c.req.param()
  const { since, limit } = c.req.valid('query')
  const tenantId = c.get('tenant_id')
  const userId = c.get('user_id')
  const db = createDB(c.env.DB)

  // Verificar aluno pertence ao tenant
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

  const role = c.get('role')
  // Para aluno: buscar todas msgs onde aluno é remetente ou destinatário
  // Para expert: buscar msgs entre expert e o aluno específico
  const msgFilter = role === 'aluno'
    ? or(eq(mensagens.remetente_id, aluno_id), eq(mensagens.destinatario_id, aluno_id))
    : or(
        and(eq(mensagens.remetente_id, userId), eq(mensagens.destinatario_id, aluno_id)),
        and(eq(mensagens.remetente_id, aluno_id), eq(mensagens.destinatario_id, userId)),
      )

  const conditions = [
    eq(mensagens.tenant_id, tenantId),
    msgFilter,
  ]

  if (since) {
    conditions.push(gt(mensagens.criado_em, since))
  }

  const data = await db
    .select({
      id: mensagens.id,
      remetente_id: mensagens.remetente_id,
      destinatario_id: mensagens.destinatario_id,
      remetente_tipo: mensagens.remetente_tipo,
      conteudo: mensagens.conteudo,
      tipo: mensagens.tipo,
      arquivo_url: mensagens.arquivo_url,
      lida: mensagens.lida,
      criado_em: mensagens.criado_em,
    })
    .from(mensagens)
    .where(and(...conditions))
    .orderBy(desc(mensagens.criado_em))
    .limit(limit)

  return c.json({ data: data.reverse() }) // Reverter para ordem cronológica
})

// ═══════════════════════════════════════════════════════════════
// PUT /chat/:aluno_id/mensagens/lidas — Marcar como lidas
// ═══════════════════════════════════════════════════════════════
chatRouter.put('/:aluno_id/mensagens/lidas', async (c) => {
  const { aluno_id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const userId = c.get('user_id')
  const db = createDB(c.env.DB)

  // Verificar aluno pertence ao tenant
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

  // Marcar como lidas todas as mensagens enviadas pelo aluno para este user
  await db
    .update(mensagens)
    .set({ lida: true })
    .where(
      and(
        eq(mensagens.tenant_id, tenantId),
        eq(mensagens.remetente_id, aluno_id),
        eq(mensagens.destinatario_id, userId),
        eq(mensagens.lida, false),
      ),
    )

  return c.json({ message: 'Mensagens marcadas como lidas.' })
})

export { chatRouter }
