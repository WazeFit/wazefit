/**
 * Rotas de autenticação.
 * POST /auth/register — Cria expert + tenant (onboarding)
 * POST /auth/login — Login (expert ou aluno)
 * POST /auth/refresh — Renova access token
 * POST /auth/logout — Invalida sessão
 * GET  /auth/me — Retorna dados do usuário autenticado
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { tenants, experts, alunos } from '../db/schema'
import { hashPassword, verifyPassword } from '../lib/crypto'
import { generateTokens, verifyJWT } from '../lib/jwt'
import { generateId, slugify, now } from '../lib/id'
import { authMiddleware } from '../middleware/auth'
import { loginRateLimit, registerRateLimit } from '../middleware/rate-limit'

const auth = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

// ── Schemas de validação ──

const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('Email inválido.'),
  senha: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres.')
    .regex(/[A-Z]/, 'Senha deve ter pelo menos uma letra maiúscula.')
    .regex(/[0-9]/, 'Senha deve ter pelo menos um número.'),
  nome_negocio: z.string().min(2, 'Nome do negócio deve ter pelo menos 2 caracteres.'),
  telefone: z.string().optional(),
  especialidade: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email('Email inválido.'),
  senha: z.string().min(1, 'Senha é obrigatória.'),
})

const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token é obrigatório.'),
})

// ═══════════════════════════════════════════════════════════════
// POST /auth/register — Criar expert + tenant
// ═══════════════════════════════════════════════════════════════
auth.post('/register', registerRateLimit, zValidator('json', registerSchema), async (c) => {
  const body = c.req.valid('json')
  const db = createDB(c.env.DB)

  // Verificar se email já existe
  const existing = await db.select({ id: experts.id }).from(experts).where(eq(experts.email, body.email)).get()

  if (existing) {
    return c.json({ error: 'Email já cadastrado.', code: 409 }, 409)
  }

  // Gerar IDs e hash
  const tenantId = generateId()
  const expertId = generateId()
  const senhaHash = await hashPassword(body.senha)
  const slug = slugify(body.nome_negocio)
  const timestamp = now()

  // Verificar se slug já existe e gerar alternativa
  const existingSlug = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug)).get()

  const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug

  // Criar tenant + expert em batch
  await db.batch([
    db.insert(tenants).values({
      id: tenantId,
      nome: body.nome_negocio,
      slug: finalSlug,
      email: body.email,
      plano: 'trial',
      max_alunos: 10,
      ativo: true,
      criado_em: timestamp,
      atualizado_em: timestamp,
    }),
    db.insert(experts).values({
      id: expertId,
      tenant_id: tenantId,
      nome: body.nome,
      email: body.email,
      senha_hash: senhaHash,
      telefone: body.telefone ?? null,
      especialidade: body.especialidade ?? null,
      role: 'owner',
      ativo: true,
      criado_em: timestamp,
      atualizado_em: timestamp,
    }),
  ])

  // Gerar tokens
  const tokens = await generateTokens(c.env.JWT_SECRET, {
    sub: expertId,
    tid: tenantId,
    role: 'expert',
    email: body.email,
  })

  // Salvar sessão no KV (7 dias TTL)
  await c.env.KV_SESSIONS.put(
    `session:${expertId}`,
    JSON.stringify({
      tenant_id: tenantId,
      role: 'expert',
      created_at: timestamp,
    }),
    { expirationTtl: 7 * 24 * 60 * 60 },
  )

  // Disparar email de boas-vindas (assíncrono via queue, não bloqueia o cadastro)
  // O worker wazefit-email consome QUEUE_EMAILS e renderiza o template "welcome".
  try {
    const painelUrl = `https://${finalSlug}.wazefit.com`
    await c.env.QUEUE_EMAILS.send({
      type: 'welcome',
      to: body.email,
      data: {
        nome: body.nome,
        nome_negocio: body.nome_negocio,
        email: body.email,
        painel_url: painelUrl,
        reset_url: `${painelUrl}/forgot-password`,
      },
    })
  } catch (err) {
    // Não falha o cadastro se a queue estiver indisponível.
    console.error('welcome email enqueue failed:', err)
  }

  return c.json(
    {
      user: {
        id: expertId,
        nome: body.nome,
        email: body.email,
        role: 'owner',
      },
      tenant: {
        id: tenantId,
        nome: body.nome_negocio,
        slug: finalSlug,
        plano: 'trial',
      },
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: tokens.expiresIn,
    },
    201,
  )
})

// ═══════════════════════════════════════════════════════════════
// POST /auth/login — Login (expert ou aluno)
// ═══════════════════════════════════════════════════════════════
auth.post('/login', loginRateLimit, zValidator('json', loginSchema), async (c) => {
  const { email, senha } = c.req.valid('json')
  const db = createDB(c.env.DB)

  // Tentar expert primeiro
  const expert = await db
    .select()
    .from(experts)
    .where(and(eq(experts.email, email), eq(experts.ativo, true)))
    .get()

  if (expert) {
    const valid = await verifyPassword(senha, expert.senha_hash)
    if (!valid) {
      return c.json({ error: 'Credenciais inválidas.', code: 401 }, 401)
    }

    // Atualizar último login
    await db
      .update(experts)
      .set({ ultimo_login: now() })
      .where(eq(experts.id, expert.id))

    const tokens = await generateTokens(c.env.JWT_SECRET, {
      sub: expert.id,
      tid: expert.tenant_id,
      role: 'expert',
      email: expert.email,
    })

    await c.env.KV_SESSIONS.put(
      `session:${expert.id}`,
      JSON.stringify({
        tenant_id: expert.tenant_id,
        role: expert.role,
        created_at: now(),
      }),
      { expirationTtl: 7 * 24 * 60 * 60 },
    )

    return c.json({
      user: {
        id: expert.id,
        nome: expert.nome,
        email: expert.email,
        role: expert.role,
        avatar_url: expert.avatar_url,
      },
      tenant: {
        id: expert.tenant_id,
      },
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: tokens.expiresIn,
    })
  }

  // Tentar aluno
  const aluno = await db
    .select()
    .from(alunos)
    .where(and(eq(alunos.email, email), eq(alunos.ativo, true)))
    .get()

  if (aluno) {
    const valid = await verifyPassword(senha, aluno.senha_hash)
    if (!valid) {
      return c.json({ error: 'Credenciais inválidas.', code: 401 }, 401)
    }

    await db
      .update(alunos)
      .set({ ultimo_login: now() })
      .where(eq(alunos.id, aluno.id))

    const tokens = await generateTokens(c.env.JWT_SECRET, {
      sub: aluno.id,
      tid: aluno.tenant_id,
      role: 'aluno',
      email: aluno.email,
    })

    await c.env.KV_SESSIONS.put(
      `session:${aluno.id}`,
      JSON.stringify({
        tenant_id: aluno.tenant_id,
        role: 'aluno',
        created_at: now(),
      }),
      { expirationTtl: 7 * 24 * 60 * 60 },
    )

    return c.json({
      user: {
        id: aluno.id,
        nome: aluno.nome,
        email: aluno.email,
        role: 'aluno',
        avatar_url: aluno.avatar_url,
      },
      tenant: {
        id: aluno.tenant_id,
      },
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: tokens.expiresIn,
    })
  }

  return c.json({ error: 'Credenciais inválidas.', code: 401 }, 401)
})

// ═══════════════════════════════════════════════════════════════
// POST /auth/refresh — Renovar access token
// ═══════════════════════════════════════════════════════════════
auth.post('/refresh', zValidator('json', refreshSchema), async (c) => {
  const { refresh_token } = c.req.valid('json')

  const payload = await verifyJWT(c.env.JWT_SECRET, refresh_token)
  if (!payload || payload.type !== 'refresh') {
    return c.json({ error: 'Refresh token inválido ou expirado.', code: 401 }, 401)
  }

  // Verificar se sessão ainda existe
  const session = await c.env.KV_SESSIONS.get(`session:${payload.sub}`)
  if (!session) {
    return c.json({ error: 'Sessão expirada. Faça login novamente.', code: 401 }, 401)
  }

  // Gerar novos tokens
  const tokens = await generateTokens(c.env.JWT_SECRET, {
    sub: payload.sub,
    tid: payload.tid,
    role: payload.role,
    email: payload.email,
  })

  // Renovar sessão no KV
  await c.env.KV_SESSIONS.put(`session:${payload.sub}`, session, {
    expirationTtl: 7 * 24 * 60 * 60,
  })

  return c.json({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expires_in: tokens.expiresIn,
  })
})

// ═══════════════════════════════════════════════════════════════
// POST /auth/logout — Invalidar sessão
// ═══════════════════════════════════════════════════════════════
auth.post('/logout', authMiddleware, async (c) => {
  const userId = c.get('user_id')
  await c.env.KV_SESSIONS.delete(`session:${userId}`)
  return c.json({ message: 'Sessão encerrada.' })
})

// ═══════════════════════════════════════════════════════════════
// GET /auth/me — Dados do usuário autenticado
// ═══════════════════════════════════════════════════════════════
auth.get('/me', authMiddleware, async (c) => {
  const userId = c.get('user_id')
  const role = c.get('role')
  const db = createDB(c.env.DB)

  if (role === 'expert' || role === 'admin') {
    const expert = await db.select().from(experts).where(eq(experts.id, userId)).get()

    if (!expert) {
      return c.json({ error: 'Usuário não encontrado.', code: 404 }, 404)
    }

    const tenant = await db.select().from(tenants).where(eq(tenants.id, expert.tenant_id)).get()

    return c.json({
      user: {
        id: expert.id,
        nome: expert.nome,
        email: expert.email,
        role: expert.role,
        telefone: expert.telefone,
        avatar_url: expert.avatar_url,
        especialidade: expert.especialidade,
        cref: expert.cref,
        crn: expert.crn,
      },
      tenant: tenant
        ? {
            id: tenant.id,
            nome: tenant.nome,
            slug: tenant.slug,
            plano: tenant.plano,
            max_alunos: tenant.max_alunos,
            cor_primaria: tenant.cor_primaria,
            cor_secundaria: tenant.cor_secundaria,
            logo_url: tenant.logo_url,
          }
        : null,
    })
  }

  // Aluno
  const aluno = await db.select().from(alunos).where(eq(alunos.id, userId)).get()

  if (!aluno) {
    return c.json({ error: 'Usuário não encontrado.', code: 404 }, 404)
  }

  return c.json({
    user: {
      id: aluno.id,
      nome: aluno.nome,
      email: aluno.email,
      role: 'aluno',
      telefone: aluno.telefone,
      avatar_url: aluno.avatar_url,
      pontos: aluno.pontos,
      grupo: aluno.grupo,
    },
    tenant: {
      id: aluno.tenant_id,
    },
  })
})

// ═══════════════════════════════════════════════════════════════
// POST /auth/forgot-password — Solicitar reset de senha
// ═══════════════════════════════════════════════════════════════
const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalido.'),
})

auth.post('/forgot-password', zValidator('json', forgotPasswordSchema), async (c) => {
  const { email } = c.req.valid('json')
  const db = createDB(c.env.DB)

  // Buscar expert ou aluno
  let userId = ''
  let nome = ''
  let role: 'expert' | 'aluno' = 'expert'

  const expert = await db.select().from(experts).where(eq(experts.email, email)).get()
  if (expert) {
    userId = expert.id
    nome = expert.nome
    role = 'expert'
  } else {
    const aluno = await db.select().from(alunos).where(eq(alunos.email, email)).get()
    if (aluno) {
      userId = aluno.id
      nome = aluno.nome
      role = 'aluno'
    }
  }

  // Sempre retornar sucesso (nao revelar se email existe)
  if (!userId) {
    return c.json({ message: 'Se o email existir, voce recebera um link de recuperacao.' })
  }

  // Gerar token de reset (1 hora de validade)
  const resetToken = crypto.randomUUID().replace(/-/g, '')
  await c.env.KV_SESSIONS.put(
    `reset:${resetToken}`,
    JSON.stringify({ userId, role, email }),
    { expirationTtl: 3600 }, // 1 hora
  )

  // Enviar email via queue
  const resetLink = `https://wazefit-app.pages.dev/reset-password?token=${resetToken}`

  try {
    await c.env.QUEUE_EMAILS.send({
      type: 'reset_senha',
      to: email,
      data: { nome, link_reset: resetLink },
    })
  } catch (err) {
    console.error('Erro ao enfileirar email de reset:', err)
  }

  return c.json({ message: 'Se o email existir, voce recebera um link de recuperacao.' })
})

// ═══════════════════════════════════════════════════════════════
// POST /auth/reset-password — Redefinir senha com token
// ═══════════════════════════════════════════════════════════════
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token obrigatorio.'),
  nova_senha: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres.')
    .regex(/[A-Z]/, 'Senha deve ter pelo menos uma letra maiuscula.')
    .regex(/[0-9]/, 'Senha deve ter pelo menos um numero.'),
})

auth.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
  const { token, nova_senha } = c.req.valid('json')
  const db = createDB(c.env.DB)

  // Verificar token no KV
  const raw = await c.env.KV_SESSIONS.get(`reset:${token}`)
  if (!raw) {
    return c.json({ error: 'Token invalido ou expirado.', code: 400 }, 400)
  }

  const { userId, role } = JSON.parse(raw) as { userId: string; role: string; email: string }
  const senhaHash = await hashPassword(nova_senha)
  const timestamp = now()

  if (role === 'expert') {
    await db.update(experts).set({ senha_hash: senhaHash, atualizado_em: timestamp }).where(eq(experts.id, userId))
  } else {
    await db.update(alunos).set({ senha_hash: senhaHash, atualizado_em: timestamp }).where(eq(alunos.id, userId))
  }

  // Invalidar token
  await c.env.KV_SESSIONS.delete(`reset:${token}`)

  return c.json({ message: 'Senha alterada com sucesso.' })
})

export { auth }
