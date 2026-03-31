/**
 * Types: White Label & Custom Domains
 */

// ═══════════════════════════════════════════════════════════════
// WHITE LABEL
// ═══════════════════════════════════════════════════════════════
export interface WhiteLabelSettings {
  id: string
  tenant_id: string
  
  // Branding
  logo_url?: string
  logo_small_url?: string
  favicon_url?: string
  
  // Cores
  cor_primaria: string
  cor_secundaria: string
  cor_acento: string
  cor_fundo: string
  cor_texto: string
  
  // Textos
  nome_app?: string
  slogan?: string
  email_suporte?: string
  telefone_suporte?: string
  
  // SEO
  meta_titulo?: string
  meta_descricao?: string
  meta_keywords?: string
  
  // Social
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  linkedin_url?: string
  youtube_url?: string
  
  // Config
  ocultar_marca_wazefit: boolean
  custom_css?: string
  custom_js?: string
  
  // Timestamps
  criado_em: string
  atualizado_em: string
}

export interface WhiteLabelUpdateInput {
  // Branding (URLs serão geradas após upload)
  cor_primaria?: string
  cor_secundaria?: string
  cor_acento?: string
  cor_fundo?: string
  cor_texto?: string
  
  // Textos
  nome_app?: string
  slogan?: string
  email_suporte?: string
  telefone_suporte?: string
  
  // SEO
  meta_titulo?: string
  meta_descricao?: string
  meta_keywords?: string
  
  // Social
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  linkedin_url?: string
  youtube_url?: string
  
  // Config
  ocultar_marca_wazefit?: boolean
  custom_css?: string
  custom_js?: string
}

// ═══════════════════════════════════════════════════════════════
// CUSTOM DOMAINS
// ═══════════════════════════════════════════════════════════════
export interface CustomDomain {
  id: string
  tenant_id: string
  dominio: string
  tipo: 'custom' | 'subdomain'
  status: 'pending' | 'verifying' | 'active' | 'failed'
  verificado: boolean
  verificado_em?: string
  dns_configured: boolean
  dns_records: DNSRecord[]
  ssl_status: 'pending' | 'active' | 'failed'
  ssl_emitido_em?: string
  ssl_expira_em?: string
  cloudflare_zone_id?: string
  cloudflare_dns_id?: string
  validation_token?: string
  validation_attempts: number
  last_validation_at?: string
  erro?: string
  criado_em: string
  atualizado_em: string
}

export interface DNSRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT'
  name: string
  value: string
  priority?: number
  ttl?: number
}

export interface CustomDomainCreateInput {
  dominio: string
  tipo?: 'custom' | 'subdomain'
}

export interface DomainVerificationResult {
  success: boolean
  dns_configured: boolean
  ssl_ready: boolean
  errors?: string[]
  dns_records?: DNSRecord[]
}

export interface DomainVerificationLog {
  id: string
  domain_id: string
  tenant_id: string
  tipo: 'dns' | 'http' | 'txt'
  sucesso: boolean
  detalhes: Record<string, unknown>
  erro?: string
  criado_em: string
}

// ═══════════════════════════════════════════════════════════════
// LIMITES POR PLANO
// ═══════════════════════════════════════════════════════════════
export const DOMAIN_LIMITS: Record<string, number> = {
  trial: 0,
  starter: 0,
  pro: 1,
  enterprise: 5,
}

export const WHITE_LABEL_FEATURES: Record<string, { custom_domain: boolean; hide_branding: boolean }> = {
  trial: { custom_domain: false, hide_branding: false },
  starter: { custom_domain: false, hide_branding: false },
  pro: { custom_domain: true, hide_branding: false },
  enterprise: { custom_domain: true, hide_branding: true },
}
