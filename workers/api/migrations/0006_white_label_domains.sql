-- Migration 0006: White Label + Custom Domains
-- Criado em: 2026-03-27

-- ═══════════════════════════════════════════════════════════════
-- 1. WHITE LABEL SETTINGS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS white_label_settings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Branding
  logo_url TEXT,
  logo_small_url TEXT,
  favicon_url TEXT,
  
  -- Cores
  cor_primaria TEXT DEFAULT '#22c55e',
  cor_secundaria TEXT DEFAULT '#16a34a',
  cor_acento TEXT DEFAULT '#059669',
  cor_fundo TEXT DEFAULT '#ffffff',
  cor_texto TEXT DEFAULT '#1f2937',
  
  -- Textos personalizados
  nome_app TEXT,
  slogan TEXT,
  email_suporte TEXT,
  telefone_suporte TEXT,
  
  -- SEO
  meta_titulo TEXT,
  meta_descricao TEXT,
  meta_keywords TEXT,
  
  -- Social
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  youtube_url TEXT,
  
  -- Configurações
  ocultar_marca_wazefit INTEGER DEFAULT 0, -- boolean (plano enterprise)
  custom_css TEXT,
  custom_js TEXT,
  
  -- Timestamps
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  atualizado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE UNIQUE INDEX idx_white_label_tenant ON white_label_settings(tenant_id);

-- ═══════════════════════════════════════════════════════════════
-- 2. CUSTOM DOMAINS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS custom_domains (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Domínio
  dominio TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'custom', -- 'custom' | 'subdomain'
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'verifying' | 'active' | 'failed'
  verificado INTEGER DEFAULT 0, -- boolean
  verificado_em TEXT,
  
  -- DNS
  dns_configured INTEGER DEFAULT 0, -- boolean
  dns_records_json TEXT DEFAULT '[]', -- [{type, name, value, priority}]
  
  -- SSL
  ssl_status TEXT DEFAULT 'pending', -- 'pending' | 'active' | 'failed'
  ssl_emitido_em TEXT,
  ssl_expira_em TEXT,
  
  -- Cloudflare
  cloudflare_zone_id TEXT,
  cloudflare_dns_id TEXT,
  
  -- Validação
  validation_token TEXT, -- token para validação via TXT
  validation_attempts INTEGER DEFAULT 0,
  last_validation_at TEXT,
  
  -- Erro
  erro TEXT,
  
  -- Timestamps
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  atualizado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  deletado_em TEXT
);

CREATE UNIQUE INDEX idx_custom_domains_dominio ON custom_domains(dominio) WHERE deletado_em IS NULL;
CREATE INDEX idx_custom_domains_tenant ON custom_domains(tenant_id, status);
CREATE INDEX idx_custom_domains_status ON custom_domains(status, verificado);

-- ═══════════════════════════════════════════════════════════════
-- 3. DOMAIN VERIFICATION LOGS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS domain_verification_logs (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL REFERENCES custom_domains(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Tentativa
  tipo TEXT NOT NULL, -- 'dns' | 'http' | 'txt'
  sucesso INTEGER NOT NULL DEFAULT 0, -- boolean
  detalhes_json TEXT DEFAULT '{}',
  erro TEXT,
  
  -- Timestamp
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_domain_verification_domain ON domain_verification_logs(domain_id, criado_em);
CREATE INDEX idx_domain_verification_tenant ON domain_verification_logs(tenant_id, criado_em);

-- ═══════════════════════════════════════════════════════════════
-- 4. Seed: Criar white_label_settings padrão para tenants existentes
-- ═══════════════════════════════════════════════════════════════
INSERT INTO white_label_settings (id, tenant_id, nome_app, email_suporte)
SELECT 
  'wl_' || id,
  id,
  nome,
  email
FROM tenants
WHERE NOT EXISTS (
  SELECT 1 FROM white_label_settings WHERE tenant_id = tenants.id
);
