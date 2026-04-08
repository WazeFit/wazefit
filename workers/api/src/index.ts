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
import { briefingRouter } from './routes/briefing'
import { llmRouter } from './routes/llm'
import { nutricaoRouter } from './routes/nutricao'
import { avaliacoesRouter } from './routes/avaliacoes'
import { tenantRouter } from './routes/tenant'
import { domainsRouter } from './routes/domains'
import { whiteLabelRouter } from './routes/white-label'
import { pushRouter } from './routes/push'
import { periodizacaoRouter } from './routes/periodizacao'
import { adminRouter } from './routes/admin'
import { analyticsRouter } from './routes/analytics'
import { publicRouter } from './routes/public'
import { feedRouter } from './routes/feed'
import { desafiosRouter } from './routes/desafios'
import { badgesRouter } from './routes/badges'

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
// IMPORTANTE: calendarioRouter ANTES de alunosRouter — ambos em /api/v1/alunos
// calendarioRouter tem auth sem expertOnly (aluno pode ver calendário/treino)
// alunosRouter tem expertOnly global (CRUD alunos)
app.route('/api/v1/auth', auth)
app.route('/api/v1/alunos', calendarioRouter)
app.route('/api/v1/alunos', alunosRouter)
app.route('/api/v1/exercicios', exerciciosRouter)
app.route('/api/v1/fichas', fichasRouter)
app.route('/api/v1/biblioteca', bibliotecaRouter)
app.route('/api/v1/execucoes', execucoesRouter)
app.route('/api/v1/ranking', rankingRouter)
app.route('/api/v1/evolucao', evolucaoRouter)
app.route('/api/v1/chat', chatRouter)
app.route('/api/v1/media', mediaRouter)
app.route('/api/v1', financeiroRouter)
app.route('/api/v1/briefings', briefingRouter)
app.route('/api/v1/llm', llmRouter)
app.route('/api/v1/nutricao', nutricaoRouter)
app.route('/api/v1/avaliacoes', avaliacoesRouter)
app.route('/api/v1/tenant', tenantRouter)

// ── Sprint 4 Routes ──
app.route('/api/v1/tenant/domains', domainsRouter)
app.route('/api/v1/tenant/dominios', domainsRouter) // alias PT-BR para compatibilidade
app.route('/api/v1/tenant/white-label', whiteLabelRouter)
app.route('/api/v1/push', pushRouter)
app.route('/api/v1/periodizacao', periodizacaoRouter)
app.route('/api/v1/admin', adminRouter)
app.route('/api/v1/analytics', analyticsRouter)

// ── Sprint 5 - Comunidade Routes ──
app.route('/api/v1/feed', feedRouter)
app.route('/api/v1/desafios', desafiosRouter)
app.route('/api/v1/badges', badgesRouter)

// ── Public Routes (sem auth) ──
app.route('/api/v1/public', publicRouter)

// ── 404 fallback ──
app.notFound((c) => {
  return c.json({ error: 'Rota não encontrada.', code: 404 }, 404)
})

export default app
