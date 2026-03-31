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
    tipo_exercicio: text('tipo_exercicio', { enum: ['forca', 'aerobico', 'funcional'] }).default('forca'),
    subtipo: text('subtipo'),
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
// 12. PLANOS NUTRICIONAIS
// ═══════════════════════════════════════════════════════════════
export const planosNutricionais = sqliteTable(
  'planos_nutricionais',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    aluno_id: text('aluno_id')
      .notNull()
      .references(() => alunos.id, { onDelete: 'cascade' }),
    expert_id: text('expert_id')
      .notNull()
      .references(() => experts.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    objetivo: text('objetivo'),
    calorias_diarias: integer('calorias_diarias'),
    proteina_g: real('proteina_g'),
    carboidrato_g: real('carboidrato_g'),
    gordura_g: real('gordura_g'),
    observacoes: text('observacoes'),
    ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
    criado_em: text('criado_em').notNull().default(now),
    atualizado_em: text('atualizado_em').notNull().default(now),
    deletado_em: text('deletado_em'),
  },
  (t) => [
    index('idx_planos_nutricionais_tenant').on(t.tenant_id),
    index('idx_planos_nutricionais_aluno').on(t.aluno_id),
    index('idx_planos_nutricionais_expert').on(t.expert_id),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 13. REFEIÇÕES
// ═══════════════════════════════════════════════════════════════
export const refeicoes = sqliteTable(
  'refeicoes',
  {
    id: text('id').primaryKey(),
    plano_id: text('plano_id')
      .notNull()
      .references(() => planosNutricionais.id, { onDelete: 'cascade' }),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    horario: text('horario'),
    ordem: integer('ordem').notNull().default(0),
    criado_em: text('criado_em').notNull().default(now),
  },
  (t) => [
    index('idx_refeicoes_plano').on(t.plano_id),
    index('idx_refeicoes_tenant').on(t.tenant_id),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 14. ALIMENTOS DA REFEIÇÃO
// ═══════════════════════════════════════════════════════════════
export const alimentosRefeicao = sqliteTable(
  'alimentos_refeicao',
  {
    id: text('id').primaryKey(),
    refeicao_id: text('refeicao_id')
      .notNull()
      .references(() => refeicoes.id, { onDelete: 'cascade' }),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    quantidade: real('quantidade').notNull(),
    unidade: text('unidade').notNull(),
    calorias: real('calorias'),
    proteina_g: real('proteina_g'),
    carboidrato_g: real('carboidrato_g'),
    gordura_g: real('gordura_g'),
    observacao: text('observacao'),
  },
  (t) => [
    index('idx_alimentos_refeicao').on(t.refeicao_id),
    index('idx_alimentos_tenant').on(t.tenant_id),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 15. AVALIAÇÕES
// ═══════════════════════════════════════════════════════════════
export const avaliacoes = sqliteTable(
  'avaliacoes',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    aluno_id: text('aluno_id')
      .notNull()
      .references(() => alunos.id, { onDelete: 'cascade' }),
    expert_id: text('expert_id')
      .notNull()
      .references(() => experts.id, { onDelete: 'cascade' }),
    tipo: text('tipo', { enum: ['anamnese', 'fisica', 'bioimpedancia'] }).notNull(),
    data: text('data').notNull(),
    dados_json: text('dados_json').notNull().default('{}'),
    observacoes: text('observacoes'),
    criado_em: text('criado_em').notNull().default(now),
    atualizado_em: text('atualizado_em').notNull().default(now),
    deletado_em: text('deletado_em'),
  },
  (t) => [
    index('idx_avaliacoes_tenant').on(t.tenant_id),
    index('idx_avaliacoes_aluno').on(t.aluno_id),
    index('idx_avaliacoes_tipo').on(t.tenant_id, t.tipo),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 16. BRIEFING PERGUNTAS
// ═══════════════════════════════════════════════════════════════
export const briefingPerguntas = sqliteTable(
  'briefing_perguntas',
  {
    id: text('id').primaryKey(),
    briefing_id: text('briefing_id')
      .notNull()
      .references(() => briefings.id, { onDelete: 'cascade' }),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    pergunta: text('pergunta').notNull(),
    resposta: text('resposta'),
    ordem: integer('ordem').notNull().default(0),
    criado_em: text('criado_em').notNull().default(now),
  },
  (t) => [
    index('idx_briefing_perguntas_briefing').on(t.briefing_id),
    index('idx_briefing_perguntas_tenant').on(t.tenant_id),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 17. LLM JOBS
// ═══════════════════════════════════════════════════════════════
export const llmJobs = sqliteTable(
  'llm_jobs',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    tipo: text('tipo', { enum: ['briefing', 'treino', 'dieta', 'avaliacao'] }).notNull(),
    input_json: text('input_json').notNull().default('{}'),
    output_json: text('output_json'),
    status: text('status', { enum: ['pending', 'processing', 'completed', 'failed'] })
      .notNull()
      .default('pending'),
    tokens_input: integer('tokens_input'),
    tokens_output: integer('tokens_output'),
    custo_centavos: integer('custo_centavos'),
    erro: text('erro'),
    criado_em: text('criado_em').notNull().default(now),
    completado_em: text('completado_em'),
  },
  (t) => [
    index('idx_llm_jobs_tenant').on(t.tenant_id, t.status),
    index('idx_llm_jobs_status').on(t.status, t.criado_em),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 18. TENANT CONFIG (white label)
// ═══════════════════════════════════════════════════════════════
export const tenantConfig = sqliteTable(
  'tenant_config',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    chave: text('chave').notNull(),
    valor: text('valor'),
    criado_em: text('criado_em').notNull().default(now),
    atualizado_em: text('atualizado_em').notNull().default(now),
  },
  (t) => [
    uniqueIndex('idx_tenant_config_unico').on(t.tenant_id, t.chave),
    index('idx_tenant_config_tenant').on(t.tenant_id),
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

// ═══════════════════════════════════════════════════════════════
// 19. DOMÍNIOS TENANT (Sprint 4)
// ═══════════════════════════════════════════════════════════════
export const dominiosTenant = sqliteTable(
  'dominios_tenant',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    dominio: text('dominio').notNull(),
    status: text('status', { enum: ['pending', 'active', 'failed'] })
      .notNull()
      .default('pending'),
    verificado_em: text('verificado_em'),
    ssl_status: text('ssl_status', { enum: ['pending', 'active', 'failed'] }).default('pending'),
    cloudflare_dns_id: text('cloudflare_dns_id'), // ID do DNS record no Cloudflare
    criado_em: text('criado_em').notNull().default(now),
    atualizado_em: text('atualizado_em').notNull().default(now),
    deletado_em: text('deletado_em'),
  },
  (t) => [
    uniqueIndex('idx_dominios_dominio').on(t.dominio),
    index('idx_dominios_tenant').on(t.tenant_id, t.status),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 20. PUSH SUBSCRIPTIONS (Sprint 4)
// ═══════════════════════════════════════════════════════════════
export const pushSubscriptions = sqliteTable(
  'push_subscriptions',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    user_id: text('user_id').notNull(),
    user_tipo: text('user_tipo', { enum: ['expert', 'aluno'] }).notNull(),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    criado_em: text('criado_em').notNull().default(now),
  },
  (t) => [
    uniqueIndex('idx_push_endpoint').on(t.endpoint),
    index('idx_push_user').on(t.tenant_id, t.user_id),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 21. NOTIFICAÇÕES (Sprint 4)
// ═══════════════════════════════════════════════════════════════
export const notificacoes = sqliteTable(
  'notificacoes',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    user_id: text('user_id').notNull(),
    tipo: text('tipo', { enum: ['treino', 'cobranca', 'mensagem', 'sistema'] }).notNull(),
    titulo: text('titulo').notNull(),
    corpo: text('corpo').notNull(),
    lida: integer('lida', { mode: 'boolean' }).notNull().default(false),
    criado_em: text('criado_em').notNull().default(now),
  },
  (t) => [
    index('idx_notificacoes_user').on(t.tenant_id, t.user_id, t.lida, t.criado_em),
    index('idx_notificacoes_tipo').on(t.tenant_id, t.tipo, t.criado_em),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 22. PERIODIZAÇÕES (Sprint 4)
// ═══════════════════════════════════════════════════════════════
export const periodizacoes = sqliteTable(
  'periodizacoes',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    aluno_id: text('aluno_id')
      .notNull()
      .references(() => alunos.id, { onDelete: 'cascade' }),
    expert_id: text('expert_id')
      .notNull()
      .references(() => experts.id, { onDelete: 'cascade' }),
    tipo: text('tipo', { enum: ['linear', 'ondulada', 'bloco', 'dup'] }).notNull(),
    duracao_semanas: integer('duracao_semanas').notNull(),
    fase_atual: integer('fase_atual').notNull().default(1),
    config_json: text('config_json').notNull().default('{}'),
    gerado_por_ia: integer('gerado_por_ia', { mode: 'boolean' }).notNull().default(false),
    criado_em: text('criado_em').notNull().default(now),
    atualizado_em: text('atualizado_em').notNull().default(now),
    deletado_em: text('deletado_em'),
  },
  (t) => [
    index('idx_periodizacoes_tenant').on(t.tenant_id),
    index('idx_periodizacoes_aluno').on(t.aluno_id),
    index('idx_periodizacoes_expert').on(t.expert_id),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 23. ADMIN LOGS (Sprint 4)
// ═══════════════════════════════════════════════════════════════
export const adminLogs = sqliteTable(
  'admin_logs',
  {
    id: text('id').primaryKey(),
    admin_id: text('admin_id').notNull(),
    acao: text('acao').notNull(),
    entidade: text('entidade').notNull(),
    entidade_id: text('entidade_id').notNull(),
    detalhes_json: text('detalhes_json'),
    ip: text('ip'),
    criado_em: text('criado_em').notNull().default(now),
  },
  (t) => [
    index('idx_admin_logs_admin').on(t.admin_id, t.criado_em),
    index('idx_admin_logs_entidade').on(t.entidade, t.entidade_id),
    index('idx_admin_logs_criado').on(t.criado_em),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 24. ANALYTICS EVENTOS (Sprint 4)
// ═══════════════════════════════════════════════════════════════
export const analyticsEventos = sqliteTable(
  'analytics_eventos',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    tipo: text('tipo').notNull(),
    dados_json: text('dados_json').notNull().default('{}'),
    criado_em: text('criado_em').notNull().default(now),
  },
  (t) => [
    index('idx_analytics_tenant').on(t.tenant_id, t.tipo, t.criado_em),
    index('idx_analytics_criado').on(t.criado_em),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 25. WHITE LABEL SETTINGS
// ═══════════════════════════════════════════════════════════════
export const whiteLabelSettings = sqliteTable(
  'white_label_settings',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    
    // Branding
    logo_url: text('logo_url'),
    logo_small_url: text('logo_small_url'),
    favicon_url: text('favicon_url'),
    
    // Cores
    cor_primaria: text('cor_primaria').default('#22c55e'),
    cor_secundaria: text('cor_secundaria').default('#16a34a'),
    cor_acento: text('cor_acento').default('#059669'),
    cor_fundo: text('cor_fundo').default('#ffffff'),
    cor_texto: text('cor_texto').default('#1f2937'),
    
    // Textos personalizados
    nome_app: text('nome_app'),
    slogan: text('slogan'),
    email_suporte: text('email_suporte'),
    telefone_suporte: text('telefone_suporte'),
    
    // SEO
    meta_titulo: text('meta_titulo'),
    meta_descricao: text('meta_descricao'),
    meta_keywords: text('meta_keywords'),
    
    // Social
    facebook_url: text('facebook_url'),
    instagram_url: text('instagram_url'),
    twitter_url: text('twitter_url'),
    linkedin_url: text('linkedin_url'),
    youtube_url: text('youtube_url'),
    
    // Configurações
    ocultar_marca_wazefit: integer('ocultar_marca_wazefit', { mode: 'boolean' }).default(false),
    custom_css: text('custom_css'),
    custom_js: text('custom_js'),
    
    // Timestamps
    criado_em: text('criado_em').notNull().default(now),
    atualizado_em: text('atualizado_em').notNull().default(now),
  },
  (t) => [
    uniqueIndex('idx_white_label_tenant').on(t.tenant_id),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 26. CUSTOM DOMAINS
// ═══════════════════════════════════════════════════════════════
export const customDomains = sqliteTable(
  'custom_domains',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    
    // Domínio
    dominio: text('dominio').notNull(),
    tipo: text('tipo', { enum: ['custom', 'subdomain'] }).notNull().default('custom'),
    
    // Status
    status: text('status', { enum: ['pending', 'verifying', 'active', 'failed'] })
      .notNull()
      .default('pending'),
    verificado: integer('verificado', { mode: 'boolean' }).default(false),
    verificado_em: text('verificado_em'),
    
    // DNS
    dns_configured: integer('dns_configured', { mode: 'boolean' }).default(false),
    dns_records_json: text('dns_records_json').default('[]'),
    
    // SSL
    ssl_status: text('ssl_status', { enum: ['pending', 'active', 'failed'] }).default('pending'),
    ssl_emitido_em: text('ssl_emitido_em'),
    ssl_expira_em: text('ssl_expira_em'),
    
    // Cloudflare
    cloudflare_zone_id: text('cloudflare_zone_id'),
    cloudflare_dns_id: text('cloudflare_dns_id'),
    
    // Validação
    validation_token: text('validation_token'),
    validation_attempts: integer('validation_attempts').default(0),
    last_validation_at: text('last_validation_at'),
    
    // Erro
    erro: text('erro'),
    
    // Timestamps
    criado_em: text('criado_em').notNull().default(now),
    atualizado_em: text('atualizado_em').notNull().default(now),
    deletado_em: text('deletado_em'),
  },
  (t) => [
    index('idx_custom_domains_tenant').on(t.tenant_id, t.status),
    index('idx_custom_domains_status').on(t.status, t.verificado),
  ],
)

// ═══════════════════════════════════════════════════════════════
// 27. DOMAIN VERIFICATION LOGS
// ═══════════════════════════════════════════════════════════════
export const domainVerificationLogs = sqliteTable(
  'domain_verification_logs',
  {
    id: text('id').primaryKey(),
    domain_id: text('domain_id')
      .notNull()
      .references(() => customDomains.id, { onDelete: 'cascade' }),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    
    // Tentativa
    tipo: text('tipo', { enum: ['dns', 'http', 'txt'] }).notNull(),
    sucesso: integer('sucesso', { mode: 'boolean' }).notNull().default(false),
    detalhes_json: text('detalhes_json').default('{}'),
    erro: text('erro'),
    
    // Timestamp
    criado_em: text('criado_em').notNull().default(now),
  },
  (t) => [
    index('idx_domain_verification_domain').on(t.domain_id, t.criado_em),
    index('idx_domain_verification_tenant').on(t.tenant_id, t.criado_em),
  ],
)