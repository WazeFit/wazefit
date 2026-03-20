/**
 * Drizzle ORM Schema — espelha 1:1 a migration 0001_schema_base.sql.
 * Qualquer alteração aqui DEVE ter migration correspondente.
 */
import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// ── Helper: timestamp padrão ISO 8601 ──
const now = sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`

// ═══════════════════════════════════════════════════════════════
// 1. TENANTS
// ═══════════════════════════════════════════════════════════════
export const tenants = sqliteTable(
  'tenants',
  {
    id: text('id').primaryKey(),
    nome: text('nome').notNull(),
    slug: text('slug').notNull(),
    email: text('email').notNull(),
    telefone: text('telefone'),
    logo_url: text('logo_url'),
    cor_primaria: text('cor_primaria').default('#22c55e'),
    cor_secundaria: text('cor_secundaria').default('#16a34a'),
    plano: text('plano', { enum: ['trial', 'starter', 'pro', 'enterprise'] })
      .notNull()
      .default('trial'),
    max_alunos: integer('max_alunos').notNull().default(10),
    ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
    criado_em: text('criado_em').notNull().default(now),
    atualizado_em: text('atualizado_em').notNull().default(now),
    deletado_em: text('deletado_em'),
  },
  (t) => [
    uniqueIndex('idx_tenants_slug').on(t.slug),
    index('idx_tenants_plano').on(t.plano),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 2. EXPERTS
// ═══════════════════════════════════════════════════════════════
export const experts = sqliteTable(
  'experts',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    email: text('email').notNull(),
    senha_hash: text('senha_hash').notNull(),
    telefone: text('telefone'),
    avatar_url: text('avatar_url'),
    especialidade: text('especialidade'),
    cref: text('cref'),
    crn: text('crn'),
    role: text('role', { enum: ['expert', 'owner'] }).notNull().default('expert'),
    ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
    ultimo_login: text('ultimo_login'),
    criado_em: text('criado_em').notNull().default(now),
    atualizado_em: text('atualizado_em').notNull().default(now),
    deletado_em: text('deletado_em'),
  },
  (t) => [
    uniqueIndex('idx_experts_email').on(t.email),
    index('idx_experts_tenant').on(t.tenant_id),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 3. ALUNOS
// ═══════════════════════════════════════════════════════════════
export const alunos = sqliteTable(
  'alunos',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    expert_id: text('expert_id').references(() => experts.id, { onDelete: 'set null' }),
    nome: text('nome').notNull(),
    email: text('email').notNull(),
    senha_hash: text('senha_hash').notNull(),
    telefone: text('telefone'),
    avatar_url: text('avatar_url'),
    data_nasc: text('data_nasc'),
    sexo: text('sexo', { enum: ['M', 'F', 'outro'] }),
    altura_cm: integer('altura_cm'),
    peso_kg: real('peso_kg'),
    objetivo: text('objetivo'),
    grupo: text('grupo').default('geral'),
    pontos: integer('pontos').notNull().default(0),
    ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
    ultimo_login: text('ultimo_login'),
    criado_em: text('criado_em').notNull().default(now),
    atualizado_em: text('atualizado_em').notNull().default(now),
    deletado_em: text('deletado_em'),
  },
  (t) => [
    uniqueIndex('idx_alunos_email_tenant').on(t.email, t.tenant_id),
    index('idx_alunos_tenant').on(t.tenant_id),
    index('idx_alunos_expert').on(t.expert_id),
    index('idx_alunos_grupo').on(t.tenant_id, t.grupo),
    index('idx_alunos_pontos').on(t.tenant_id, t.pontos),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 4. EXERCÍCIOS
// ═══════════════════════════════════════════════════════════════
export const exercicios = sqliteTable(
  'exercicios',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    grupo_muscular: text('grupo_muscular').notNull(),
    equipamento: text('equipamento'),
    instrucoes: text('instrucoes'),
    video_url: text('video_url'),
    thumbnail_url: text('thumbnail_url'),
    dificuldade: text('dificuldade', { enum: ['iniciante', 'intermediario', 'avancado'] }).default(
      'intermediario',
    ),
    criado_em: text('criado_em').notNull().default(now),
    atualizado_em: text('atualizado_em').notNull().default(now),
    deletado_em: text('deletado_em'),
  },
  (t) => [
    index('idx_exercicios_tenant').on(t.tenant_id),
    index('idx_exercicios_grupo').on(t.tenant_id, t.grupo_muscular),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 5. FICHAS DE TREINO
// ═══════════════════════════════════════════════════════════════
export const fichas = sqliteTable(
  'fichas',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    aluno_id: text('aluno_id').references(() => alunos.id, { onDelete: 'cascade' }),
    expert_id: text('expert_id')
      .notNull()
      .references(() => experts.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    tipo: text('tipo', { enum: ['A', 'B', 'C', 'D', 'E'] }).notNull().default('A'),
    objetivo: text('objetivo'),
    exercicios_json: text('exercicios').notNull().default('[]'),
    is_template: integer('is_template', { mode: 'boolean' }).notNull().default(false),
    ativa: integer('ativa', { mode: 'boolean' }).notNull().default(true),
    validade: text('validade'),
    criado_em: text('criado_em').notNull().default(now),
    atualizado_em: text('atualizado_em').notNull().default(now),
    deletado_em: text('deletado_em'),
  },
  (t) => [
    index('idx_fichas_aluno').on(t.aluno_id),
    index('idx_fichas_tenant').on(t.tenant_id),
    index('idx_fichas_template').on(t.tenant_id, t.is_template),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 6. CALENDÁRIO SEMANAL
// ═══════════════════════════════════════════════════════════════
export const calendarios = sqliteTable(
  'calendarios',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    aluno_id: text('aluno_id')
      .notNull()
      .references(() => alunos.id, { onDelete: 'cascade' }),
    dia_semana: integer('dia_semana').notNull(),
    ficha_id: text('ficha_id').references(() => fichas.id, { onDelete: 'set null' }),
    criado_em: text('criado_em').notNull().default(now),
    atualizado_em: text('atualizado_em').notNull().default(now),
  },
  (t) => [
    uniqueIndex('idx_calendarios_unico').on(t.aluno_id, t.dia_semana),
    index('idx_calendarios_tenant').on(t.tenant_id),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 7. EXECUÇÕES DE TREINO
// ═══════════════════════════════════════════════════════════════
export const execucoes = sqliteTable(
  'execucoes',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    aluno_id: text('aluno_id')
      .notNull()
      .references(() => alunos.id, { onDelete: 'cascade' }),
    ficha_id: text('ficha_id')
      .notNull()
      .references(() => fichas.id, { onDelete: 'cascade' }),
    data: text('data').notNull(),
    duracao_min: integer('duracao_min'),
    detalhes: text('detalhes').default('[]'),
    nota: text('nota'),
    pontos: integer('pontos').notNull().default(5),
    criado_em: text('criado_em').notNull().default(now),
  },
  (t) => [
    uniqueIndex('idx_execucoes_unico').on(t.aluno_id, t.data),
    index('idx_execucoes_tenant').on(t.tenant_id),
    index('idx_execucoes_aluno_data').on(t.aluno_id, t.data),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 8. MENSAGENS
// ═══════════════════════════════════════════════════════════════
export const mensagens = sqliteTable(
  'mensagens',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    remetente_id: text('remetente_id').notNull(),
    destinatario_id: text('destinatario_id').notNull(),
    remetente_tipo: text('remetente_tipo', { enum: ['expert', 'aluno'] }).notNull(),
    conteudo: text('conteudo').notNull(),
    tipo: text('tipo', { enum: ['texto', 'imagem', 'video', 'arquivo', 'audio'] })
      .notNull()
      .default('texto'),
    arquivo_url: text('arquivo_url'),
    lida: integer('lida', { mode: 'boolean' }).notNull().default(false),
    criado_em: text('criado_em').notNull().default(now),
  },
  (t) => [
    index('idx_mensagens_conversa').on(
      t.tenant_id,
      t.remetente_id,
      t.destinatario_id,
      t.criado_em,
    ),
    index('idx_mensagens_destinatario').on(t.destinatario_id, t.lida, t.criado_em),
    index('idx_mensagens_tenant').on(t.tenant_id, t.criado_em),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 9. COBRANÇAS
// ═══════════════════════════════════════════════════════════════
export const cobrancas = sqliteTable(
  'cobrancas',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    aluno_id: text('aluno_id')
      .notNull()
      .references(() => alunos.id, { onDelete: 'cascade' }),
    descricao: text('descricao').notNull(),
    valor_centavos: integer('valor_centavos').notNull(),
    status: text('status', { enum: ['pendente', 'pago', 'vencido', 'cancelado'] })
      .notNull()
      .default('pendente'),
    vencimento: text('vencimento').notNull(),
    pago_em: text('pago_em'),
    stripe_payment_id: text('stripe_payment_id'),
    stripe_link_url: text('stripe_link_url'),
    metodo_pagamento: text('metodo_pagamento'),
    criado_em: text('criado_em').notNull().default(now),
    atualizado_em: text('atualizado_em').notNull().default(now),
  },
  (t) => [
    index('idx_cobrancas_aluno').on(t.aluno_id, t.status),
    index('idx_cobrancas_tenant').on(t.tenant_id, t.status),
    index('idx_cobrancas_vencimento').on(t.tenant_id, t.vencimento),
    index('idx_cobrancas_stripe').on(t.stripe_payment_id),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 10. BRIEFINGS
// ═══════════════════════════════════════════════════════════════
export const briefings = sqliteTable(
  'briefings',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    aluno_id: text('aluno_id')
      .notNull()
      .references(() => alunos.id, { onDelete: 'cascade' }),
    perguntas: text('perguntas').notNull().default('[]'),
    status: text('status', { enum: ['pendente', 'em_andamento', 'completo', 'processando'] })
      .notNull()
      .default('pendente'),
    resultado: text('resultado'),
    criado_em: text('criado_em').notNull().default(now),
    atualizado_em: text('atualizado_em').notNull().default(now),
  },
  (t) => [
    index('idx_briefings_aluno').on(t.aluno_id),
    index('idx_briefings_tenant').on(t.tenant_id, t.status),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 11. AUDIT LOG
// ═══════════════════════════════════════════════════════════════
export const audit_log = sqliteTable(
  'audit_log',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id').notNull(),
    user_id: text('user_id').notNull(),
    user_role: text('user_role').notNull(),
    acao: text('acao').notNull(),
    entidade: text('entidade').notNull(),
    entidade_id: text('entidade_id').notNull(),
    dados: text('dados'),
    ip: text('ip'),
    criado_em: text('criado_em').notNull().default(now),
  },
  (t) => [
    index('idx_audit_tenant').on(t.tenant_id, t.criado_em),
    index('idx_audit_entidade').on(t.entidade, t.entidade_id),
    index('idx_audit_user').on(t.user_id, t.criado_em),
  ],
)