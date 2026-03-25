/**
 * Rotas de configuração do tenant (white label).
 *
 * GET  /api/v1/tenant/config   — Retornar configurações (auth)
 * PUT  /api/v1/tenant/config   — Atualizar configurações (expert only)
 * GET  /api/v1/tenant/branding — Branding público (sem auth, para PWA)
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, isNull } from 'drizzle-orm'
import type { Env, AuthVariables } from '../types'
import { createDB } from '../db/client'
import { tenantConfig, tenants, dominiosTenant } from '../db/schema'
import { generateId, now } from '../lib/id'
import { authMiddleware, expertOnly } from '../middleware/auth'

const tenantRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

const BRANDING_KEYS = [
  'cor_primaria',
  'cor_secundaria',
  'logo_url',
  'nome_exibicao',
  'favicon_url',
  'descricao',
] as const

const updateConfigSchema = z.object({
  cor_primaria: z.string().optional(),
  cor_secundaria: z.string().optional(),
  logo_url: z.string().url().optional(),
  nome_exibicao: z.string().min(1).optional(),
  favicon_url: z.string().url().optional(),
  descricao: z.string().optional(),
})

const brandingQuery = z.object({
  slug: z.string().min(1, 'Slug do tenant é obrigatório.'),
})

// GET /tenant/config — Retornar configurações (auth required)
tenantRouter.get('/config', authMiddleware, async (c) => {
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)

  const configs = await db.select().from(tenantConfig)
    .where(eq(tenantConfig.tenant_id, tenantId))

  const result: Record<string, string | null> = {}
  for (const cfg of configs) {
    result[cfg.chave] = cfg.valor
  }

  return c.json({ tenant_id: tenantId, config: result })
})

// PUT /tenant/config — Atualizar configurações (expert only)
tenantRouter.put('/config', authMiddleware, expertOnly, zValidator('json', updateConfigSchema), async (c) => {
  const body = c.req.valid('json')
  const tenantId = c.get('tenant_id')
  const db = createDB(c.env.DB)
  const timestamp = now()

  const entries = Object.entries(body).filter(([, v]) => v !== undefined)

  for (const [chave, valor] of entries) {
    const existing = await db.select({ id: tenantConfig.id }).from(tenantConfig)
      .where(and(eq(tenantConfig.tenant_id, tenantId), eq(tenantConfig.chave, chave))).get()

    if (existing) {
      await db.update(tenantConfig)
        .set({ valor: valor as string, atualizado_em: timestamp })
        .where(eq(tenantConfig.id, existing.id))
    } else {
      await db.insert(tenantConfig).values({
        id: generateId(), tenant_id: tenantId, chave,
        valor: valor as string, criado_em: timestamp, atualizado_em: timestamp,
      })
    }
  }

  // Retornar config atualizada
  const configs = await db.select().from(tenantConfig)
    .where(eq(tenantConfig.tenant_id, tenantId))

  const result: Record<string, string | null> = {}
  for (const cfg of configs) {
    result[cfg.chave] = cfg.valor
  }

  return c.json({ tenant_id: tenantId, config: result })
})

// GET /tenant/branding — Branding público (sem auth, para PWA)
tenantRouter.get('/branding', zValidator('query', brandingQuery), async (c) => {
  const { slug } = c.req.valid('query')
  const db = createDB(c.env.DB)

  // Buscar tenant pelo slug
  const tenant = await db.select({ id: tenants.id, nome: tenants.nome, slug: tenants.slug, logo_url: tenants.logo_url, cor_primaria: tenants.cor_primaria, cor_secundaria: tenants.cor_secundaria })
    .from(tenants).where(eq(tenants.slug, slug)).get()

  if (!tenant) return c.json({ error: 'Tenant não encontrado.', code: 404 }, 404)

  // Buscar configs de branding
  const configs = await db.select().from(tenantConfig)
    .where(eq(tenantConfig.tenant_id, tenant.id))

  const configMap: Record<string, string | null> = {}
  for (const cfg of configs) {
    if ((BRANDING_KEYS as readonly string[]).includes(cfg.chave)) {
      configMap[cfg.chave] = cfg.valor
    }
  }

  return c.json({
    nome: configMap['nome_exibicao'] ?? tenant.nome,
    slug: tenant.slug,
    logo_url: configMap['logo_url'] ?? tenant.logo_url,
    favicon_url: configMap['favicon_url'] ?? null,
    cor_primaria: configMap['cor_primaria'] ?? tenant.cor_primaria,
    cor_secundaria: configMap['cor_secundaria'] ?? tenant.cor_secundaria,
    descricao: configMap['descricao'] ?? null,
  })
})

// GET /tenant/branding-by-host — Branding público por hostname (sem auth)
tenantRouter.get('/branding-by-host', async (c) => {
  const host = c.req.query('host')
  if (!host) return c.json({ error: 'Parâmetro host é obrigatório.', code: 400 }, 400)

  const db = createDB(c.env.DB)
  let tenantRow: { id: string; nome: string; slug: string; logo_url: string | null; cor_primaria: string | null; cor_secundaria: string | null } | undefined

  // Check if it's a *.wazefit.com subdomain
  const wazeMatch = host.match(/^([a-z0-9-]+)\.wazefit\.com$/)
  if (wazeMatch && wazeMatch[1] !== 'www' && wazeMatch[1] !== 'api') {
    const slug = wazeMatch[1]!
    tenantRow = await db.select({
      id: tenants.id,
      nome: tenants.nome,
      slug: tenants.slug,
      logo_url: tenants.logo_url,
      cor_primaria: tenants.cor_primaria,
      cor_secundaria: tenants.cor_secundaria,
    }).from(tenants).where(eq(tenants.slug, slug)).get()
  } else {
    // Custom domain lookup
    const dominio = await db.select({
      tenant_id: dominiosTenant.tenant_id,
    }).from(dominiosTenant)
      .where(and(eq(dominiosTenant.dominio, host), eq(dominiosTenant.status, 'active'), isNull(dominiosTenant.deletado_em)))
      .get()

    if (dominio) {
      tenantRow = await db.select({
        id: tenants.id,
        nome: tenants.nome,
        slug: tenants.slug,
        logo_url: tenants.logo_url,
        cor_primaria: tenants.cor_primaria,
        cor_secundaria: tenants.cor_secundaria,
      }).from(tenants).where(eq(tenants.id, dominio.tenant_id)).get()
    }
  }

  if (!tenantRow) return c.json({ error: 'Tenant não encontrado.', code: 404 }, 404)

  // Fetch branding configs
  const configs = await db.select().from(tenantConfig)
    .where(eq(tenantConfig.tenant_id, tenantRow.id))

  const configMap: Record<string, string | null> = {}
  for (const cfg of configs) {
    if ((BRANDING_KEYS as readonly string[]).includes(cfg.chave)) {
      configMap[cfg.chave] = cfg.valor
    }
  }

  return c.json({
    nome: configMap['nome_exibicao'] ?? tenantRow.nome,
    slug: tenantRow.slug,
    logo_url: configMap['logo_url'] ?? tenantRow.logo_url,
    favicon_url: configMap['favicon_url'] ?? null,
    cor_primaria: configMap['cor_primaria'] ?? tenantRow.cor_primaria,
    cor_secundaria: configMap['cor_secundaria'] ?? tenantRow.cor_secundaria,
    descricao: configMap['descricao'] ?? null,
  })
})

export { tenantRouter }
