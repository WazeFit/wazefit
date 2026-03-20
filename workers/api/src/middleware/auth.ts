/**
 * Middleware de autenticação.
 * Verifica JWT no header Authorization: Bearer <token>.
 * Injeta tenant_id, user_id, role, email no contexto Hono.
 */
import type { MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Env, AuthVariables } from '../types'
import { verifyJWT } from '../lib/jwt'

type AuthEnv = { Bindings: Env; Variables: AuthVariables }

/**
 * Middleware principal de auth.
 * Valida access_token e verifica se sessão não foi revogada no KV.
 */
export const authMiddleware: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Token de autenticação ausente.' })
  }

  const token = authHeader.slice(7)
  const payload = await verifyJWT(c.env.JWT_SECRET, token)

  if (!payload) {
    throw new HTTPException(401, { message: 'Token inválido ou expirado.' })
  }

  if (payload.type !== 'access') {
    throw new HTTPException(401, { message: 'Tipo de token inválido.' })
  }

  // Verificar se sessão não foi revogada (logout)
  const sessionKey = `session:${payload.sub}`
  const session = await c.env.KV_SESSIONS.get(sessionKey)
  if (!session) {
    throw new HTTPException(401, { message: 'Sessão expirada. Faça login novamente.' })
  }

  // Injetar variáveis no contexto
  c.set('tenant_id', payload.tid)
  c.set('user_id', payload.sub)
  c.set('role', payload.role)
  c.set('email', payload.email)

  await next()
}

/**
 * Middleware que restringe acesso apenas a experts (e owners).
 * Deve ser usado APÓS authMiddleware.
 */
export const expertOnly: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const role = c.get('role')
  if (role !== 'expert' && role !== 'admin') {
    throw new HTTPException(403, { message: 'Acesso restrito a profissionais.' })
  }
  await next()
}

/**
 * Middleware que restringe acesso apenas a admins.
 * Valida header X-Admin-Secret ao invés de JWT.
 */
export const adminOnly: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const adminSecret = c.req.header('X-Admin-Secret')
  if (!adminSecret || adminSecret !== c.env.ADMIN_SECRET) {
    throw new HTTPException(403, { message: 'Acesso restrito a administradores.' })
  }
  await next()
}
