/**
 * Rate limiting por IP usando KV.
 * Limita tentativas de login para prevenir brute force.
 */
import type { MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Env, AuthVariables } from '../types'

type RateLimitEnv = { Bindings: Env; Variables: AuthVariables }

interface RateLimitConfig {
  /** Máximo de requests no período */
  maxRequests: number
  /** Janela em segundos */
  windowSeconds: number
  /** Prefixo da chave KV */
  prefix: string
}

/**
 * Cria middleware de rate limiting.
 * Usa KV com TTL automático para expiração da janela.
 */
export function rateLimit(config: RateLimitConfig): MiddlewareHandler<RateLimitEnv> {
  return async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
    const key = `ratelimit:${config.prefix}:${ip}`

    // Buscar contagem atual
    const current = await c.env.KV_SESSIONS.get(key)
    const count = current ? parseInt(current, 10) : 0

    if (count >= config.maxRequests) {
      throw new HTTPException(429, {
        message: `Muitas tentativas. Aguarde ${config.windowSeconds} segundos.`,
      })
    }

    // Incrementar contador com TTL
    await c.env.KV_SESSIONS.put(key, String(count + 1), {
      expirationTtl: config.windowSeconds,
    })

    // Header informativo
    c.header('X-RateLimit-Limit', String(config.maxRequests))
    c.header('X-RateLimit-Remaining', String(config.maxRequests - count - 1))

    await next()
  }
}

/**
 * Rate limit para login: 5 tentativas por minuto por IP.
 */
export const loginRateLimit = rateLimit({
  maxRequests: 5,
  windowSeconds: 60,
  prefix: 'login',
})

/**
 * Rate limit para registro: 10 tentativas por hora por IP.
 */
export const registerRateLimit = rateLimit({
  maxRequests: 10,
  windowSeconds: 3600,
  prefix: 'register',
})
