-- ═══════════════════════════════════════════════════════════════
-- WazeFit — Migration 0002: Sprint 3
-- Criado: 2026-03-21
-- Descrição: 7 novas tabelas — nutrição, avaliações, briefing
--            perguntas, LLM jobs, tenant config
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- 12. PLANOS NUTRICIONAIS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS planos_nutricionais (
  id              TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  aluno_id        TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  expert_id       TEXT NOT NULL REFERENCES experts(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  objetivo        TEXT,
  calorias_diarias INTEGER,
  proteina_g      REAL,
  carboidrato_g   REAL,
  gordura_g       REAL,
  observacoes     TEXT,
  ativo           INTEGER NOT NULL DEFAULT 1,
  criado_em       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  atualizado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  deletado_em     TEXT
);

CREATE INDEX IF NOT EXISTS idx_planos_nutricionais_tenant ON planos_nutricionais(tenant_id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_planos_nutricionais_aluno ON planos_nutricionais(aluno_id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_planos_nutricionais_expert ON planos_nutricionais(expert_id) WHERE deletado_em IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- 13. REFEIÇÕES
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS refeicoes (
  id          TEXT PRIMARY KEY,
  plano_id    TEXT NOT NULL REFERENCES planos_nutricionais(id) ON DELETE CASCADE,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  horario     TEXT,
  ordem       INTEGER NOT NULL DEFAULT 0,
  criado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_refeicoes_plano ON refeicoes(plano_id);
CREATE INDEX IF NOT EXISTS idx_refeicoes_tenant ON refeicoes(tenant_id);

-- ═══════════════════════════════════════════════════════════════
-- 14. ALIMENTOS DA REFEIÇÃO
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS alimentos_refeicao (
  id            TEXT PRIMARY KEY,
  refeicao_id   TEXT NOT NULL REFERENCES refeicoes(id) ON DELETE CASCADE,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  quantidade    REAL NOT NULL,
  unidade       TEXT NOT NULL,
  calorias      REAL,
  proteina_g    REAL,
  carboidrato_g REAL,
  gordura_g     REAL,
  observacao    TEXT
);

CREATE INDEX IF NOT EXISTS idx_alimentos_refeicao ON alimentos_refeicao(refeicao_id);
CREATE INDEX IF NOT EXISTS idx_alimentos_tenant ON alimentos_refeicao(tenant_id);

-- ═══════════════════════════════════════════════════════════════
-- 15. AVALIAÇÕES (anamnese, física, bioimpedância)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS avaliacoes (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  aluno_id      TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  expert_id     TEXT NOT NULL REFERENCES experts(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL CHECK (tipo IN ('anamnese', 'fisica', 'bioimpedancia')),
  data          TEXT NOT NULL,
  dados_json    TEXT NOT NULL DEFAULT '{}',
  observacoes   TEXT,
  criado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  atualizado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  deletado_em   TEXT
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_tenant ON avaliacoes(tenant_id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_avaliacoes_aluno ON avaliacoes(aluno_id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_avaliacoes_tipo ON avaliacoes(tenant_id, tipo) WHERE deletado_em IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- 16. BRIEFING PERGUNTAS (perguntas individuais do briefing)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS briefing_perguntas (
  id          TEXT PRIMARY KEY,
  briefing_id TEXT NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  pergunta    TEXT NOT NULL,
  resposta    TEXT,
  ordem       INTEGER NOT NULL DEFAULT 0,
  criado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_briefing_perguntas_briefing ON briefing_perguntas(briefing_id);
CREATE INDEX IF NOT EXISTS idx_briefing_perguntas_tenant ON briefing_perguntas(tenant_id);

-- ═══════════════════════════════════════════════════════════════
-- 17. LLM JOBS (fila de processamento IA)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS llm_jobs (
  id              TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL CHECK (tipo IN ('briefing', 'treino', 'dieta', 'avaliacao')),
  input_json      TEXT NOT NULL DEFAULT '{}',
  output_json     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  tokens_input    INTEGER,
  tokens_output   INTEGER,
  custo_centavos  INTEGER,
  erro            TEXT,
  criado_em       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  completado_em   TEXT
);

CREATE INDEX IF NOT EXISTS idx_llm_jobs_tenant ON llm_jobs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_llm_jobs_status ON llm_jobs(status, criado_em);

-- ═══════════════════════════════════════════════════════════════
-- 18. TENANT CONFIG (white label)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tenant_config (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  chave         TEXT NOT NULL,
  valor         TEXT,
  criado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  atualizado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_config_unico ON tenant_config(tenant_id, chave);
CREATE INDEX IF NOT EXISTS idx_tenant_config_tenant ON tenant_config(tenant_id);

-- ═══════════════════════════════════════════════════════════════
-- RESUMO Sprint 3
-- ═══════════════════════════════════════════════════════════════
-- 7 novas tabelas: planos_nutricionais, refeicoes,
--   alimentos_refeicao, avaliacoes, briefing_perguntas,
--   llm_jobs, tenant_config
-- 14 novos índices
-- Total acumulado: 18 tabelas, 41 índices
-- ═══════════════════════════════════════════════════════════════
