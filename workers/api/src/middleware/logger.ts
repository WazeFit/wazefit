import type { MiddlewareHandler } from 'hono'

/**
 * Middleware de logging — registra método, path, status e duração.
 */
export const loggerMiddleware: MiddlewareHandler = async (c, next) => {
  const start = Date.now()
  const method = c.req.method
  const path = new URL(c.req.url).pathname

  await next()

  const duration = Date.now() - start
  const status = c.res.status

  // Log no formato: [GET] /api/v1/alunos → 200 (12ms)
  console.log(`[${method}] ${path} → ${status} (${duration}ms)`)
}
