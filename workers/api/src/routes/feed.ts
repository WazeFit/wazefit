/**
 * Rotas do feed da comunidade.
 *
 * POST /api/v1/feed               — Criar post
 * GET  /api/v1/feed               — Listar feed do tenant (paginado)
 * DELETE /api/v1/feed/:id          — Deletar post proprio
 * POST /api/v1/feed/:id/curtir     — Curtir/reagir a post
 * DELETE /api/v1/feed/:id/curtir   — Remover curtida
 * POST /api/v1/feed/:id/comentar   — Adicionar comentario
 * GET  /api/v1/feed/:id/comentarios — Listar comentarios do post
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { generateId, now } from '../lib/id'
import { authMiddleware } from '../middleware/auth'

const feedRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

feedRouter.use('*', authMiddleware)

// ── Schemas ──

const createPostSchema = z.object({
  conteudo: z.string().min(1, 'Conteudo e obrigatorio.').optional(),
  tipo: z.enum(['texto', 'foto', 'treino', 'conquista', 'desafio']).default('texto'),
  midia_url: z.string().url().optional(),
  execucao_id: z.string().optional(),
  badge_id: z.string().optional(),
})

const curtirSchema = z.object({
  tipo: z.enum(['like', 'forca', 'fogo', 'aplausos', 'coracao']).default('like'),
})

const comentarSchema = z.object({
  conteudo: z.string().min(1, 'Conteudo e obrigatorio.'),
})

const feedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

const comentariosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

// ═══════════════════════════════════════════════════════════════
// POST / — Criar post
// ═══════════════════════════════════════════════════════════════
feedRouter.post('/', zValidator('json', createPostSchema), async (c) => {
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const userId = c.get('user_id')
  const role = c.get('role')
  const db = createDB(c.env.DB)

  // Buscar nome do usuario
  let userName = 'Usuario'
  if (role === 'expert' || role === 'admin') {
    const row = await c.env.DB.prepare('SELECT nome FROM experts WHERE id = ?').bind(userId).first<{ nome: string }>()
    if (row) userName = row.nome
  } else {
    const row = await c.env.DB.prepare('SELECT nome FROM alunos WHERE id = ?').bind(userId).first<{ nome: string }>()
    if (row) userName = row.nome
  }

  const userTipo = (role === 'expert' || role === 'admin') ? 'expert' : 'aluno'

  const id = generateId()
  const timestamp = now()

  await c.env.DB.prepare(
    `INSERT INTO posts (id, tenant_id, user_id, user_tipo, user_nome, conteudo, tipo, midia_url, execucao_id, badge_id, criado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, tenantId, userId, userTipo, userName,
    body.conteudo ?? null, body.tipo, body.midia_url ?? null,
    body.execucao_id ?? null, body.badge_id ?? null, timestamp
  ).run()

  return c.json({
    id, tenant_id: tenantId, user_id: userId, user_tipo: userTipo,
    user_nome: userName, conteudo: body.conteudo ?? null, tipo: body.tipo,
    midia_url: body.midia_url ?? null, curtidas_count: 0,
    comentarios_count: 0, criado_em: timestamp,
  }, 201)
})

// ═══════════════════════════════════════════════════════════════
// GET / — Listar feed do tenant (paginado, mais recente primeiro)
// ═══════════════════════════════════════════════════════════════
feedRouter.get('/', zValidator('query', feedQuerySchema), async (c) => {
  const { page, limit } = c.req.valid('query')
  const tenantId = c.get('tenant_id')
  const offset = (page - 1) * limit

  const countRow = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM posts WHERE tenant_id = ?'
  ).bind(tenantId).first<{ total: number }>()
  const total = countRow?.total ?? 0

  const rows = await c.env.DB.prepare(
    `SELECT id, tenant_id, user_id, user_tipo, user_nome, conteudo, tipo,
            midia_url, execucao_id, badge_id, curtidas_count, comentarios_count, criado_em
     FROM posts WHERE tenant_id = ?
     ORDER BY criado_em DESC LIMIT ? OFFSET ?`
  ).bind(tenantId, limit, offset).all()

  return c.json({
    data: rows.results ?? [],
    meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
  })
})

// ═══════════════════════════════════════════════════════════════
// DELETE /:id — Deletar post (proprio ou expert pode deletar qualquer)
// ═══════════════════════════════════════════════════════════════
feedRouter.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const userId = c.get('user_id')
  const role = c.get('role')

  const post = await c.env.DB.prepare(
    'SELECT id, user_id FROM posts WHERE id = ? AND tenant_id = ?'
  ).bind(id, tenantId).first<{ id: string; user_id: string }>()

  if (!post) {
    return c.json({ error: 'Post nao encontrado.', code: 404 }, 404)
  }

  // Apenas o autor ou expert pode deletar
  if (post.user_id !== userId && role !== 'expert' && role !== 'admin') {
    return c.json({ error: 'Sem permissao para deletar este post.', code: 403 }, 403)
  }

  await c.env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run()

  return c.json({ message: 'Post deletado.' })
})

// ═══════════════════════════════════════════════════════════════
// POST /:id/curtir — Curtir/reagir a post
// ═══════════════════════════════════════════════════════════════
feedRouter.post('/:id/curtir', zValidator('json', curtirSchema), async (c) => {
  const { id: postId } = c.req.param()
  const { tipo } = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const userId = c.get('user_id')

  const post = await c.env.DB.prepare(
    'SELECT id FROM posts WHERE id = ? AND tenant_id = ?'
  ).bind(postId, tenantId).first()

  if (!post) {
    return c.json({ error: 'Post nao encontrado.', code: 404 }, 404)
  }

  // Upsert curtida
  const existing = await c.env.DB.prepare(
    'SELECT id FROM curtidas WHERE post_id = ? AND user_id = ?'
  ).bind(postId, userId).first()

  if (existing) {
    await c.env.DB.prepare(
      'UPDATE curtidas SET tipo = ? WHERE post_id = ? AND user_id = ?'
    ).bind(tipo, postId, userId).run()
  } else {
    const curId = generateId()
    await c.env.DB.prepare(
      'INSERT INTO curtidas (id, post_id, user_id, tipo, criado_em) VALUES (?, ?, ?, ?, ?)'
    ).bind(curId, postId, userId, tipo, now()).run()

    await c.env.DB.prepare(
      'UPDATE posts SET curtidas_count = curtidas_count + 1 WHERE id = ?'
    ).bind(postId).run()
  }

  return c.json({ message: 'Curtida registrada.', tipo })
})

// ═══════════════════════════════════════════════════════════════
// DELETE /:id/curtir — Remover curtida
// ═══════════════════════════════════════════════════════════════
feedRouter.delete('/:id/curtir', async (c) => {
  const { id: postId } = c.req.param()
  const userId = c.get('user_id')

  const existing = await c.env.DB.prepare(
    'SELECT id FROM curtidas WHERE post_id = ? AND user_id = ?'
  ).bind(postId, userId).first()

  if (!existing) {
    return c.json({ error: 'Curtida nao encontrada.', code: 404 }, 404)
  }

  await c.env.DB.prepare(
    'DELETE FROM curtidas WHERE post_id = ? AND user_id = ?'
  ).bind(postId, userId).run()

  await c.env.DB.prepare(
    'UPDATE posts SET curtidas_count = MAX(curtidas_count - 1, 0) WHERE id = ?'
  ).bind(postId).run()

  return c.json({ message: 'Curtida removida.' })
})

// ═══════════════════════════════════════════════════════════════
// POST /:id/comentar — Adicionar comentario
// ═══════════════════════════════════════════════════════════════
feedRouter.post('/:id/comentar', zValidator('json', comentarSchema), async (c) => {
  const { id: postId } = c.req.param()
  const { conteudo } = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const userId = c.get('user_id')
  const role = c.get('role')

  const post = await c.env.DB.prepare(
    'SELECT id FROM posts WHERE id = ? AND tenant_id = ?'
  ).bind(postId, tenantId).first()

  if (!post) {
    return c.json({ error: 'Post nao encontrado.', code: 404 }, 404)
  }

  // Buscar nome do usuario
  let userName = 'Usuario'
  if (role === 'expert' || role === 'admin') {
    const row = await c.env.DB.prepare('SELECT nome FROM experts WHERE id = ?').bind(userId).first<{ nome: string }>()
    if (row) userName = row.nome
  } else {
    const row = await c.env.DB.prepare('SELECT nome FROM alunos WHERE id = ?').bind(userId).first<{ nome: string }>()
    if (row) userName = row.nome
  }

  const id = generateId()
  const timestamp = now()

  await c.env.DB.prepare(
    'INSERT INTO comentarios (id, post_id, user_id, user_nome, conteudo, criado_em) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, postId, userId, userName, conteudo, timestamp).run()

  await c.env.DB.prepare(
    'UPDATE posts SET comentarios_count = comentarios_count + 1 WHERE id = ?'
  ).bind(postId).run()

  return c.json({
    id, post_id: postId, user_id: userId,
    user_nome: userName, conteudo, criado_em: timestamp,
  }, 201)
})

// ═══════════════════════════════════════════════════════════════
// GET /:id/comentarios — Listar comentarios do post
// ═══════════════════════════════════════════════════════════════
feedRouter.get('/:id/comentarios', zValidator('query', comentariosQuerySchema), async (c) => {
  const { id: postId } = c.req.param()
  const { page, limit } = c.req.valid('query')
  const offset = (page - 1) * limit

  const rows = await c.env.DB.prepare(
    `SELECT id, post_id, user_id, user_nome, conteudo, criado_em
     FROM comentarios WHERE post_id = ?
     ORDER BY criado_em ASC LIMIT ? OFFSET ?`
  ).bind(postId, limit, offset).all()

  return c.json({ data: rows.results ?? [] })
})

export { feedRouter }
