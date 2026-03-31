/**
 * Bindings do ambiente Cloudflare Workers.
 * Cada binding corresponde a um recurso configurado no wrangler.toml.
 */
export interface Env {
  // ── D1 Database ──
  DB: D1Database

  // ── KV Namespaces ──
  KV_SESSIONS: KVNamespace
  KV_TENANTS: KVNamespace
  KV_JOBS: KVNamespace

  // ── R2 Storage ──
  R2_PRIVATE: R2Bucket
  R2_BUCKET: R2Bucket
  R2_PUBLIC_URL: string

  // ── Queues ──
  QUEUE_NOTIFY: Queue
  QUEUE_LLM: Queue
  QUEUE_EMAILS: Queue
  QUEUE_WEBHOOKS: Queue

  // ── Secrets ──
  JWT_SECRET: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  ANTHROPIC_API_KEY: string
  SENDGRID_API_KEY: string
  ADMIN_SECRET: string
  CLOUDFLARE_API_TOKEN: string
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_PAGES_PROJECT: string

  // ── Variáveis ──
  ENVIRONMENT: string
}

/**
 * Variáveis injetadas no contexto Hono pelo middleware de auth.
 */
export interface AuthVariables {
  tenant_id: string
  user_id: string
  role: 'expert' | 'aluno' | 'admin'
  email: string
  tenant_domain?: string | null
  tenant_source?: 'jwt' | 'custom_domain' | 'subdomain' | 'default'
}
