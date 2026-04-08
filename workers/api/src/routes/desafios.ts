/**
 * Rotas de desafios da comunidade.
 *
 * POST /api/v1/desafios             — Criar desafio (expert only)
 * GET  /api/v1/desafios             — Listar desafios ativos do tenant
 * GET  /api/v1/desafios/:id         — Detalhe do desafio com leaderboard
 * POST /api/v1/desafios/:id/participar — Participar de desafio
 * PUT  /api/v1/desafios/:id/progresso  — Atualizar progresso
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env, AuthVariables } from '../types'
import { generateId, now } from '../lib/id'
import { authMiddleware } from '../middleware/auth'

const desafiosRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

desafiosRouter.use('*', authMiddleware)

// ── Schemas ──

const createDesafioSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio.'),
  descricao: z.string().optional(),
  tipo: z.enum(['individual', 'equipe', 'comunidade']).default('individual'),
  meta_tipo: z.string().min(1, 'Meta tipo e obrigatorio.'),
  meta_valor: z.number().int().min(1),
  data_inicio: z.string().min(1, 'Data inicio e obrigatoria.'),
  data_fim: z.string().min(1, 'Data fim e obrigatoria.'),
})

const progressoSchema = z.object({
  incremento: z.number().int().min(1).default(1),
})

// ═══════════════════════════════════════════════════════════════
// POST / — Criar desafio (expert only)
// ═══════════════════════════════════════════════════════════════
desafiosRouter.post('/', zValidator('json', createDesafioSchema), async (c) => {
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const userId = c.get('user_id')
  const role = c.get('role')

  if (role !== 'expert' && role !== 'admin') {
    return c.json({ error: 'Acesso restrito a profissionais.', code: 403 }, 403)
  }

  const id = generateId()
  const timestamp = now()

  await c.env.DB.prepare(
    `INSERT INTO desafios (id, tenant_id, expert_id, nome, descricao, tipo, meta_tipo, meta_valor, data_inicio, data_fim, ativo, criado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
  ).bind(
    id, tenantId, userId, body.nome, body.descricao ?? null,
    body.tipo, body.meta_tipo, body.meta_valor,
    body.data_inicio, body.data_fim, timestamp
  ).run()

  return c.json({
    id, tenant_id: tenantId, expert_id: userId,
    nome: body.nome, descricao: body.descricao ?? null,
    tipo: body.tipo, meta_tipo: body.meta_tipo, meta_valor: body.meta_valor,
    data_inicio: body.data_inicio, data_fim: body.data_fim,
    ativo: 1, criado_em: timestamp,
  }, 201)
})

// ═══════════════════════════════════════════════════════════════
// GET / — Listar desafios ativos do tenant
// ═══════════════════════════════════════════════════════════════
desafiosRouter.get('/', async (c) => {
  const tenantId = c.get('tenant_id')

  const rows = await c.env.DB.prepare(
    `SELECT id, tenant_id, expert_id, nome, descricao, tipo, meta_tipo, meta_valor,
            data_inicio, data_fim, ativo, criado_em
     FROM desafios WHERE tenant_id = ? AND ativo = 1
     ORDER BY data_fim ASC`
  ).bind(tenantId).all()

  // Para cada desafio, buscar contagem de participantes
  const desafios = []
  for (const d of rows.results ?? []) {
    const countRow = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM desafio_participantes WHERE desafio_id = ?'
    ).bind((d as Record<string, unknown>).id).first<{ total: number }>()

    desafios.push({ ...d, participantes_count: countRow?.total ?? 0 })
  }

  return c.json({ data: desafios })
})

// ═══════════════════════════════════════════════════════════════
// GET /:id — Detalhe do desafio com leaderboard
// ═══════════════════════════════════════════════════════════════
desafiosRouter.get('/:id', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')

  const desafio = await c.env.DB.prepare(
    `SELECT id, tenant_id, expert_id, nome, descricao, tipo, meta_tipo, meta_valor,
            data_inicio, data_fim, ativo, criado_em
     FROM desafios WHERE id = ? AND tenant_id = ?`
  ).bind(id, tenantId).first()

  if (!desafio) {
    return c.json({ error: 'Desafio nao encontrado.', code: 404 }, 404)
  }

  // Leaderboard - top participantes ordenados por progresso desc
  const leaderboard = await c.env.DB.prepare(
    `SELECT dp.user_id, dp.progresso, dp.concluido, dp.criado_em,
            COALESCE(a.nome, e.nome, 'Usuario') as user_nome
     FROM desafio_participantes dp
     LEFT JOIN alunos a ON a.id = dp.user_id
     LEFT JOIN experts e ON e.id = dp.user_id
     WHERE dp.desafio_id = ?
     ORDER BY dp.progresso DESC
     LIMIT 50`
  ).bind(id).all()

  // Atribuir posicoes
  const ranked = (leaderboard.results ?? []).map((p, i) => ({
    ...p,
    posicao: i + 1,
  }))

  return c.json({ ...desafio, leaderboard: ranked })
})

// ═══════════════════════════════════════════════════════════════
// POST /:id/participar — Participar de desafio
// ═══════════════════════════════════════════════════════════════
desafiosRouter.post('/:id/participar', async (c) => {
  const { id: desafioId } = c.req.param()
  const tenantId = c.get('tenant_id')
  const userId = c.get('user_id')

  const desafio = await c.env.DB.prepare(
    'SELECT id FROM desafios WHERE id = ? AND tenant_id = ? AND ativo = 1'
  ).bind(desafioId, tenantId).first()

  if (!desafio) {
    return c.json({ error: 'Desafio nao encontrado ou inativo.', code: 404 }, 404)
  }

  // Verificar se ja participa
  const existing = await c.env.DB.prepare(
    'SELECT id FROM desafio_participantes WHERE desafio_id = ? AND user_id = ?'
  ).bind(desafioId, userId).first()

  if (existing) {
    return c.json({ error: 'Voce ja participa deste desafio.', code: 409 }, 409)
  }

  const id = generateId()
  await c.env.DB.prepare(
    'INSERT INTO desafio_participantes (id, desafio_id, user_id, progresso, concluido, criado_em) VALUES (?, ?, ?, 0, 0, ?)'
  ).bind(id, desafioId, userId, now()).run()

  return c.json({ message: 'Participacao registrada.', id }, 201)
})

// ═══════════════════════════════════════════════════════════════
// PUT /:id/progresso — Atualizar progresso (incremento)
// ═══════════════════════════════════════════════════════════════
desafiosRouter.put('/:id/progresso', zValidator('json', progressoSchema), async (c) => {
  const { id: desafioId } = c.req.param()
  const { incremento } = c.req.valid('json')
  const userId = c.get('user_id')

  const participante = await c.env.DB.prepare(
    'SELECT id, progresso FROM desafio_participantes WHERE desafio_id = ? AND user_id = ?'
  ).bind(desafioId, userId).first<{ id: string; progresso: number }>()

  if (!participante) {
    return c.json({ error: 'Voce nao participa deste desafio.', code: 404 }, 404)
  }

  const novoProgresso = participante.progresso + incremento

  // Verificar se atingiu meta
  const desafio = await c.env.DB.prepare(
    'SELECT meta_valor FROM desafios WHERE id = ?'
  ).bind(desafioId).first<{ meta_valor: number }>()

  const concluido = desafio && novoProgresso >= desafio.meta_valor ? 1 : 0

  await c.env.DB.prepare(
    'UPDATE desafio_participantes SET progresso = ?, concluido = ? WHERE desafio_id = ? AND user_id = ?'
  ).bind(novoProgresso, concluido, desafioId, userId).run()

  return c.json({
    progresso: novoProgresso,
    concluido: concluido === 1,
    meta_valor: desafio?.meta_valor ?? 0,
  })
})

export { desafiosRouter }
