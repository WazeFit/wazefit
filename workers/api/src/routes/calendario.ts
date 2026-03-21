/**
 * Rotas de calendário semanal de treinos.
 * Gerencia a programação semanal de fichas para cada aluno.
 *
 * PUT  /api/v1/alunos/:aluno_id/calendario   — Salvar calendário semanal
 * GET  /api/v1/alunos/:aluno_id/calendario   — Retornar calendário com fichas populadas
 * GET  /api/v1/alunos/:aluno_id/treino-hoje  — Retornar ficha do dia
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, isNull } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { calendarios, fichas, alunos } from '../db/schema'
import { generateId, now } from '../lib/id'
import { authMiddleware, expertOnly } from '../middleware/auth'

const calendarioRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

// Auth para todas as rotas; expertOnly aplicado apenas no PUT (salvar)
calendarioRouter.use('*', authMiddleware)

// ── Schemas de validação ──

const calendarioItemSchema = z.object({
  dia_semana: z.number().int().min(0).max(6), // 0=domingo, 6=sábado
  ficha_id: z.string().uuid().nullable(),
})

const saveCalendarioSchema = z.object({
  calendario: z.array(calendarioItemSchema).min(1).max(7),
})

// ═══════════════════════════════════════════════════════════════
// PUT /alunos/:aluno_id/calendario — Salvar calendário semanal
// ═══════════════════════════════════════════════════════════════
calendarioRouter.put('/:aluno_id/calendario', expertOnly, zValidator('json', saveCalendarioSchema), async (c) => {
  const { aluno_id } = c.req.param()
  const { calendario } = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  // Verificar aluno pertence ao tenant
  const aluno = await db
    .select({ id: alunos.id })
    .from(alunos)
    .where(
      and(eq(alunos.id, aluno_id), eq(alunos.tenant_id, tenantId), isNull(alunos.deletado_em)),
    )
    .get()

  if (!aluno) {
    return c.json({ error: 'Aluno não encontrado.', code: 404 }, 404)
  }

  // Verificar que todas as fichas existem no tenant
  for (const item of calendario) {
    if (item.ficha_id) {
      const ficha = await db
        .select({ id: fichas.id })
        .from(fichas)
        .where(
          and(eq(fichas.id, item.ficha_id), eq(fichas.tenant_id, tenantId), isNull(fichas.deletado_em)),
        )
        .get()

      if (!ficha) {
        return c.json({ error: `Ficha ${item.ficha_id} não encontrada.`, code: 404 }, 404)
      }
    }
  }

  const timestamp = now()

  // Deletar calendário existente do aluno
  await db
    .delete(calendarios)
    .where(and(eq(calendarios.aluno_id, aluno_id), eq(calendarios.tenant_id, tenantId)))

  // Inserir novo calendário
  for (const item of calendario) {
    await db.insert(calendarios).values({
      id: generateId(),
      tenant_id: tenantId,
      aluno_id,
      dia_semana: item.dia_semana,
      ficha_id: item.ficha_id,
      criado_em: timestamp,
      atualizado_em: timestamp,
    })
  }

  return c.json({ message: 'Calendário salvo.', total: calendario.length })
})

// ═══════════════════════════════════════════════════════════════
// GET /alunos/:aluno_id/calendario — Retornar calendário com fichas
// ═══════════════════════════════════════════════════════════════
calendarioRouter.get('/:aluno_id/calendario', async (c) => {
  const { aluno_id } = c.req.param()
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

  // Buscar calendário com LEFT JOIN nas fichas
  const items = await db
    .select({
      id: calendarios.id,
      dia_semana: calendarios.dia_semana,
      ficha_id: calendarios.ficha_id,
      ficha_nome: fichas.nome,
      ficha_tipo: fichas.tipo,
      ficha_objetivo: fichas.objetivo,
      ficha_exercicios: fichas.exercicios_json,
    })
    .from(calendarios)
    .leftJoin(fichas, eq(calendarios.ficha_id, fichas.id))
    .where(and(eq(calendarios.aluno_id, aluno_id), eq(calendarios.tenant_id, tenantId)))
    .orderBy(calendarios.dia_semana)

  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

  const data = items.map((item) => ({
    dia_semana: item.dia_semana,
    dia_nome: diasSemana[item.dia_semana],
    ficha: item.ficha_id
      ? {
          id: item.ficha_id,
          nome: item.ficha_nome,
          tipo: item.ficha_tipo,
          objetivo: item.ficha_objetivo,
          exercicios_json: item.ficha_exercicios,
        }
      : null,
  }))

  return c.json({ aluno_id, aluno_nome: aluno.nome, data })
})

// ═══════════════════════════════════════════════════════════════
// GET /alunos/:aluno_id/treino-hoje — Ficha do dia
// ═══════════════════════════════════════════════════════════════
calendarioRouter.get('/:aluno_id/treino-hoje', async (c) => {
  const { aluno_id } = c.req.param()
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

  const hoje = new Date().getDay() // 0=domingo, 6=sábado

  const item = await db
    .select({
      ficha_id: calendarios.ficha_id,
      ficha_nome: fichas.nome,
      ficha_tipo: fichas.tipo,
      ficha_objetivo: fichas.objetivo,
      ficha_exercicios: fichas.exercicios_json,
      ficha_ativa: fichas.ativa,
    })
    .from(calendarios)
    .leftJoin(fichas, eq(calendarios.ficha_id, fichas.id))
    .where(
      and(
        eq(calendarios.aluno_id, aluno_id),
        eq(calendarios.tenant_id, tenantId),
        eq(calendarios.dia_semana, hoje),
      ),
    )
    .get()

  if (!item || !item.ficha_id) {
    return c.json({
      aluno_id,
      aluno_nome: aluno.nome,
      dia_semana: hoje,
      ficha: null,
      mensagem: 'Nenhum treino programado para hoje.',
    })
  }

  return c.json({
    aluno_id,
    aluno_nome: aluno.nome,
    dia_semana: hoje,
    ficha: {
      id: item.ficha_id,
      nome: item.ficha_nome,
      tipo: item.ficha_tipo,
      objetivo: item.ficha_objetivo,
      exercicios_json: item.ficha_exercicios,
      ativa: item.ficha_ativa,
    },
  })
})

export { calendarioRouter }
