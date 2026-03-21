/**
 * WF-406 — Analytics per Tenant
 * 
 * POST /api/v1/analytics/evento       — Track event
 * GET  /api/v1/analytics/dashboard    — Expert dashboard data
 * GET  /api/v1/analytics/aluno/:id    — Individual aluno analytics
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, sql, desc, isNull } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { analyticsEventos, alunos, execucoes, cobrancas } from '../db/schema'
import { generateId, now } from '../lib/id'
import { authMiddleware, expertOnly } from '../middleware/auth'

const analyticsRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

analyticsRouter.use('*', authMiddleware)

// ── Schemas ──

const trackEventSchema = z.object({
  tipo: z.string(),
  dados_json: z.record(z.unknown()).optional().default({}),
})

// ═══════════════════════════════════════════════════════════════
// POST /analytics/evento — Track event
// ═══════════════════════════════════════════════════════════════
analyticsRouter.post('/evento', zValidator('json', trackEventSchema), async (c) => {
  const { tipo, dados_json } = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const id = generateId()

  await db.insert(analyticsEventos).values({
    id,
    tenant_id: tenantId,
    tipo,
    dados_json: JSON.stringify(dados_json),
    criado_em: now(),
  })

  return c.json({ id, message: 'Evento registrado.' }, 201)
})

// ═══════════════════════════════════════════════════════════════
// GET /analytics/dashboard — Expert dashboard data
// ═══════════════════════════════════════════════════════════════
analyticsRouter.get('/dashboard', expertOnly, async (c) => {
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  // 1. Alunos ativos (treino nos últimos 7 dias)
  const alunosAtivos = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${execucoes.aluno_id})` })
    .from(execucoes)
    .where(
      sql`${execucoes.tenant_id} = ${tenantId} AND DATE(${execucoes.data}) >= DATE('now', '-7 days')`,
    )
    .get()

  // 2. Treinos na semana atual
  const treinosSemana = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(execucoes)
    .where(
      sql`${execucoes.tenant_id} = ${tenantId} AND strftime('%Y-%W', ${execucoes.data}) = strftime('%Y-%W', 'now')`,
    )
    .get()

  // 3. Taxa de aderência (% alunos que treinaram nos últimos 7 dias)
  const totalAlunos = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(alunos)
    .where(and(eq(alunos.tenant_id, tenantId), eq(alunos.ativo, true), isNull(alunos.deletado_em)))
    .get()

  const taxaAderencia =
    (totalAlunos?.count ?? 0) > 0
      ? ((alunosAtivos?.count ?? 0) / (totalAlunos?.count ?? 1)) * 100
      : 0

  // 4. Receita do mês (cobranças pagas)
  const receitaMes = await db
    .select({ total: sql<number>`COALESCE(SUM(valor_centavos), 0)` })
    .from(cobrancas)
    .where(
      sql`${cobrancas.tenant_id} = ${tenantId} AND ${cobrancas.status} = 'pago' AND strftime('%Y-%m', ${cobrancas.pago_em}) = strftime('%Y-%m', 'now')`,
    )
    .get()

  // 5. Ranking top 5 (por pontos)
  const rankingTop5 = await db
    .select({
      id: alunos.id,
      nome: alunos.nome,
      avatar_url: alunos.avatar_url,
      pontos: alunos.pontos,
    })
    .from(alunos)
    .where(and(eq(alunos.tenant_id, tenantId), eq(alunos.ativo, true), isNull(alunos.deletado_em)))
    .orderBy(desc(alunos.pontos))
    .limit(5)

  // 6. Evolução 30 dias (treinos por dia)
  const evolucao30d = await db
    .select({
      data: sql<string>`DATE(${execucoes.data})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(execucoes)
    .where(
      sql`${execucoes.tenant_id} = ${tenantId} AND DATE(${execucoes.data}) >= DATE('now', '-30 days')`,
    )
    .groupBy(sql`DATE(${execucoes.data})`)
    .orderBy(sql`DATE(${execucoes.data})`)
    .all()

  return c.json({
    alunos_ativos: alunosAtivos?.count ?? 0,
    treinos_semana: treinosSemana?.count ?? 0,
    taxa_aderencia: Math.round(taxaAderencia * 10) / 10,
    receita_mes_centavos: receitaMes?.total ?? 0,
    ranking_top5: rankingTop5,
    evolucao_30d: evolucao30d,
  })
})

// ═══════════════════════════════════════════════════════════════
// GET /analytics/aluno/:id — Individual aluno analytics
// ═══════════════════════════════════════════════════════════════
analyticsRouter.get('/aluno/:id', expertOnly, async (c) => {
  const { id } = c.req.param()
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  // Verificar se aluno existe no tenant
  const aluno = await db
    .select({ id: alunos.id, nome: alunos.nome, pontos: alunos.pontos })
    .from(alunos)
    .where(and(eq(alunos.id, id), eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em)))
    .get()

  if (!aluno) {
    return c.json({ error: 'Aluno não encontrado.', code: 404 }, 404)
  }

  // 1. Total de treinos
  const totalTreinos = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(execucoes)
    .where(eq(execucoes.aluno_id, id))
    .get()

  // 2. Treinos nos últimos 30 dias
  const treinos30d = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(execucoes)
    .where(sql`${execucoes.aluno_id} = ${id} AND DATE(${execucoes.data}) >= DATE('now', '-30 days')`)
    .get()

  // 3. Sequência atual (dias consecutivos)
  const sequenciaAtual = await db
    .select({
      data: execucoes.data,
    })
    .from(execucoes)
    .where(eq(execucoes.aluno_id, id))
    .orderBy(desc(execucoes.data))
    .limit(30)
    .all()

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  for (const exec of sequenciaAtual) {
    const execDate = new Date(exec.data)
    execDate.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((currentDate.getTime() - execDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === streak) {
      streak++
    } else {
      break
    }
  }

  // 4. Evolução semanal (últimas 12 semanas)
  const evolucaoSemanal = await db
    .select({
      semana: sql<string>`strftime('%Y-%W', ${execucoes.data})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(execucoes)
    .where(sql`${execucoes.aluno_id} = ${id} AND DATE(${execucoes.data}) >= DATE('now', '-84 days')`)
    .groupBy(sql`strftime('%Y-%W', ${execucoes.data})`)
    .orderBy(sql`strftime('%Y-%W', ${execucoes.data})`)
    .all()

  // 5. Duração média dos treinos
  const duracaoMedia = await db
    .select({ media: sql<number>`AVG(${execucoes.duracao_min})` })
    .from(execucoes)
    .where(and(eq(execucoes.aluno_id, id), sql`${execucoes.duracao_min} IS NOT NULL`))
    .get()

  return c.json({
    aluno: {
      id: aluno.id,
      nome: aluno.nome,
      pontos: aluno.pontos,
    },
    stats: {
      total_treinos: totalTreinos?.count ?? 0,
      treinos_30d: treinos30d?.count ?? 0,
      sequencia_atual: streak,
      duracao_media_min: Math.round(duracaoMedia?.media ?? 0),
    },
    evolucao_semanal: evolucaoSemanal,
  })
})

export { analyticsRouter }
