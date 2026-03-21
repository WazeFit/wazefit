/**
 * Rotas de execuções de treino (check-in).
 * Histórico, ranking e evolução do aluno.
 *
 * POST /api/v1/execucoes            — Check-in (aluno confirma treino)
 * GET  /api/v1/execucoes            — Histórico (filtro: data_inicio, data_fim, aluno_id)
 * GET  /api/v1/ranking              — Top 50 alunos por pontos
 * GET  /api/v1/evolucao/:aluno_id   — Dados para gráficos de evolução
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc, isNull, sql, gte, lte } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { execucoes, alunos, fichas } from '../db/schema'
import { generateId, now } from '../lib/id'
import { authMiddleware, expertOnly } from '../middleware/auth'

const execucoesRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

execucoesRouter.use('*', authMiddleware, expertOnly)

// ── Schemas de validação ──

const createExecucaoSchema = z.object({
  aluno_id: z.string().uuid('ID do aluno inválido.'),
  ficha_id: z.string().uuid('ID da ficha inválido.'),
  data: z.string().min(10, 'Data é obrigatória (YYYY-MM-DD).'),
  duracao_min: z.number().int().min(1).optional(),
  detalhes: z.string().default('[]'),
  nota: z.string().optional(),
  pontos: z.number().int().min(0).default(5),
})

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  aluno_id: z.string().optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
})

const evolucaoQuerySchema = z.object({
  dias: z.coerce.number().int().min(7).max(365).default(30),
})

// ═══════════════════════════════════════════════════════════════
// POST /execucoes — Check-in de treino
// ═══════════════════════════════════════════════════════════════
execucoesRouter.post('/', zValidator('json', createExecucaoSchema), async (c) => {
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  // Verificar aluno pertence ao tenant
  const aluno = await db
    .select({ id: alunos.id, pontos: alunos.pontos })
    .from(alunos)
    .where(
      and(eq(alunos.id, body.aluno_id), eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em)),
    )
    .get()

  if (!aluno) {
    return c.json({ error: 'Aluno não encontrado.', code: 404 }, 404)
  }

  // Verificar ficha pertence ao tenant
  const ficha = await db
    .select({ id: fichas.id, nome: fichas.nome })
    .from(fichas)
    .where(
      and(eq(fichas.id, body.ficha_id), eq(fichas.tenant_id, tenantId), isNull(fichas.deletado_em)),
    )
    .get()

  if (!ficha) {
    return c.json({ error: 'Ficha não encontrada.', code: 404 }, 404)
  }

  // Verificar se já existe execução para o aluno nessa data
  const existing = await db
    .select({ id: execucoes.id })
    .from(execucoes)
    .where(
      and(eq(execucoes.aluno_id, body.aluno_id), eq(execucoes.data, body.data)),
    )
    .get()

  if (existing) {
    return c.json({ error: 'Já existe um check-in para este aluno nesta data.', code: 409 }, 409)
  }

  const id = generateId()
  const timestamp = now()

  await db.insert(execucoes).values({
    id,
    tenant_id: tenantId,
    aluno_id: body.aluno_id,
    ficha_id: body.ficha_id,
    data: body.data,
    duracao_min: body.duracao_min ?? null,
    detalhes: body.detalhes,
    nota: body.nota ?? null,
    pontos: body.pontos,
    criado_em: timestamp,
  })

  // Somar pontos no aluno
  const novosPontos = (aluno.pontos ?? 0) + body.pontos
  await db
    .update(alunos)
    .set({ pontos: novosPontos, atualizado_em: now() })
    .where(eq(alunos.id, body.aluno_id))

  return c.json(
    {
      id,
      aluno_id: body.aluno_id,
      ficha_id: body.ficha_id,
      ficha_nome: ficha.nome,
      data: body.data,
      pontos: body.pontos,
      pontos_total: novosPontos,
      criado_em: timestamp,
    },
    201,
  )
})

// ═══════════════════════════════════════════════════════════════
// GET /execucoes — Histórico com filtros e paginação
// ═══════════════════════════════════════════════════════════════
execucoesRouter.get('/', zValidator('query', listQuerySchema), async (c) => {
  const { page, limit, aluno_id, data_inicio, data_fim } = c.req.valid('query')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const offset = (page - 1) * limit

  const conditions = [eq(execucoes.tenant_id, tenantId)]

  if (aluno_id) {
    conditions.push(eq(execucoes.aluno_id, aluno_id))
  }
  if (data_inicio) {
    conditions.push(gte(execucoes.data, data_inicio))
  }
  if (data_fim) {
    conditions.push(lte(execucoes.data, data_fim))
  }

  const where = and(...conditions)

  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(execucoes)
    .where(where)
    .get()

  const total = countResult?.count ?? 0

  const data = await db
    .select({
      id: execucoes.id,
      aluno_id: execucoes.aluno_id,
      aluno_nome: alunos.nome,
      ficha_id: execucoes.ficha_id,
      ficha_nome: fichas.nome,
      data: execucoes.data,
      duracao_min: execucoes.duracao_min,
      detalhes: execucoes.detalhes,
      nota: execucoes.nota,
      pontos: execucoes.pontos,
      criado_em: execucoes.criado_em,
    })
    .from(execucoes)
    .leftJoin(alunos, eq(execucoes.aluno_id, alunos.id))
    .leftJoin(fichas, eq(execucoes.ficha_id, fichas.id))
    .where(where)
    .orderBy(desc(execucoes.data))
    .limit(limit)
    .offset(offset)

  return c.json({
    data,
    meta: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  })
})

// ═══════════════════════════════════════════════════════════════
// GET /ranking — Top 50 alunos por pontos do tenant (standalone)
// ═══════════════════════════════════════════════════════════════
const rankingRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()
rankingRouter.use('*', authMiddleware) // Alunos e experts podem ver o ranking

rankingRouter.get('/', async (c) => {
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const ranking = await db
    .select({
      id: alunos.id,
      nome: alunos.nome,
      avatar_url: alunos.avatar_url,
      pontos: alunos.pontos,
      grupo: alunos.grupo,
    })
    .from(alunos)
    .where(
      and(eq(alunos.tenant_id, tenantId), eq(alunos.ativo, true), isNull(alunos.deletado_em)),
    )
    .orderBy(desc(alunos.pontos))
    .limit(50)

  return c.json({
    data: ranking.map((a, i) => ({ ...a, posicao: i + 1 })),
  })
})

// ═══════════════════════════════════════════════════════════════
// GET /evolucao/:aluno_id — Dados para gráficos de evolução (standalone)
// ═══════════════════════════════════════════════════════════════
const evolucaoRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()
evolucaoRouter.use('*', authMiddleware, expertOnly)

evolucaoRouter.get('/:aluno_id', zValidator('query', evolucaoQuerySchema), async (c) => {
  const { aluno_id } = c.req.param()
  const { dias } = c.req.valid('query')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  // Verificar aluno pertence ao tenant
  const aluno = await db
    .select({ id: alunos.id, nome: alunos.nome })
    .from(alunos)
    .where(
      and(eq(alunos.id, aluno_id), eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em)),
    )
    .get()

  if (!aluno) {
    return c.json({ error: 'Aluno não encontrado.', code: 404 }, 404)
  }

  const dataInicio = new Date()
  dataInicio.setDate(dataInicio.getDate() - dias)
  const dataInicioStr = dataInicio.toISOString().split('T')[0]

  // Buscar execuções do período
  const execs = await db
    .select({
      data: execucoes.data,
      ficha_id: execucoes.ficha_id,
      ficha_nome: fichas.nome,
      ficha_tipo: fichas.tipo,
      duracao_min: execucoes.duracao_min,
      pontos: execucoes.pontos,
      detalhes: execucoes.detalhes,
    })
    .from(execucoes)
    .leftJoin(fichas, eq(execucoes.ficha_id, fichas.id))
    .where(
      and(
        eq(execucoes.tenant_id, tenantId),
        eq(execucoes.aluno_id, aluno_id),
        gte(execucoes.data, dataInicioStr),
      ),
    )
    .orderBy(execucoes.data)

  // Agrupar por ficha
  const porFicha: Record<string, { ficha_nome: string | null; ficha_tipo: string | null; execucoes: typeof execs }> = {}
  for (const exec of execs) {
    const key = exec.ficha_id
    if (!porFicha[key]) {
      porFicha[key] = {
        ficha_nome: exec.ficha_nome,
        ficha_tipo: exec.ficha_tipo,
        execucoes: [],
      }
    }
    porFicha[key].execucoes.push(exec)
  }

  // Resumo
  const totalTreinos = execs.length
  const totalPontos = execs.reduce((sum, e) => sum + (e.pontos ?? 0), 0)
  const totalDuracao = execs.reduce((sum, e) => sum + (e.duracao_min ?? 0), 0)

  return c.json({
    aluno_id,
    aluno_nome: aluno.nome,
    periodo_dias: dias,
    resumo: {
      total_treinos: totalTreinos,
      total_pontos: totalPontos,
      total_duracao_min: totalDuracao,
      media_duracao_min: totalTreinos > 0 ? Math.round(totalDuracao / totalTreinos) : 0,
    },
    por_ficha: Object.entries(porFicha).map(([fichaId, info]) => ({
      ficha_id: fichaId,
      ficha_nome: info.ficha_nome,
      ficha_tipo: info.ficha_tipo,
      total: info.execucoes.length,
      datas: info.execucoes.map((e) => ({
        data: e.data,
        duracao_min: e.duracao_min,
        pontos: e.pontos,
      })),
    })),
    timeline: execs.map((e) => ({
      data: e.data,
      ficha_nome: e.ficha_nome,
      duracao_min: e.duracao_min,
      pontos: e.pontos,
    })),
  })
})

export { execucoesRouter, rankingRouter, evolucaoRouter }
