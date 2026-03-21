-- ═══════════════════════════════════════════════════════════════
-- WazeFit — Migration 0003: Sprint 4
-- Criado: 2026-03-21
-- Descrição: 6 novas tabelas — domínios custom, push notifications,
--            periodização IA, admin panel, analytics
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- 19. DOMÍNIOS TENANT (custom domains)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS dominios_tenant (
  id              TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dominio         TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'failed')),
  verificado_em   TEXT,
  ssl_status      TEXT DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'failed')),
  criado_em       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  atualizado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  deletado_em     TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dominios_dominio ON dominios_tenant(dominio) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_dominios_tenant ON dominios_tenant(tenant_id, status) WHERE deletado_em IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- 20. PUSH SUBSCRIPTIONS (web push notifications)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  user_tipo   TEXT NOT NULL CHECK (user_tipo IN ('expert', 'aluno')),
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  criado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(tenant_id, user_id);

-- ═══════════════════════════════════════════════════════════════
-- 21. NOTIFICAÇÕES (log de notificações enviadas)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notificacoes (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN ('treino', 'cobranca', 'mensagem', 'sistema')),
  titulo      TEXT NOT NULL,
  corpo       TEXT NOT NULL,
  lida        INTEGER NOT NULL DEFAULT 0,
  criado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_user ON notificacoes(tenant_id, user_id, lida, criado_em);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tenant_id, tipo, criado_em);

-- ═══════════════════════════════════════════════════════════════
-- 22. PERIODIZAÇÕES (periodização inteligente de treino)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS periodizacoes (
  id                TEXT PRIMARY KEY,
  tenant_id         TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  aluno_id          TEXT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  expert_id         TEXT NOT NULL REFERENCES experts(id) ON DELETE CASCADE,
  tipo              TEXT NOT NULL CHECK (tipo IN ('linear', 'ondulada', 'bloco', 'dup')),
  duracao_semanas   INTEGER NOT NULL,
  fase_atual        INTEGER NOT NULL DEFAULT 1,
  config_json       TEXT NOT NULL DEFAULT '{}',
  gerado_por_ia     INTEGER NOT NULL DEFAULT 0,
  criado_em         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  atualizado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  deletado_em       TEXT
);

CREATE INDEX IF NOT EXISTS idx_periodizacoes_tenant ON periodizacoes(tenant_id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_periodizacoes_aluno ON periodizacoes(aluno_id) WHERE deletado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_periodizacoes_expert ON periodizacoes(expert_id) WHERE deletado_em IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- 23. ADMIN LOGS (audit log global)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS admin_logs (
  id            TEXT PRIMARY KEY,
  admin_id      TEXT NOT NULL,
  acao          TEXT NOT NULL,
  entidade      TEXT NOT NULL,
  entidade_id   TEXT NOT NULL,
  detalhes_json TEXT,
  ip            TEXT,
  criado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id, criado_em);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entidade ON admin_logs(entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_criado ON admin_logs(criado_em);

-- ═══════════════════════════════════════════════════════════════
-- 24. ANALYTICS EVENTOS (analytics por tenant)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS analytics_eventos (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL,
  dados_json  TEXT NOT NULL DEFAULT '{}',
  criado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_analytics_tenant ON analytics_eventos(tenant_id, tipo, criado_em);
CREATE INDEX IF NOT EXISTS idx_analytics_criado ON analytics_eventos(criado_em);

-- ═══════════════════════════════════════════════════════════════
-- RESUMO Sprint 4
-- ═══════════════════════════════════════════════════════════════
-- 6 novas tabelas: dominios_tenant, push_subscriptions, notificacoes,
--   periodizacoes, admin_logs, analytics_eventos
-- 12 novos índices
-- Total acumulado: 24 tabelas, 53 índices
-- ═══════════════════════════════════════════════════════════════
