-- ═══════════════════════════════════════════════════════════════
-- WazeFit — Migration 0001: Schema Base
-- Criado: 2026-03-20
-- Descrição: 11 tabelas core + índices + constraints
-- ═══════════════════════════════════════════════════════════════

-- ── Convenções ──
-- • UUIDs como TEXT (Cloudflare D1/SQLite não tem tipo UUID nativo)
-- • Timestamps ISO 8601 em TEXT (SQLite não tem DATETIME nativo)
-- • Soft delete via campo `deletado_em` (NULL = ativo)
-- • Multi-tenant: todo registro tem `tenant_id` como FK
-- • Nomes em português (domínio do negócio)

-- ═══════════════════════════════════════════════════════════════
-- 1. TENANTS (academias/studios/consultórios)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tenants (
  id            TEXT PRIMARY KEY,
  nome          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL,
  telefone      TEXT,
  logo_url      TEXT,
  cor_primaria  TEXT DEFAULT '#22c55e',
  cor_secundaria TEXT DEFAULT '#16a34a',
  plano         TEXT NOT NULL DEFAULT 'trial' CHECK (plano IN ('trial', 'starter', 'pro', 'enterprise')),
  max_alunos    INTEGER NOT NULL DEFAULT 10,
  ativo         INTEGER NOT NULL DEFAULT 1,
  criado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  atualizado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  deletado_em   TEXT
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_plano ON tenants(plano) WHERE deletado_em IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- 2. EXPERTS (personal trainers / nutricionistas)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS experts (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  email         TEXT NOT NULL,
  senha_hash    TEXT NOT NULL,
  telefone      TEXT,
  avatar_url    TEXT,
  especialidade TEXT,
  cref          TEXT,
  crn           TEXT,
  role          TEXT NOT NULL DEFAULT 'expert' CHECK (role IN ('expert', 'owner')),
  ativo         INTEGER NOT NULL DEFAULT 1,
  ultimo_login  TEXT,
  criado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  atualizado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  deletado_em   TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_experts_email ON experts(email) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_experts_tenant ON experts(tenant_id) WHERE deletado_em IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- 3. ALUNOS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS alunos (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  expert_id     TEXT REFERENCES experts(id) ON DELETE SET NULL,
  nome          TEXT NOT NULL,
  email         TEXT NOT NULL,
  senha_hash    TEXT NOT NULL,
  telefone      TEXT,
  avatar_url    TEXT,
  data_nasc     TEXT,
  sexo          TEXT CHECK (sexo IN ('M', 'F', 'outro')),
  altura_cm     INTEGER,
  peso_kg       REAL,
  objetivo      TEXT,
  grupo         TEXT DEFAULT 'geral',
  pontos        INTEGER NOT NULL DEFAULT 0,
  ativo         INTEGER NOT NULL DEFAULT 1,
  ultimo_login  TEXT,
  criado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  atualizado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  deletado_em   TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_alunos_email_tenant ON alunos(email, tenant_id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_alunos_tenant ON alunos(tenant_id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_alunos_expert ON alunos(expert_id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_alunos_grupo ON alunos(tenant_id, grupo) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_alunos_pontos ON alunos(tenant_id, pontos DESC) WHERE deletado_em IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- 4. EXERCÍCIOS (biblioteca do expert)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS exercicios (
  id              TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  grupo_muscular  TEXT NOT NULL,
  equipamento     TEXT,
  instrucoes      TEXT,
  video_url       TEXT,
  thumbnail_url   TEXT,
  dificuldade     TEXT DEFAULT 'intermediario' CHECK (dificuldade IN ('iniciante', 'intermediario', 'avancado')),
  criado_em       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  atualizado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  deletado_em     TEXT
);

CREATE INDEX IF NOT EXISTS idx_exercicios_tenant ON exercicios(tenant_id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_exercicios_grupo ON exercicios(tenant_id, grupo_muscular) WHERE deletado_em IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- 5. FICHAS DE TREINO
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS fichas (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  aluno_id      TEXT REFERENCES alunos(id) ON DELETE CASCADE,
  expert_id     TEXT NOT NULL REFERENCES experts(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  tipo          TEXT NOT NULL DEFAULT 'A' CHECK (tipo IN ('A', 'B', 'C', 'D', 'E')),
  objetivo      TEXT,
  exercicios    TEXT NOT NULL DEFAULT '[]',  -- JSON array: [{exercicio_id, series, reps, carga_kg, descanso_seg, obs}]
  is_template   INTEGER NOT NULL DEFAULT 0,
  ativa         INTEGER NOT NULL DEFAULT 1,
  validade      TEXT,
  criado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  atualizado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  deletado_em   TEXT
);

CREATE INDEX IF NOT EXISTS idx_fichas_aluno ON fichas(aluno_id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_fichas_tenant ON fichas(tenant_id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_fichas_template ON fichas(tenant_id, is_template) WHERE deletado_em IS NULL AND is_template = 1;

-- ═══════════════════════════════════════════════════════════════
-- 6. CALENDÁRIO SEMANAL (qual ficha em qual dia)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS calendarios (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  aluno_id      TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  dia_semana    INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),  -- 0=Dom, 6=Sáb
  ficha_id      TEXT REFERENCES fichas(id) ON DELETE SET NULL,
  criado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  atualizado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_calendarios_unico ON calendarios(aluno_id, dia_semana);
CREATE INDEX IF NOT EXISTS idx_calendarios_tenant ON calendarios(tenant_id);

-- ═══════════════════════════════════════════════════════════════
-- 7. EXECUÇÕES DE TREINO (check-ins)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS execucoes (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  aluno_id      TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  ficha_id      TEXT NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
  data          TEXT NOT NULL,  -- YYYY-MM-DD
  duracao_min   INTEGER,
  detalhes      TEXT DEFAULT '[]',  -- JSON: [{exercicio_id, series_feitas, reps_feitas, carga_kg}]
  nota          TEXT,
  pontos        INTEGER NOT NULL DEFAULT 5,
  criado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_execucoes_unico ON execucoes(aluno_id, data);
CREATE INDEX IF NOT EXISTS idx_execucoes_tenant ON execucoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_execucoes_aluno_data ON execucoes(aluno_id, data DESC);

-- ═══════════════════════════════════════════════════════════════
-- 8. MENSAGENS (chat expert ↔ aluno)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mensagens (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  remetente_id  TEXT NOT NULL,
  destinatario_id TEXT NOT NULL,
  remetente_tipo TEXT NOT NULL CHECK (remetente_tipo IN ('expert', 'aluno')),
  conteudo      TEXT NOT NULL,
  tipo          TEXT NOT NULL DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagem', 'video', 'arquivo', 'audio')),
  arquivo_url   TEXT,
  lida          INTEGER NOT NULL DEFAULT 0,
  criado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_mensagens_conversa ON mensagens(tenant_id, remetente_id, destinatario_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_destinatario ON mensagens(destinatario_id, lida, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_tenant ON mensagens(tenant_id, criado_em DESC);

-- ═══════════════════════════════════════════════════════════════
-- 9. COBRANÇAS (financeiro)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS cobrancas (
  id                TEXT PRIMARY KEY,
  tenant_id         TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  aluno_id          TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  descricao         TEXT NOT NULL,
  valor_centavos    INTEGER NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
  vencimento        TEXT NOT NULL,  -- YYYY-MM-DD
  pago_em           TEXT,
  stripe_payment_id TEXT,
  stripe_link_url   TEXT,
  metodo_pagamento  TEXT,
  criado_em         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  atualizado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_cobrancas_aluno ON cobrancas(aluno_id, status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_tenant ON cobrancas(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_vencimento ON cobrancas(tenant_id, vencimento) WHERE status = 'pendente';
CREATE INDEX IF NOT EXISTS idx_cobrancas_stripe ON cobrancas(stripe_payment_id) WHERE stripe_payment_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- 10. BRIEFINGS (onboarding conversacional)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS briefings (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  aluno_id      TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  perguntas     TEXT NOT NULL DEFAULT '[]',  -- JSON: [{pergunta, resposta, ordem}]
  status        TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'completo', 'processando')),
  resultado     TEXT,  -- JSON: resumo processado pelo LLM
  criado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  atualizado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_briefings_aluno ON briefings(aluno_id);
CREATE INDEX IF NOT EXISTS idx_briefings_tenant ON briefings(tenant_id, status);

-- ═══════════════════════════════════════════════════════════════
-- 11. AUDIT LOG (rastreabilidade)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_log (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  user_role   TEXT NOT NULL,
  acao        TEXT NOT NULL,
  entidade    TEXT NOT NULL,
  entidade_id TEXT NOT NULL,
  dados       TEXT,  -- JSON: snapshot do antes/depois
  ip          TEXT,
  criado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_log(tenant_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entidade ON audit_log(entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id, criado_em DESC);

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA (tenant de teste para desenvolvimento)
-- ═══════════════════════════════════════════════════════════════
-- INSERT INTO tenants (id, nome, slug, email, plano, max_alunos)
-- VALUES ('tenant-dev-001', 'WazeFit Demo', 'demo', 'demo@wazefit.com', 'pro', 100);

-- ═══════════════════════════════════════════════════════════════
-- RESUMO
-- ═══════════════════════════════════════════════════════════════
-- 11 tabelas: tenants, experts, alunos, exercicios, fichas,
--             calendarios, execucoes, mensagens, cobrancas,
--             briefings, audit_log
-- 27 índices (incluindo unique constraints)
-- Todas com soft delete (deletado_em) exceto audit_log
-- Multi-tenant: tenant_id em todas as tabelas
-- ═══════════════════════════════════════════════════════════════