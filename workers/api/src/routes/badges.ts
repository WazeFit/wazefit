/**
 * Rotas de badges/conquistas.
 *
 * GET /api/v1/badges          — Listar todos badges disponiveis
 * GET /api/v1/badges/meus     — Listar badges do usuario atual
 * GET /api/v1/badges/perfil/:userId — Perfil publico: stats + badges
 */
import { Hono } from 'hono'
import type { Env, AuthVariables } from '../types'
import { authMiddleware } from '../middleware/auth'

const badgesRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

badgesRouter.use('*', authMiddleware)

// ═══════════════════════════════════════════════════════════════
// GET / — Listar todos badges disponiveis
// ═══════════════════════════════════════════════════════════════
badgesRouter.get('/', async (c) => {
  const tenantId = c.get('tenant_id')

  const rows = await c.env.DB.prepare(
    `SELECT id, tenant_id, nome, descricao, icone, categoria, raridade, criado_em
     FROM badges WHERE tenant_id IS NULL OR tenant_id = ?
     ORDER BY raridade DESC, nome ASC`
  ).bind(tenantId).all()

  return c.json({ data: rows.results ?? [] })
})

// ═══════════════════════════════════════════════════════════════
// GET /meus — Listar badges do usuario atual
// ═══════════════════════════════════════════════════════════════
badgesRouter.get('/meus', async (c) => {
  const userId = c.get('user_id')

  const rows = await c.env.DB.prepare(
    `SELECT b.id, b.nome, b.descricao, b.icone, b.categoria, b.raridade,
            ub.conquistado_em
     FROM user_badges ub
     JOIN badges b ON b.id = ub.badge_id
     WHERE ub.user_id = ?
     ORDER BY ub.conquistado_em DESC`
  ).bind(userId).all()

  return c.json({ data: rows.results ?? [] })
})

// ═══════════════════════════════════════════════════════════════
// GET /perfil/:userId — Perfil publico: stats + badges
// ═══════════════════════════════════════════════════════════════
badgesRouter.get('/perfil/:userId', async (c) => {
  const { userId } = c.req.param()
  const tenantId = c.get('tenant_id')

  // Tentar buscar como aluno primeiro, depois expert
  let user: { nome: string; avatar_url: string | null; tipo: string } | null = null

  const aluno = await c.env.DB.prepare(
    'SELECT nome, avatar_url FROM alunos WHERE id = ? AND tenant_id = ?'
  ).bind(userId, tenantId).first<{ nome: string; avatar_url: string | null }>()

  if (aluno) {
    user = { nome: aluno.nome, avatar_url: aluno.avatar_url, tipo: 'aluno' }
  } else {
    const expert = await c.env.DB.prepare(
      'SELECT nome, avatar_url FROM experts WHERE id = ? AND tenant_id = ?'
    ).bind(userId, tenantId).first<{ nome: string; avatar_url: string | null }>()

    if (expert) {
      user = { nome: expert.nome, avatar_url: expert.avatar_url, tipo: 'expert' }
    }
  }

  if (!user) {
    return c.json({ error: 'Usuario nao encontrado.', code: 404 }, 404)
  }

  // Badges
  const badges = await c.env.DB.prepare(
    `SELECT b.id, b.nome, b.descricao, b.icone, b.categoria, b.raridade,
            ub.conquistado_em
     FROM user_badges ub
     JOIN badges b ON b.id = ub.badge_id
     WHERE ub.user_id = ?
     ORDER BY ub.conquistado_em DESC`
  ).bind(userId).all()

  // Stats - posts count
  const postsCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM posts WHERE user_id = ? AND tenant_id = ?'
  ).bind(userId, tenantId).first<{ total: number }>()

  // Stats - curtidas recebidas
  const curtidasRecebidas = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM curtidas c
     JOIN posts p ON p.id = c.post_id
     WHERE p.user_id = ? AND p.tenant_id = ?`
  ).bind(userId, tenantId).first<{ total: number }>()

  // Stats - desafios concluidos
  const desafiosConcluidos = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM desafio_participantes WHERE user_id = ? AND concluido = 1'
  ).bind(userId).first<{ total: number }>()

  // Posts recentes
  const recentPosts = await c.env.DB.prepare(
    `SELECT id, conteudo, tipo, midia_url, curtidas_count, comentarios_count, criado_em
     FROM posts WHERE user_id = ? AND tenant_id = ?
     ORDER BY criado_em DESC LIMIT 10`
  ).bind(userId, tenantId).all()

  return c.json({
    user: {
      id: userId,
      nome: user.nome,
      avatar_url: user.avatar_url,
      tipo: user.tipo,
    },
    stats: {
      posts: postsCount?.total ?? 0,
      curtidas_recebidas: curtidasRecebidas?.total ?? 0,
      desafios_concluidos: desafiosConcluidos?.total ?? 0,
      badges_total: (badges.results ?? []).length,
    },
    badges: badges.results ?? [],
    posts_recentes: recentPosts.results ?? [],
  })
})

export { badgesRouter }
