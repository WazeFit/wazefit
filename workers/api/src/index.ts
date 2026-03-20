import { Hono } from 'hono'
import type { Env, AuthVariables } from './types'
import { corsMiddleware } from './middleware/cors'
import { loggerMiddleware } from './middleware/logger'
import { errorHandler } from './middleware/error'
import { auth } from './routes/auth'
import { alunosRouter } from './routes/alunos'

// ── App principal ──
const app = new Hono<{
  Bindings: Env
  Variables: AuthVariables
}>()

// ── Middleware global ──
app.use('*', corsMiddleware)
app.use('*', loggerMiddleware)
app.onError(errorHandler)

// ── Health check ──
app.get('/ping', (c) => {
  return c.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: c.env?.ENVIRONMENT || 'development',
  })
})

// ── Rotas da API ──
app.route('/api/v1/auth', auth)
app.route('/api/v1/alunos', alunosRouter)
// app.route('/api/v1/exercicios', exerciciosRoutes)
// app.route('/api/v1/fichas', fichasRoutes)
// app.route('/api/v1/execucoes', execucoesRoutes)
// app.route('/api/v1/chat', chatRoutes)
// app.route('/api/v1/financeiro', financeiroRoutes)
// app.route('/api/v1/media', mediaRoutes)
// app.route('/api/v1/briefing', briefingRoutes)
// app.route('/api/v1/llm', llmRoutes)
// app.route('/api/v1/nutricao', nutricaoRoutes)
// app.route('/api/v1/avaliacoes', avaliacoesRoutes)
// app.route('/api/v1/tenant', tenantRoutes)
// app.route('/api/v1/dominio', dominioRoutes)
// app.route('/api/v1/push', pushRoutes)
// app.route('/api/v1/periodizacao', periodizacaoRoutes)
// app.route('/api/v1/analytics', analyticsRoutes)
// app.route('/admin', adminRoutes)

// ── 404 fallback ──
app.notFound((c) => {
  return c.json({ error: 'Rota não encontrada.', code: 404 }, 404)
})

export default app
