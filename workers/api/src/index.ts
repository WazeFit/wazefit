import { Hono } from 'hono'
import type { Env, AuthVariables } from './types'
import { corsMiddleware } from './middleware/cors'
import { loggerMiddleware } from './middleware/logger'
import { errorHandler } from './middleware/error'
import { auth } from './routes/auth'
import { alunosRouter } from './routes/alunos'
import { exerciciosRouter } from './routes/exercicios'
import { fichasRouter, bibliotecaRouter } from './routes/fichas'
import { calendarioRouter } from './routes/calendario'
import { execucoesRouter, rankingRouter, evolucaoRouter } from './routes/execucoes'
import { chatRouter } from './routes/chat'
import { mediaRouter } from './routes/media'
import { financeiroRouter } from './routes/financeiro'

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
app.route('/api/v1/exercicios', exerciciosRouter)
app.route('/api/v1/fichas', fichasRouter)
app.route('/api/v1/biblioteca', bibliotecaRouter)
app.route('/api/v1/alunos', calendarioRouter)
app.route('/api/v1/execucoes', execucoesRouter)
app.route('/api/v1/ranking', rankingRouter)
app.route('/api/v1/evolucao', evolucaoRouter)
app.route('/api/v1/chat', chatRouter)
app.route('/api/v1/media', mediaRouter)
app.route('/api/v1', financeiroRouter)

// ── 404 fallback ──
app.notFound((c) => {
  return c.json({ error: 'Rota não encontrada.', code: 404 }, 404)
})

export default app
